import { Router } from 'express';
import { getHealth } from '../../../application/healthService.js';
import { buildSuccessResponse } from '../../../common/apiResponse.js';

export const healthRouter = Router();

healthRouter.get('/health', (_req, res) => {
  const health = getHealth();
  res.json(buildSuccessResponse(health, 'Servicio disponible'));
});
