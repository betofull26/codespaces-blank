import { Router } from 'express';
import { getHealth } from '../../../application/healthService.js';
import { buildSuccessResponse } from '../../../common/apiResponse.js';
import type { HealthResponseDto } from '../../../interface/dtos.js';

export const healthRouter = Router();

healthRouter.get('/health', (_req, res) => {
  const health = getHealth();
  const response: HealthResponseDto = buildSuccessResponse(health, 'Servicio disponible') as HealthResponseDto;
  res.json(response);
});
