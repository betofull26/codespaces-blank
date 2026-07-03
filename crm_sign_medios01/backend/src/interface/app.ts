import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { buildErrorResponse } from '../common/apiResponse.js';
import { healthRouter } from '../infrastructure/http/routes/healthRoute.js';
import { databaseRouter } from '../infrastructure/http/routes/databaseRoute.js';
import { bootstrapRouter } from '../infrastructure/http/routes/bootstrapRoute.js';

export const createApp = () => {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json());

  app.use('/api', healthRouter);
  app.use('/api', databaseRouter);
  app.use('/api', bootstrapRouter);

  app.use((_req, res) => {
    res.status(404).json(buildErrorResponse('Ruta no encontrada', 'NOT_FOUND'));
  });

  return app;
};
