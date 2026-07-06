import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { buildErrorResponse } from '../common/apiResponse.js';
import { healthRouter } from '../infrastructure/http/routes/healthRoute.js';
import { databaseRouter } from '../infrastructure/http/routes/databaseRoute.js';
import { bootstrapRouter } from '../infrastructure/http/routes/bootstrapRoute.js';
import { userManagementRouter } from '../infrastructure/http/routes/userManagementRoute.js';
import { backupRouter } from '../infrastructure/http/routes/backupRoute.js';
import { contactRouter } from '../infrastructure/http/routes/contactRoute.js';
import { agentConversationRouter } from '../infrastructure/http/routes/agentConversationRoute.js';

export const createApp = () => {
  const app = express();

  app.use(helmet());
  app.use(cors());
  // capture raw body for webhook signature verification
  app.use(express.json({
    verify: (req, _res, buf) => {
      try {
        (req as any).rawBody = buf;
      } catch (e) {
        // ignore in case of non-object request
      }
    },
  }));

  app.use('/api', healthRouter);
  app.use('/api', databaseRouter);
  app.use('/api', bootstrapRouter);
  app.use('/api', userManagementRouter);
  app.use('/api', backupRouter);
  app.use('/api', contactRouter);
  app.use('/api', agentConversationRouter);

  app.use((_req, res) => {
    res.status(404).json(buildErrorResponse('Ruta no encontrada', 'NOT_FOUND'));
  });

  return app;
};
