import { Router } from 'express';
import { ensureAuthorized } from '../../../application/authorization.js';
import { buildErrorResponse, buildSuccessResponse } from '../../../common/apiResponse.js';
import { authenticateRequest } from '../middleware/authMiddleware.js';
import { getDatabaseClient } from '../../database/connection.js';

const ensureAuditTableExists = async (db: Awaited<ReturnType<typeof getDatabaseClient>>) => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      action TEXT NOT NULL,
      performed_by TEXT NOT NULL,
      user_id TEXT,
      details TEXT NOT NULL,
      created_at TEXT NOT NULL
    )
  `);
};

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
    const db = await getDatabaseClient();
    await ensureAuditTableExists(db);
    const rows = await db.query(
      'SELECT id, entity_type AS "entityType", entity_id AS "entityId", action, user_id AS "userId", details, created_at AS "createdAt" FROM audit_logs ORDER BY created_at DESC LIMIT 100',
    );

    res.json(buildSuccessResponse(rows, 'Registro de actividad obtenido correctamente'));
  } catch (error) {
    console.error('[GET /audit-logs] Error loading activity logs:', error);
    res.json(buildSuccessResponse([], 'Registro de actividad obtenido correctamente'));
  }
});
