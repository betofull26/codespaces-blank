import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSuccessResponse } from '../common/apiResponse.js';
import type { HealthResponseDto } from './dtos.js';

test('health DTO response is shaped as expected', () => {
  const payload = buildSuccessResponse({ status: 'ok', service: 'crm-sign-medios-backend', timestamp: '2026-07-03T00:00:00.000Z' }, 'Servicio disponible');
  const dto: HealthResponseDto = payload as HealthResponseDto;

  assert.equal(dto.success, true);
  assert.equal(dto.message, 'Servicio disponible');
  assert.equal(dto.data.status, 'ok');
});
