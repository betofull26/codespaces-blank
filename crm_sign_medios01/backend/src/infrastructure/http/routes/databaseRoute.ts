import { Router } from 'express';
import { getDatabaseHealth } from '../../../application/databaseService.js';
import { buildSuccessResponse, buildErrorResponse } from '../../../common/apiResponse.js';
import type { DatabaseStatusResponseDto } from '../../../interface/dtos.js';

export const databaseRouter = Router();

databaseRouter.get('/database/status', async (_req, res) => {
  const status = await getDatabaseHealth();

  if (!status.connected) {
    res.status(503).json(buildErrorResponse('No se pudo validar la base de datos', status.message));
    return;
  }

  const response: DatabaseStatusResponseDto = buildSuccessResponse(status, 'Estado de la base de datos verificado') as DatabaseStatusResponseDto;
  res.json(response);
});
