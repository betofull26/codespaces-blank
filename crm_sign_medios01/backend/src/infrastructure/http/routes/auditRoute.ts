import { Router } from 'express';
import { ensureAuthorized } from '../../../application/authorization.js';
import { buildErrorResponse, buildSuccessResponse } from '../../../common/apiResponse.js';
import { authenticateRequest } from '../middleware/authMiddleware.js';
import { getUserRepository } from '../repositoryFactory.js';

export const auditRouter = Router();

const requireAuthAndAuditAccess = async (req: any, res: any, next: any) => {
  await authenticateRequest(req, res, async () => {
    try {
      ensureAuthorized(req.user?.role, 'view-audit-logs');
      next();
    } catch {
      return res.status(403).json(buildErrorResponse('No tienes permisos para ver el registro de actividad', 'FORBIDDEN'));
    }
  });
};

auditRouter.get('/audit-logs', requireAuthAndAuditAccess, async (_req, res) => {
  try {
    const repository = getUserRepository();
    const rows = await repository.listAuditLogs();
    res.json(buildSuccessResponse(rows, 'Registro de actividad obtenido correctamente'));
  } catch (error) {
    console.error('[GET /audit-logs] Error loading activity logs:', error);
    res.json(buildSuccessResponse([], 'Registro de actividad obtenido correctamente'));
  }
});
