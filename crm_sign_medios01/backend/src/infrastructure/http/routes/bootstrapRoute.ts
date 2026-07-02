import { Router } from 'express';
import { buildSuccessResponse, buildErrorResponse } from '../../../common/apiResponse.js';

export const makeBootstrapRouter = (
  initializer: { initializeDatabase: () => Promise<void> },
) => {
  const router = Router();

  router.post('/database/bootstrap', async (_req, res) => {
    try {
      await initializer.initializeDatabase();
      res.json(buildSuccessResponse(null, 'Base de datos inicializada correctamente'));
    } catch (error) {
      res.status(500).json(
        buildErrorResponse(
          'No se pudo inicializar la base de datos',
          error instanceof Error ? error.message : 'UNKNOWN_ERROR',
        ),
      );
    }
  });

  return router;
};
