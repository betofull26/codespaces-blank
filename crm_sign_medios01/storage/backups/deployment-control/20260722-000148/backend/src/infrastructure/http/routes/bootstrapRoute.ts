import { Router } from 'express';
import { initializeDatabase } from '../../../infrastructure/database/init.js';
import { buildSuccessResponse, buildErrorResponse } from '../../../common/apiResponse.js';
import type { BootstrapResponseDto } from '../../../interface/dtos.js';

export const bootstrapRouter = Router();

bootstrapRouter.post('/database/bootstrap', async (_req, res) => {
  try {
    await initializeDatabase();
    const response: BootstrapResponseDto = buildSuccessResponse(null, 'Base de datos inicializada correctamente') as BootstrapResponseDto;
    res.json(response);
  } catch (error) {
    res.status(500).json(buildErrorResponse('No se pudo inicializar la base de datos', error instanceof Error ? error.message : 'UNKNOWN_ERROR'));
  }
});
