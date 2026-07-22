export interface HealthStatus {
  status: 'ok';
  service: string;
  timestamp: string;
}

export const getHealthStatus = (): HealthStatus => ({
  status: 'ok',
  service: 'crm-sign-medios-backend',
  timestamp: new Date().toISOString(),
});
