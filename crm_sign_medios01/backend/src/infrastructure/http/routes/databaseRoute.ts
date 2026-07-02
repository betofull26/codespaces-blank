import { Router } from 'express';
import { buildSuccessResponse, buildErrorResponse } from '../../../common/apiResponse.js';
import type { DatabaseStatus } from '../../../domain/database.js';

export const makeDatabaseRouter = (databaseService: { getDatabaseHealth: () => Promise<DatabaseStatus> }) => {
  const router = Router();

  router.get('/database/status', async (_req, res) => {
    const status = await databaseService.getDatabaseHealth();

    if (!status.connected) {
      res.status(503).json(buildErrorResponse('No se pudo validar la base de datos', status.message));
      return;
    }

    res.json(buildSuccessResponse(status, 'Estado de la base de datos verificado'));
  });

  return router;
};
