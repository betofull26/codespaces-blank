import { Router } from 'express';
import { createMessage, ingestWhatsAppMessage, listAgents, getConversationsByAgentId, listMessagesByConversationId, listConversations } from '../../../application/useCases.js';
import { buildErrorResponse, buildSuccessResponse } from '../../../common/apiResponse.js';
import { config } from '../../../common/config.js';
import { authenticateRequest } from '../middleware/authMiddleware.js';
import { requireHttps } from '../middleware/requireHttps.js';
import { PostgresAgentRepository, PostgresConversationRepository, PostgresMessageRepository } from '../../../infrastructure/database/repositories.js';
import { getIo } from '../../../infrastructure/realtime/socket.js';
import { parseMetaWebhook } from '../adapters/whatsappAdapter.js';
import { sanitizeInbound, sanitizeSendPayload } from '../validators/whatsappValidator.js';
import { verifyWebhookSignature } from '../middleware/verifyWebhookSignature.js';
import { sendTextMessage, getMetrics as getWhatsAppMetrics } from '../../whatsapp/whatsappClient.js';
import { verifyMetaWebhook } from '../controllers/whatsappWebhookController.js';

export const agentConversationRouter = Router();

const exchangeMetaSignupCode = async (code: string, redirectUri: string) => {
  const url = new URL(`https://graph.facebook.com/${config.metaGraphVersion}/oauth/access_token`);
  url.searchParams.set('client_id', config.metaAppId);
  url.searchParams.set('client_secret', config.metaAppSecret);
  url.searchParams.set('code', code);
  if (redirectUri) {
    url.searchParams.set('redirect_uri', redirectUri);
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
  });

  const payload = await response.json().catch(() => null);
  return { ok: response.ok, status: response.status, payload };
};

agentConversationRouter.get('/agents', async (_req, res) => {
  try {
    const repository = new PostgresAgentRepository();
    const agents = await listAgents(repository);
    res.json(buildSuccessResponse(agents, 'Agentes obtenidos correctamente'));
  } catch (error) {
    res.status(500).json(buildErrorResponse('No se pudieron obtener los agentes', error instanceof Error ? error.message : 'UNKNOWN_ERROR'));
  }
});

agentConversationRouter.get('/conversations', async (_req, res) => {
  try {
    const repository = new PostgresConversationRepository();
    const conversations = await listConversations(repository);
    res.json(buildSuccessResponse(conversations, 'Conversaciones obtenidas correctamente'));
  } catch (error) {
    res.status(500).json(buildErrorResponse('No se pudieron obtener las conversaciones', error instanceof Error ? error.message : 'UNKNOWN_ERROR'));
  }
});

agentConversationRouter.get('/agents/:id/conversations', async (req, res) => {
  try {
    const repository = new PostgresConversationRepository();
    const conversations = await getConversationsByAgentId(repository, req.params.id);
    res.json(buildSuccessResponse(conversations, 'Conversaciones obtenidas correctamente'));
  } catch (error) {
    res.status(500).json(buildErrorResponse('No se pudieron obtener las conversaciones', error instanceof Error ? error.message : 'UNKNOWN_ERROR'));
  }
});

agentConversationRouter.get('/conversations/:id/messages', async (req, res) => {
  try {
    const repository = new PostgresMessageRepository();
    const messages = await listMessagesByConversationId(repository, req.params.id);
    res.json(buildSuccessResponse(messages, 'Mensajes obtenidos correctamente'));
  } catch (error) {
    res.status(500).json(buildErrorResponse('No se pudieron obtener los mensajes', error instanceof Error ? error.message : 'UNKNOWN_ERROR'));
  }
});

agentConversationRouter.get('/whatsapp/metrics', async (_req, res) => {
  try {
    const m = getWhatsAppMetrics();
    res.json(buildSuccessResponse(m, 'WhatsApp metrics'));
  } catch (e) {
    res.status(500).json(buildErrorResponse('Could not get metrics', e instanceof Error ? e.message : 'UNKNOWN_ERROR'));
  }
});

agentConversationRouter.post('/waba/onboard/exchange', async (req, res) => {
  try {
    await authenticateRequest(req as any, res, async () => {
      if (!config.metaAppId || !config.metaAppSecret) {
        return res.status(500).json(buildErrorResponse('Configuración de Meta incompleta en el backend', 'META_CONFIG_MISSING'));
      }

      const payload = req.body ?? {};
      const code = typeof payload.code === 'string' && payload.code.trim() ? payload.code.trim() : null;

      if (!code) {
        return res.status(400).json(buildErrorResponse('Código de registro de WhatsApp no proporcionado', 'MISSING_CODE'));
      }

      const redirectUri = config.metaOauthRedirectUri || (req.headers.origin as string) || '';
      const result = await exchangeMetaSignupCode(code, redirectUri);

      if (!result.ok) {
        return res.status(result.status || 500).json(buildErrorResponse('No se pudo intercambiar el código de Meta', 'GRAPH_API_ERROR'));
      }

      // En este paso 1 solo validamos el intercambio de código. En la siguiente etapa se deben
      // almacenar los datos de WABA obtenidos y continuar con el onboarding completo.
      return res.status(200).json(buildSuccessResponse({ success: true, tokenData: result.payload }, 'Código intercambiado correctamente'));
    });
  } catch (error) {
    res.status(500).json(buildErrorResponse('No se pudo procesar el código de onboarding de WhatsApp', error instanceof Error ? error.message : 'UNKNOWN_ERROR'));
  }
});

agentConversationRouter.post('/whatsapp/inbound', requireHttps, verifyWebhookSignature, async (req, res) => {
  try {
    const raw = req.body ?? {};
    const parsed = parseMetaWebhook(raw) ?? raw;
    const sanitized = sanitizeInbound(parsed);
    if (!sanitized.ok) {
      return res.status(400).json(sanitized.error);
    }
    const payload = sanitized.value;

    const conversationRepository = new PostgresConversationRepository();
    const messageRepository = new PostgresMessageRepository();
    const result = await ingestWhatsAppMessage(conversationRepository, messageRepository, payload as any);

    // emit realtime event
    try {
      const io = getIo();
      io.emit('message.created', { conversationId: result.conversation.id, message: result.message });
    } catch (e) {
      // ignore if realtime not initialized
    }

    res.status(201).json(buildSuccessResponse({
      conversation: result.conversation,
      message: result.message,
    }, 'Mensaje de WhatsApp procesado correctamente'));
  } catch (error) {
    res.status(500).json(buildErrorResponse('No se pudo procesar el mensaje de WhatsApp', error instanceof Error ? error.message : 'UNKNOWN_ERROR'));
  }
});

// Meta verification endpoint for webhook subscription. This route must not use
// signature verification middleware because Meta's initial GET does not send a signature.
agentConversationRouter.get('/whatsapp/webhook', verifyMetaWebhook);

// Backwards-compatible webhook path used by frontend tests/tools
agentConversationRouter.post('/whatsapp/webhook', requireHttps, verifyWebhookSignature, async (req, res) => {
  try {
    const raw = req.body ?? {};
    const parsed = parseMetaWebhook(raw) ?? raw;
    const sanitized = sanitizeInbound(parsed);
    if (!sanitized.ok) {
      return res.status(400).json(sanitized.error);
    }
    const payload = sanitized.value;

    const conversationRepository = new PostgresConversationRepository();
    const messageRepository = new PostgresMessageRepository();
    const result = await ingestWhatsAppMessage(conversationRepository, messageRepository, payload as any);

    try {
      const io = getIo();
      io.emit('message.created', { conversationId: result.conversation.id, message: result.message });
    } catch (e) {}

    res.status(201).json(buildSuccessResponse({
      conversation: result.conversation,
      message: result.message,
    }, 'Webhook de WhatsApp procesado correctamente'));
  } catch (error) {
    res.status(500).json(buildErrorResponse('No se pudo procesar el webhook de WhatsApp', error instanceof Error ? error.message : 'UNKNOWN_ERROR'));
  }
});

agentConversationRouter.post('/conversations/:id/interventions', async (req, res) => {
  try {
    const payload = req.body ?? {};
    const time = typeof payload.time === 'string' && payload.time.trim() ? payload.time : new Date().toISOString();
    const text = typeof payload.text === 'string' ? payload.text.trim() : '';
    const sender = payload.sender === 'supervisor_as_agent' ? 'supervisor_as_agent' : 'supervisor';

    const repository = new PostgresMessageRepository();
    const message = await createMessage(repository, {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      conversationId: req.params.id,
      sender,
      text,
      time,
      source: 'dashboard',
    });

    // If the supervisor sent the intervention "as agent", forward it to WhatsApp
    if (sender === 'supervisor_as_agent') {
      try {
        // Load conversation to get client phone
        const convRepo = new PostgresConversationRepository();
        const conv = await convRepo.getById(req.params.id);
        const phone = conv?.phone ?? '';

        if (phone) {
          // delegate send to whatsapp client which handles rate limiting, retries and metrics
          const sendResult = await sendTextMessage(phone, text);
          const externalMessageId = sendResult.externalMessageId ?? null;

          if (!sendResult.ok) {
            console.error('Failed to send WhatsApp message', { status: sendResult.status, body: sendResult.bodyText });
          }

          // Persist outbound message as agent/whatsapp
          const outMsg = await createMessage(repository, {
            id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            conversationId: req.params.id,
            sender: 'agent',
            text,
            time,
            source: 'whatsapp',
            externalMessageId,
          });

          // emit realtime event for outbound message
          try {
            const io = getIo();
            io.emit('message.created', { conversationId: outMsg.conversationId, message: outMsg });
          } catch (e) {}

          // return outbound message info along with supervisor message
          return res.status(201).json(buildSuccessResponse({ supervisorMessage: message, outboundMessage: outMsg }, 'Intervención enviada y re-enviada por WhatsApp'));
        }
      } catch (error) {
        // fallthrough to return supervisor message even if WhatsApp forwarding fails
        console.error('Error sending to WhatsApp:', error);
      }
    }

    res.status(201).json(buildSuccessResponse(message, 'Intervención enviada correctamente'));
  } catch (error) {
    res.status(500).json(buildErrorResponse('No se pudo enviar la intervención', error instanceof Error ? error.message : 'UNKNOWN_ERROR'));
  }
});

// Send arbitrary WhatsApp message (protected)
agentConversationRouter.post('/whatsapp/send', async (req, res) => {
  try {
    await authenticateRequest(req as any, res, async () => {
      const payload = req.body ?? {};
      // sanitize send payload
      const sanitized = sanitizeSendPayload(payload);
      if (!sanitized.ok) {
        return res.status(400).json(sanitized.error);
      }

      const conversationId = typeof payload.conversationId === 'string' && payload.conversationId.trim() ? payload.conversationId.trim() : null;
      const phone = typeof payload.phone === 'string' && payload.phone.trim() ? payload.phone.trim() : null;
      const sendText = sanitized.text;

      if (!sendText || (!conversationId && !sanitized.phone)) {
        return res.status(400).json(buildErrorResponse('Invalid payload', 'INVALID_PAYLOAD'));
      }

      const convRepo = new PostgresConversationRepository();
      let conv = null;
      if (conversationId) {
        conv = await convRepo.getById(conversationId);
      } else if (phone) {
        conv = await convRepo.getByClientPhone(phone);
      }

      if (!conv) {
        // create a conversation if none exists
        const agentId = process.env.DEFAULT_AGENT_ID ?? 'agent-1';
        const newConv = {
          id: `conv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          agentId,
          clientName: 'Cliente',
          topic: sendText.length > 0 ? sendText.slice(0, 48) : 'Mensaje saliente',
          status: 'active',
          startTime: new Date().toISOString(),
          phone: phone ?? null,
        };
        conv = await convRepo.create(newConv as any);
      }

      // delegate send to whatsapp client which handles rate limiting, retries and metrics
      const sendResult = await sendTextMessage(sanitized.phone ?? conv.phone ?? phone, sendText);
      const externalMessageId = sendResult.externalMessageId ?? null;
      if (!sendResult.ok) {
        console.error('Failed to send WhatsApp message via /whatsapp/send', { status: sendResult.status, body: sendResult.bodyText });
      }

      const msgRepo = new PostgresMessageRepository();
      const msg = await createMessage(msgRepo, {
        id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        conversationId: conv.id,
        sender: 'agent',
        text: sendText,
        time: new Date().toISOString(),
        source: 'whatsapp',
        externalMessageId,
      });

      try {
        const io = getIo();
        io.emit('message.created', { conversationId: msg.conversationId, message: msg });
      } catch (e) {}

      res.status(201).json(buildSuccessResponse(msg, 'Mensaje enviado'));
    });
  } catch (error) {
    res.status(500).json(buildErrorResponse('Could not send WhatsApp message', error instanceof Error ? error.message : 'UNKNOWN_ERROR'));
  }
});
