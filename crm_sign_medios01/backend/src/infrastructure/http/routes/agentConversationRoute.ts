import { Router } from 'express';
import { createMessage, ingestWhatsAppMessage, listAgents, getConversationsByAgentId, listMessagesByConversationId, listConversations } from '../../../application/useCases.js';
import { buildErrorResponse, buildSuccessResponse } from '../../../common/apiResponse.js';
import { PostgresAgentRepository, PostgresConversationRepository, PostgresMessageRepository } from '../../../infrastructure/database/repositories.js';

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

agentConversationRouter.post('/whatsapp/inbound', async (req, res) => {
  try {
    const payload = req.body ?? {};
    const conversationRepository = new PostgresConversationRepository();
    const messageRepository = new PostgresMessageRepository();
    const result = await ingestWhatsAppMessage(conversationRepository, messageRepository, payload);

    res.status(201).json(buildSuccessResponse({
      conversation: result.conversation,
      message: result.message,
    }, 'Mensaje de WhatsApp procesado correctamente'));
  } catch (error) {
    res.status(500).json(buildErrorResponse('No se pudo procesar el mensaje de WhatsApp', error instanceof Error ? error.message : 'UNKNOWN_ERROR'));
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

    res.status(201).json(buildSuccessResponse(message, 'Intervención enviada correctamente'));
  } catch (error) {
    res.status(500).json(buildErrorResponse('No se pudo enviar la intervención', error instanceof Error ? error.message : 'UNKNOWN_ERROR'));
  }
});
