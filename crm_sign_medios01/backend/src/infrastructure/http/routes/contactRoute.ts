import { Router } from 'express';
import { PostgresContactRepository } from '../../database/repositories.js';
import { buildSuccessResponse, buildErrorResponse } from '../../../common/apiResponse.js';
import { authenticateRequest, type AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { ensureAuthorized } from '../../../application/authorization.js';

export const contactRouter = Router();

// List contacts for an agent
contactRouter.get('/agents/:agentId/contacts', async (req, res) => {
  try {
    await authenticateRequest(req as any, res, async () => {
      const agentId = Array.isArray(req.params.agentId) ? req.params.agentId[0] : req.params.agentId;
      const repo = new PostgresContactRepository();
      const rows = await repo.listByAgent(agentId);
      res.json(buildSuccessResponse(rows, 'Contacts retrieved'));
    });
  } catch (error) {
    res.status(500).json(buildErrorResponse('Could not list contacts', error instanceof Error ? error.message : 'UNKNOWN_ERROR'));
  }
});

// Create contact for an agent
contactRouter.post('/agents/:agentId/contacts', async (req, res) => {
  try {
    await authenticateRequest(req as AuthenticatedRequest, res, async () => {
      const role = ((req as AuthenticatedRequest).user?.role as 'admin' | 'supervisor' | 'agent' | undefined) ?? 'agent';
      if (role === 'agent') {
        return res.status(403).json(buildErrorResponse('No tienes permisos para crear contactos', 'FORBIDDEN'));
      }

      const agentId = Array.isArray(req.params.agentId) ? req.params.agentId[0] : req.params.agentId;
      const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
      const phone = typeof req.body?.phone === 'string' ? req.body.phone.trim() : '';
      if (!name || !phone) {
        return res.status(400).json(buildErrorResponse('Invalid payload', 'INVALID_PAYLOAD'));
      }

      const repo = new PostgresContactRepository();
      const created = await repo.create(agentId, name, phone);
      res.status(201).json(buildSuccessResponse(created, 'Contact created'));
    });
  } catch (error) {
    res.status(500).json(buildErrorResponse('Could not create contact', error instanceof Error ? error.message : 'UNKNOWN_ERROR'));
  }
});

// Create contact without requiring a WhatsApp account
contactRouter.post('/contacts', async (req, res) => {
  try {
    await authenticateRequest(req as AuthenticatedRequest, res, async () => {
      const role = ((req as AuthenticatedRequest).user?.role as 'admin' | 'supervisor' | 'agent' | undefined) ?? 'agent';
      if (role === 'agent') {
        return res.status(403).json(buildErrorResponse('No tienes permisos para crear contactos', 'FORBIDDEN'));
      }

      const rawAgentId = typeof req.body?.agentId === 'string' ? req.body.agentId.trim() : '';
      const agentId = rawAgentId || null;
      const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
      const phone = typeof req.body?.phone === 'string' ? req.body.phone.trim() : '';
      if (!name || !phone) {
        return res.status(400).json(buildErrorResponse('Invalid payload', 'INVALID_PAYLOAD'));
      }

      const repo = new PostgresContactRepository();
      const created = await repo.create(agentId, name, phone);
      res.status(201).json(buildSuccessResponse(created, 'Contact created'));
    });
  } catch (error) {
    res.status(500).json(buildErrorResponse('Could not create contact', error instanceof Error ? error.message : 'UNKNOWN_ERROR'));
  }
});

// List all contacts
contactRouter.get('/contacts', async (req, res) => {
  try {
    await authenticateRequest(req as any, res, async () => {
      const repo = new PostgresContactRepository();
      const rows = await repo.listAllContacts();
      res.json(buildSuccessResponse(rows, 'Contacts retrieved'));
    });
  } catch (error) {
    res.status(500).json(buildErrorResponse('Could not list contacts', error instanceof Error ? error.message : 'UNKNOWN_ERROR'));
  }
});

export default contactRouter;
