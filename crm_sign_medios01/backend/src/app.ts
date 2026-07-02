import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { buildErrorResponse } from './common/apiResponse.js';
import { healthRouter } from './infrastructure/http/routes/healthRoute.js';
import { makeDatabaseRouter } from './infrastructure/http/routes/databaseRoute.js';
import { makeBootstrapRouter } from './infrastructure/http/routes/bootstrapRoute.js';
import { makeConversationRouter } from './infrastructure/http/routes/conversationRoute.js';
import { makeWhatsAppRouter } from './infrastructure/http/routes/whatsappRoute.js';
import type { DatabaseStatus } from './domain/database.js';
import type { ConversationService } from './application/conversationService.js';

export type DatabaseService = {
  getDatabaseHealth: () => Promise<DatabaseStatus>;
};

export type DatabaseInitializer = {
  initializeDatabase: () => Promise<void>;
};

export const createApp = (
  databaseService: DatabaseService,
  databaseInitializer: DatabaseInitializer,
  conversationService: ConversationService,
) => {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json());

  app.use('/api', healthRouter);
  app.use('/api', makeDatabaseRouter(databaseService));
  app.use('/api', makeBootstrapRouter(databaseInitializer));
  app.use('/api', makeConversationRouter(conversationService));
  app.use('/api', makeWhatsAppRouter(conversationService));

  app.use((_req, res) => {
    res.status(404).json(buildErrorResponse('Ruta no encontrada', 'NOT_FOUND'));
  });

  return app;
};
