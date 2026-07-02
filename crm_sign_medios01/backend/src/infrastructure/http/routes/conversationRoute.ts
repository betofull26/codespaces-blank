import { Router } from 'express';
import { buildSuccessResponse, buildErrorResponse } from '../../../common/apiResponse.js';
import type { ConversationService } from '../../../application/conversationService.js';

export const makeConversationRouter = (conversationService: ConversationService) => {
  const router = Router();

  router.get('/agents', async (_req, res) => {
    try {
      const agents = await conversationService.fetchAgents();
      res.json(buildSuccessResponse(agents, 'Agentes recuperados correctamente'));
    } catch (error) {
      res.status(500).json(
        buildErrorResponse(
          'No se pudieron recuperar los agentes',
          error instanceof Error ? error.message : 'UNKNOWN_ERROR',
        ),
      );
    }
  });

  router.get('/agents/:agentId/conversations', async (req, res) => {
    const { agentId } = req.params;
    try {
      const conversations = await conversationService.fetchAgentConversations(agentId);
      res.json(buildSuccessResponse(conversations, 'Conversaciones del agente recuperadas correctamente'));
    } catch (error) {
      res.status(500).json(
        buildErrorResponse(
          'No se pudieron recuperar las conversaciones del agente',
          error instanceof Error ? error.message : 'UNKNOWN_ERROR',
        ),
      );
    }
  });

  router.get('/conversations/:conversationId/messages', async (req, res) => {
    const { conversationId } = req.params;
    try {
      const messages = await conversationService.fetchConversationMessages(conversationId);
      res.json(buildSuccessResponse(messages, 'Mensajes de conversación recuperados correctamente'));
    } catch (error) {
      res.status(500).json(
        buildErrorResponse(
          'No se pudieron recuperar los mensajes de la conversación',
          error instanceof Error ? error.message : 'UNKNOWN_ERROR',
        ),
      );
    }
  });

  router.post('/conversations/:conversationId/interventions', async (req, res) => {
    const { conversationId } = req.params;
    const { sender, text, time } = req.body ?? {};

    if (!sender || !text || !time) {
      return res.status(400).json(buildErrorResponse('Faltan campos requeridos en la intervención', 'INVALID_PAYLOAD'));
    }

    if (!['supervisor', 'supervisor_as_agent'].includes(sender)) {
      return res.status(400).json(buildErrorResponse('Sender inválido', 'INVALID_SENDER'));
    }

    try {
      const message = await conversationService.postConversationIntervention(conversationId, { sender, text, time });
      res.status(201).json(buildSuccessResponse(message, 'Intervención registrada correctamente'));
    } catch (error) {
      res.status(500).json(
        buildErrorResponse(
          'No se pudo registrar la intervención',
          error instanceof Error ? error.message : 'UNKNOWN_ERROR',
        ),
      );
    }
  });

  router.patch('/conversations/:conversationId', async (req, res) => {
    const { conversationId } = req.params;
    const { status } = req.body ?? {};

    if (!status || !['active', 'waiting', 'closed'].includes(status)) {
      return res.status(400).json(buildErrorResponse('Status inválido o faltante', 'INVALID_STATUS'));
    }

    try {
      const conversation = await conversationService.updateConversationStatus(conversationId, status);
      res.json(buildSuccessResponse(conversation, 'Estado de conversación actualizado correctamente'));
    } catch (error) {
      res.status(500).json(
        buildErrorResponse(
          'No se pudo actualizar el estado de la conversación',
          error instanceof Error ? error.message : 'UNKNOWN_ERROR',
        ),
      );
    }
  });

  return router;
};
