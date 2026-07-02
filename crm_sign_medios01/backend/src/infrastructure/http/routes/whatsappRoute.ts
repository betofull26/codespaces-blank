import { Router } from 'express';
import { buildSuccessResponse, buildErrorResponse } from '../../../common/apiResponse.js';
import type { ConversationService } from '../../../application/conversationService.js';

export const makeWhatsAppRouter = (conversationService: ConversationService) => {
  const router = Router();

  router.post('/whatsapp/webhook', async (req, res) => {
    const { externalMessageId, phoneNumber, text, timestamp, conversationId, agentId } = req.body ?? {};

    if (!externalMessageId || !phoneNumber || !text || !timestamp) {
      return res.status(400).json(buildErrorResponse('Payload inválido para webhook de WhatsApp', 'INVALID_PAYLOAD'));
    }

    try {
      const result = await conversationService.postWhatsAppWebhook({
        externalMessageId,
        phoneNumber,
        text,
        time: timestamp,
        conversationId,
        agentId,
      });
      res.json(buildSuccessResponse(result, 'Webhook de WhatsApp procesado correctamente'));
    } catch (error) {
      res.status(500).json(
        buildErrorResponse(
          'No se pudo procesar el webhook de WhatsApp',
          error instanceof Error ? error.message : 'UNKNOWN_ERROR',
        ),
      );
    }
  });

  return router;
};
