import { Request, Response, NextFunction } from 'express';
import { buildErrorResponse } from '../../../common/apiResponse.js';

export const requireHttps = (req: Request, res: Response, next: NextFunction) => {
  // Express sets req.secure if TLS is used directly.
  // When behind a proxy/load-balancer, honor X-Forwarded-Proto.
  const forwarded = (req.headers['x-forwarded-proto'] as string) || '';
  const isSecure = req.secure || forwarded.split(',')[0] === 'https';

  if (isSecure) return next();

  return res.status(403).json(buildErrorResponse('HTTPS required for this endpoint', 'HTTPS_REQUIRED'));
};

export default requireHttps;
