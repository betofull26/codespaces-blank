import { Router } from 'express';
import { PostgresContactRepository, PostgresUserRepository } from '../../database/repositories.js';
import { buildSuccessResponse, buildErrorResponse } from '../../../common/apiResponse.js';
import { authenticateRequest, type AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { logAuditEvent } from '../../../application/userManagement.js';

export const contactRouter = Router();

// List contacts for a user
contactRouter.get('/users/:userId/contacts', async (req, res) => {
  try {
    await authenticateRequest(req as any, res, async () => {
      const userId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
      const repo = new PostgresContactRepository();
      const rows = await repo.listByUser(userId);
      res.json(buildSuccessResponse(rows, 'Contacts retrieved'));
    });
  } catch (error) {
    res.status(500).json(buildErrorResponse('Could not list contacts', error instanceof Error ? error.message : 'UNKNOWN_ERROR'));
  }
});

// Create contact for a user
contactRouter.post('/users/:userId/contacts', async (req, res) => {
  try {
    await authenticateRequest(req as AuthenticatedRequest, res, async () => {
      const role = ((req as AuthenticatedRequest).user?.role as 'admin' | 'supervisor' | 'agent' | undefined) ?? 'agent';
      if (role === 'agent') {
        return res.status(403).json(buildErrorResponse('No tienes permisos para crear contactos', 'FORBIDDEN'));
      }

      const userId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
      const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
      const phone = typeof req.body?.phone === 'string' ? req.body.phone.trim() : '';
      const company = typeof req.body?.company === 'string' ? req.body.company.trim() : '';
      const position = typeof req.body?.position === 'string' ? req.body.position.trim() : '';
      if (!name || !phone) {
        return res.status(400).json(buildErrorResponse('Invalid payload', 'INVALID_PAYLOAD'));
      }

      const repo = new PostgresContactRepository();
      const created = await repo.create(userId, name, phone, company || null, position || null);
      const auditRepo = new PostgresUserRepository();
      const actorId = (req as AuthenticatedRequest).user?.userId ?? 'system';
      await logAuditEvent(auditRepo, 'contact', created.id, 'create_contact', actorId, {
        userId,
        name,
        phone,
        company: company || null,
        position: position || null,
      });
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

      const rawUserId = typeof req.body?.userId === 'string' ? req.body.userId.trim() : '';
      const userId = rawUserId || null;
      const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
      const phone = typeof req.body?.phone === 'string' ? req.body.phone.trim() : '';
      const company = typeof req.body?.company === 'string' ? req.body.company.trim() : '';
      const position = typeof req.body?.position === 'string' ? req.body.position.trim() : '';
      if (!name || !phone) {
        return res.status(400).json(buildErrorResponse('Invalid payload', 'INVALID_PAYLOAD'));
      }

      const repo = new PostgresContactRepository();
      const created = await repo.create(userId, name, phone, company || null, position || null);
      const auditRepo = new PostgresUserRepository();
      const actorId = (req as AuthenticatedRequest).user?.userId ?? 'system';
      await logAuditEvent(auditRepo, 'contact', created.id, 'create_contact', actorId, {
        userId,
        name,
        phone,
        company: company || null,
        position: position || null,
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
      const actorId = (req as AuthenticatedRequest).user?.userId ?? 'system';
      await logAuditEvent(auditRepo, 'contact', updated.id, 'update_contact', actorId, {
        contactId,
        name,
        phone,
        company: company || null,
        position: position || null,
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
      const actorId = (req as AuthenticatedRequest).user?.userId ?? 'system';
      await logAuditEvent(auditRepo, 'contact', contactId, 'delete_contact', actorId, { contactId });
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
