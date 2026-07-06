import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const resolveEnvFile = (startDir = __dirname): string | undefined => {
  const candidates = [
    path.resolve(startDir, '.env'),
    path.resolve(startDir, '..', '.env'),
    path.resolve(startDir, '..', '..', '.env'),
    path.resolve(startDir, '..', '..', '..', '.env'),
  ];

  return candidates.find((candidate) => fs.existsSync(candidate));
};

const envFile = resolveEnvFile();
dotenv.config({ path: envFile });

dotenv.config();

const rawWhatsAppApiUrl = process.env.WHATSAPP_API_URL ?? '';
const whatsappApiUrl = rawWhatsAppApiUrl.replace(/\/+$|\/messages$/i, '');
const whatsappSendUrl = whatsappApiUrl ? `${whatsappApiUrl}/messages` : '';

export const config = {
  port: Number(process.env.PORT ?? 3000),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  databaseUrl: process.env.DATABASE_URL ?? '',
  jwtSecret: process.env.JWT_SECRET ?? 'dev-secret',
  whatsappToken: process.env.WHATSAPP_TOKEN ?? 'dev-whatsapp-token',
  whatsappApiUrl,
  whatsappSendUrl,
  metaVerifyToken: process.env.META_VERIFY_TOKEN ?? 'dev-verify-token',
  metaAppSecret: process.env.META_APP_SECRET ?? '',
  defaultPhoneCountryCode: process.env.DEFAULT_PHONE_COUNTRY_CODE ?? '54',
};
