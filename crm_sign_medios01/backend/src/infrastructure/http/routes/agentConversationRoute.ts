import { Router } from 'express';
import { createMessage, ingestWhatsAppMessage, listAgents, getConversationsByAgentId, listMessagesByConversationId, listConversations } from '../../../application/useCases.js';
import { config } from '../../../common/config.js';
import { buildErrorResponse, buildSuccessResponse } from '../../../common/apiResponse.js';
import { authenticateRequest } from '../middleware/authMiddleware.js';
import { requireHttps } from '../middleware/requireHttps.js';
import { PostgresAgentRepository, PostgresConversationRepository, PostgresMessageRepository } from '../../../infrastructure/database/repositories.js';
import { getIo } from '../../../infrastructure/realtime/socket.js';

export const agentConversationRouter = Router();

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

agentConversationRouter.post('/whatsapp/inbound', requireHttps, async (req, res) => {
  try {
    const payload = req.body ?? {};
    const conversationRepository = new PostgresConversationRepository();
    const messageRepository = new PostgresMessageRepository();
    const result = await ingestWhatsAppMessage(conversationRepository, messageRepository, payload);

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

// Meta verification endpoint for webhook subscription
agentConversationRouter.get('/whatsapp/webhook', async (req, res) => {
  const mode = Array.isArray(req.query['hub.mode']) ? req.query['hub.mode'][0] : req.query['hub.mode'];
  const token = Array.isArray(req.query['hub.verify_token']) ? req.query['hub.verify_token'][0] : req.query['hub.verify_token'];
  const challenge = Array.isArray(req.query['hub.challenge']) ? req.query['hub.challenge'][0] : req.query['hub.challenge'];

  if (mode === 'subscribe' && token === config.metaVerifyToken) {
    return res.status(200).send(challenge ?? '');
  }

  return res.status(403).json(buildErrorResponse('Verification failed', 'VERIFICATION_FAILED'));
});

// Backwards-compatible webhook path used by frontend tests/tools
agentConversationRouter.post('/whatsapp/webhook', requireHttps, async (req, res) => {
  try {
    const payload = req.body ?? {};
    const conversationRepository = new PostgresConversationRepository();
    const messageRepository = new PostgresMessageRepository();
    const result = await ingestWhatsAppMessage(conversationRepository, messageRepository, payload);

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
          const waUrl = `${config.whatsappApiUrl.replace(/\/$/, '')}/messages`;
          const maxRetries = Number(process.env.WHATSAPP_SEND_RETRIES ?? 3);
          const baseDelay = Number(process.env.WHATSAPP_SEND_BACKOFF_MS ?? 500);
          let waResp: Response | null = null;

          for (let attempt = 1; attempt <= maxRetries; attempt++) {
            console.log(`WhatsApp send attempt ${attempt} to ${phone}`);
            try {
              waResp = await fetch(waUrl, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${config.whatsappToken}`,
                },
                body: JSON.stringify({ to: phone, text }),
              });

              if (waResp.ok) {
                console.log(`WhatsApp send succeeded on attempt ${attempt} for ${phone}`);
                break;
              }

              const tb = await waResp.text().catch(() => '<no-body>');
              console.error(`WhatsApp send attempt ${attempt} failed: ${waResp.status} ${tb}`);
            } catch (err) {
              console.error(`WhatsApp send attempt ${attempt} error:`, err instanceof Error ? err.message : err);
            }

            if (attempt < maxRetries) {
              const delay = baseDelay * Math.pow(2, attempt - 1);
              await new Promise((r) => setTimeout(r, delay));
            }
          }

          let externalMessageId: string | null = null;
          if (waResp && waResp.ok) {
            try {
              const body = await waResp.json();
              externalMessageId = body?.messageId ?? body?.id ?? null;
            } catch (e) {
              console.error('Failed to parse WhatsApp response body:', e instanceof Error ? e.message : e);
            }
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
      const conversationId = typeof payload.conversationId === 'string' && payload.conversationId.trim() ? payload.conversationId.trim() : null;
      const phone = typeof payload.phone === 'string' && payload.phone.trim() ? payload.phone.trim() : null;
      const text = typeof payload.text === 'string' ? payload.text.trim() : '';

      if (!text || (!conversationId && !phone)) {
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
          topic: text.length > 0 ? text.slice(0, 48) : 'Mensaje saliente',
          status: 'active',
          startTime: new Date().toISOString(),
          phone: phone ?? null,
        };
        conv = await convRepo.create(newConv as any);
      }

      // send to external WhatsApp API with retries
      const waUrl = `${config.whatsappApiUrl.replace(/\/$/, '')}/messages`;
      const maxRetries = Number(process.env.WHATSAPP_SEND_RETRIES ?? 3);
      const baseDelay = Number(process.env.WHATSAPP_SEND_BACKOFF_MS ?? 500);
      let waResp: Response | null = null;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        console.log(`POST /whatsapp/send attempt ${attempt} -> ${waUrl}`);
        try {
          waResp = await fetch(waUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${config.whatsappToken}`,
            },
            body: JSON.stringify({ to: conv.phone ?? phone, text }),
          });

          if (waResp.ok) {
            console.log('WhatsApp send succeeded');
            break;
          }

          const tb = await waResp.text().catch(() => '<no-body>');
          console.error(`WhatsApp send failed: ${waResp.status} ${tb}`);
        } catch (err) {
          console.error('WhatsApp send error:', err instanceof Error ? err.message : err);
        }

        if (attempt < maxRetries) {
          const delay = baseDelay * Math.pow(2, attempt - 1);
          await new Promise((r) => setTimeout(r, delay));
        }
      }

      let externalMessageId: string | null = null;
      if (waResp && waResp.ok) {
        try {
          const body = await waResp.json();
          externalMessageId = body?.messageId ?? body?.id ?? null;
        } catch (e) {
          console.error('Failed to parse WhatsApp send response:', e instanceof Error ? e.message : e);
        }
      }

      const msgRepo = new PostgresMessageRepository();
      const msg = await createMessage(msgRepo, {
        id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        conversationId: conv.id,
        sender: 'agent',
        text,
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
