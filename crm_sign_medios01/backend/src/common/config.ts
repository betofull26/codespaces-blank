import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: Number(process.env.PORT ?? 3000),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  databaseUrl: process.env.DATABASE_URL ?? '',
  jwtSecret: process.env.JWT_SECRET ?? 'dev-secret',
  whatsappToken: process.env.WHATSAPP_TOKEN ?? 'dev-whatsapp-token',
  whatsappApiUrl: process.env.WHATSAPP_API_URL ?? 'http://localhost:3001',
};
