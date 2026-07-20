import { Router } from 'express';
import { PostgresContactRepository, PostgresUserRepository } from '../../database/repositories.js';
import { buildSuccessResponse, buildErrorResponse } from '../../../common/apiResponse.js';
import { authenticateRequest, type AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { ensureAuthorized } from '../../../application/authorization.js';
import { createAuditEntry } from '../../../application/audit.js';

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
      const company = typeof req.body?.company === 'string' ? req.body.company.trim() : '';
      const position = typeof req.body?.position === 'string' ? req.body.position.trim() : '';
      if (!name || !phone) {
        return res.status(400).json(buildErrorResponse('Invalid payload', 'INVALID_PAYLOAD'));
      }

      const repo = new PostgresContactRepository();
      const created = await repo.create(agentId, name, phone, company || null, position || null);
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
      const company = typeof req.body?.company === 'string' ? req.body.company.trim() : '';
      const position = typeof req.body?.position === 'string' ? req.body.position.trim() : '';
      if (!name || !phone) {
        return res.status(400).json(buildErrorResponse('Invalid payload', 'INVALID_PAYLOAD'));
      }

      const repo = new PostgresContactRepository();
      const created = await repo.create(agentId, name, phone, company || null, position || null);
      const auditRepo = new PostgresUserRepository();
      const auditEntry = createAuditEntry('contact', created.id, 'create_contact', req.user?.id ?? 'system', {
        agentId,
        name,
        phone,
      });
      await auditRepo.createAuditLog({
        id: auditEntry.id,
        entityType: auditEntry.entityType,
        entityId: auditEntry.entityId,
        action: auditEntry.action,
        performedBy: auditEntry.performedBy,
        details: auditEntry.details,
        createdAt: auditEntry.createdAt,
      });
      res.status(201).json(buildSuccessResponse(created, 'Contact created'));
    });
  } catch (error) {
    res.status(500).json(buildErrorResponse('Could not create contact', error instanceof Error ? error.message : 'UNKNOWN_ERROR'));
  }
});

contactRouter.put('/contacts/:contactId', async (req, res) => {
  try {
    await authenticateRequest(req as AuthenticatedRequest, res, async () => {
      const role = ((req as AuthenticatedRequest).user?.role as 'admin' | 'supervisor' | 'agent' | undefined) ?? 'agent';
      if (role === 'agent') {
        return res.status(403).json(buildErrorResponse('No tienes permisos para editar contactos', 'FORBIDDEN'));
      }

      const contactId = Array.isArray(req.params.contactId) ? req.params.contactId[0] : req.params.contactId;
      const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
      const phone = typeof req.body?.phone === 'string' ? req.body.phone.trim() : '';
      const company = typeof req.body?.company === 'string' ? req.body.company.trim() : '';
      const position = typeof req.body?.position === 'string' ? req.body.position.trim() : '';
      if (!name || !phone) {
        return res.status(400).json(buildErrorResponse('Invalid payload', 'INVALID_PAYLOAD'));
      }

      const repo = new PostgresContactRepository();
      const updated = await repo.update(contactId, name, phone, company || null, position || null);
      const auditRepo = new PostgresUserRepository();
      const auditEntry = createAuditEntry('contact', updated.id, 'update_contact', req.user?.id ?? 'system', {
        contactId,
        name,
        phone,
      });
      await auditRepo.createAuditLog({
        id: auditEntry.id,
        entityType: auditEntry.entityType,
        entityId: auditEntry.entityId,
        action: auditEntry.action,
        performedBy: auditEntry.performedBy,
        details: auditEntry.details,
        createdAt: auditEntry.createdAt,
      });
      res.json(buildSuccessResponse(updated, 'Contact updated'));
    });
  } catch (error) {
    res.status(500).json(buildErrorResponse('Could not update contact', error instanceof Error ? error.message : 'UNKNOWN_ERROR'));
  }
});

contactRouter.delete('/contacts/:contactId', async (req, res) => {
  try {
    await authenticateRequest(req as AuthenticatedRequest, res, async () => {
      const role = ((req as AuthenticatedRequest).user?.role as 'admin' | 'supervisor' | 'agent' | undefined) ?? 'agent';
      if (role === 'agent') {
        return res.status(403).json(buildErrorResponse('No tienes permisos para eliminar contactos', 'FORBIDDEN'));
      }

      const contactId = Array.isArray(req.params.contactId) ? req.params.contactId[0] : req.params.contactId;
      const repo = new PostgresContactRepository();
      await repo.delete(contactId);
      const auditRepo = new PostgresUserRepository();
      const auditEntry = createAuditEntry('contact', contactId, 'delete_contact', req.user?.id ?? 'system', {
        contactId,
      });
      await auditRepo.createAuditLog({
        id: auditEntry.id,
        entityType: auditEntry.entityType,
        entityId: auditEntry.entityId,
        action: auditEntry.action,
        performedBy: auditEntry.performedBy,
        details: auditEntry.details,
        createdAt: auditEntry.createdAt,
      });
      res.json(buildSuccessResponse({ id: contactId }, 'Contact deleted'));
    });
  } catch (error) {
    res.status(500).json(buildErrorResponse('Could not delete contact', error instanceof Error ? error.message : 'UNKNOWN_ERROR'));
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
