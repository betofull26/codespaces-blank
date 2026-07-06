import type { Request, Response, NextFunction } from 'express';
import crypto from 'node:crypto';
import { config } from '../../../common/config.js';
import { buildErrorResponse } from '../../../common/apiResponse.js';

export const verifyWebhookSignature = (req: Request, res: Response, next: NextFunction) => {
  const secret = config.metaAppSecret;
  if (!secret) {
    console.warn('META_APP_SECRET not configured — skipping webhook signature verification');
    return next();
  }

  const signatureHeader = (req.headers['x-hub-signature-256'] ?? req.headers['x-hub-signature']) as string | undefined;
  if (!signatureHeader) {
    return res.status(403).json(buildErrorResponse('Missing signature header', 'SIGNATURE_REQUIRED'));
  }

  const raw = (req as any).rawBody as Buffer | undefined;
  if (!raw) {
    return res.status(400).json(buildErrorResponse('Raw body not available for signature verification', 'RAW_BODY_MISSING'));
  }

  const computed = 'sha256=' + crypto.createHmac('sha256', secret).update(raw).digest('hex');

  try {
    const a = Buffer.from(signatureHeader);
    const b = Buffer.from(computed);
    if (a.length !== b.length) {
      return res.status(403).json(buildErrorResponse('Invalid signature', 'INVALID_SIGNATURE'));
    }
    if (!crypto.timingSafeEqual(a, b)) {
      return res.status(403).json(buildErrorResponse('Invalid signature', 'INVALID_SIGNATURE'));
    }
  } catch (e) {
    return res.status(403).json(buildErrorResponse('Invalid signature', 'INVALID_SIGNATURE'));
  }

  return next();
};

export default verifyWebhookSignature;
