import { Router } from 'express';
import { createBackup, downloadBackupFile, listBackups } from '../../../application/backupService.js';
import { ensureAuthorized } from '../../../application/authorization.js';
import { buildErrorResponse, buildSuccessResponse } from '../../../common/apiResponse.js';
import { authenticateRequest } from '../middleware/authMiddleware.js';

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

backupRouter.get('/backups', requireAdmin, async (_req, res) => {
  try {
    const backups = await listBackups();
    res.json(buildSuccessResponse(backups, 'Respaldos obtenidos correctamente'));
  } catch (error) {
    res.status(500).json(buildErrorResponse('No se pudieron obtener los respaldos', error instanceof Error ? error.message : 'UNKNOWN_ERROR'));
  }
});

backupRouter.post('/backups', requireAdmin, async (req, res) => {
  try {
    const backupType = typeof req.body?.backupType === 'string' ? req.body.backupType : 'chats';
    const backup = await createBackup(backupType);
    res.status(201).json(buildSuccessResponse(backup, 'Respaldo creado correctamente'));
  } catch (error) {
    res.status(500).json(buildErrorResponse('No se pudo crear el respaldo', error instanceof Error ? error.message : 'UNKNOWN_ERROR'));
  }
});

backupRouter.get('/backups/download/:id', requireAdmin, async (req, res) => {
  try {
    const download = await downloadBackupFile(req.params.id);
    if (!download) {
      return res.status(404).json(buildErrorResponse('Respaldo no encontrado', 'NOT_FOUND'));
    }

    res.download(download.filePath, download.fileName);
  } catch (error) {
    res.status(500).json(buildErrorResponse('No se pudo descargar el respaldo', error instanceof Error ? error.message : 'UNKNOWN_ERROR'));
  }
});
