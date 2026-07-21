import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const resolveEnvFile = (startDir = __dirname): string | undefined => {
  const candidates: string[] = [];
  let currentDir = path.resolve(startDir);

  while (true) {
    candidates.push(path.join(currentDir, '.env'));
    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      break;
    }
    currentDir = parentDir;
  }

  return candidates.reverse().find((candidate) => fs.existsSync(candidate));
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
  metaAppId: process.env.META_APP_ID ?? '',
  metaAppSecret: process.env.META_APP_SECRET ?? '',
  metaGraphVersion: process.env.META_GRAPH_VERSION ?? 'v16.0',
  metaOauthRedirectUri: process.env.META_OAUTH_REDIRECT_URI ?? '',
  defaultPhoneCountryCode: process.env.DEFAULT_PHONE_COUNTRY_CODE ?? '54',
};
