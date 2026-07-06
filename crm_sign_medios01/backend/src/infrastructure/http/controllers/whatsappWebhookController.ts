import { Request, Response } from 'express';
import { config } from '../../../common/config.js';

const getHubParam = (req: Request, key: string): string | undefined => {
  const query = req.query as Record<string, unknown> | undefined;
  const raw = query?.[key];

  if (Array.isArray(raw)) return typeof raw[0] === 'string' ? raw[0] : undefined;
  if (typeof raw === 'string') return raw;
  if (typeof raw === 'object' && raw !== null) {
    const nestedKey = key.split('.');
    let current: unknown = query;

    for (const part of nestedKey) {
      if (typeof current !== 'object' || current == null) return undefined;
      current = (current as Record<string, unknown>)[part];
    }

    if (Array.isArray(current)) return typeof current[0] === 'string' ? current[0] : undefined;
    return typeof current === 'string' ? current : undefined;
  }

  return undefined;
};

export const verifyMetaWebhook = (req: Request, res: Response): void => {
  const mode = getHubParam(req, 'hub.mode');
  const token = getHubParam(req, 'hub.verify_token');
  const challenge = getHubParam(req, 'hub.challenge');

  if (mode === 'subscribe' && token === config.metaVerifyToken) {
    res.status(200);
    res.set('Content-Type', 'text/plain; charset=utf-8');
    res.send(challenge ?? '');
    return;
  }

  res.status(403);
  res.set('Content-Type', 'text/plain; charset=utf-8');
  res.send('VERIFICATION_FAILED');
};
