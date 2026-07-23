import { Router } from 'express';
import { createBackup, downloadBackupFile, listBackups } from '../../../application/backupService.js';
import { ensureAuthorized } from '../../../application/authorization.js';
import { buildErrorResponse, buildSuccessResponse } from '../../../common/apiResponse.js';
import { authenticateRequest } from '../middleware/authMiddleware.js';
import { getDatabaseClient } from '../../../infrastructure/database/connection.js';
import { PostgresUserRepository } from '../../../infrastructure/database/repositories.js';
import { logAuditEvent } from '../../../application/userManagement.js';

export const backupRouter = Router();

const requireAdmin = async (req: any, res: any, next: any) => {
  await authenticateRequest(req, res, async () => {
    try {
      ensureAuthorized(req.user?.role, 'view-backups');
      next();
    } catch {
      return res.status(403).json(buildErrorResponse('Solo los administradores pueden gestionar respaldos', 'FORBIDDEN'));
    }
  });
};

const requireAdminForMutations = async (req: any, res: any, next: any) => {
  await authenticateRequest(req, res, async () => {
    try {
      ensureAuthorized(req.user?.role, 'manage-backups');
      next();
    } catch {
      return res.status(403).json(buildErrorResponse('Solo los administradores pueden gestionar respaldos', 'FORBIDDEN'));
    }
  });
};

backupRouter.get('/backups', requireAdmin, async (_req, res) => {
  try {
    const backups = await listBackups();
    res.json(buildSuccessResponse(backups, 'Respaldos obtenidos correctamente'));
  } catch (error) {
    res.status(500).json(buildErrorResponse('No se pudieron obtener los respaldos', error instanceof Error ? error.message : 'UNKNOWN_ERROR'));
  }
});

backupRouter.post('/backups', requireAdminForMutations, async (req, res) => {
  try {
    const backupType = typeof req.body?.backupType === 'string' ? req.body.backupType : 'chats';
    const userId = typeof req.body?.userId === 'string' ? req.body.userId : undefined;

    // Resolve the full name of the session user to use as fallback in CSV
    let actorName: string | undefined;
    const sessionUserId = (req as any).user?.userId;
    if (sessionUserId) {
      try {
        const db = await getDatabaseClient();
        const rows = (await db.query(
          `SELECT full_name FROM users WHERE id = $1`,
          [sessionUserId],
        )) as Array<{ full_name: string }>;
        actorName = rows[0]?.full_name ?? undefined;
      } catch {
        // non-critical — leave actorName undefined
      }
    }

    const backup = await createBackup(backupType, userId, actorName);
    const auditRepo = new PostgresUserRepository();
    const actorId = (req as any).user?.userId ?? 'system';
    await logAuditEvent(auditRepo, 'backup', backup.id, 'create_backup', actorId, {
      backupType,
      fileName: backup.fileName,
      userId,
      actorName,
    });
    res.status(201).json(buildSuccessResponse(backup, 'Respaldo creado correctamente'));
  } catch (error) {
    res.status(500).json(buildErrorResponse('No se pudo crear el respaldo', error instanceof Error ? error.message : 'UNKNOWN_ERROR'));
  }
});

backupRouter.get('/backups/download/:id', requireAdminForMutations, async (req, res) => {
  try {
    const download = await downloadBackupFile(req.params.id);
    if (!download) {
      const auditRepo = new PostgresUserRepository();
      const actorId = (req as any).user?.userId ?? 'system';
      await logAuditEvent(auditRepo, 'backup', req.params.id, 'download_backup_missing', actorId, { reason: 'not-found' });
      return res.status(404).json(buildErrorResponse('Respaldo no encontrado', 'NOT_FOUND'));
    }

    const auditRepo = new PostgresUserRepository();
    const actorId = (req as any).user?.userId ?? 'system';
    await logAuditEvent(auditRepo, 'backup', req.params.id, 'download_backup', actorId, { fileName: download.fileName });

    res.download(download.filePath, download.fileName);
  } catch (error) {
    res.status(500).json(buildErrorResponse('No se pudo descargar el respaldo', error instanceof Error ? error.message : 'UNKNOWN_ERROR'));
  }
});
