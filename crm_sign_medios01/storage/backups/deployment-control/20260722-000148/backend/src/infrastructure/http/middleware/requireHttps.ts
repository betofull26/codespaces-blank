import { Request, Response, NextFunction } from 'express';
import { buildErrorResponse } from '../../../common/apiResponse.js';

export const requireHttps = (req: Request, res: Response, next: NextFunction) => {
  // Express sets req.secure if TLS is used directly.
  // When behind a proxy/load-balancer, honor X-Forwarded-Proto.
  const forwarded = (req.headers['x-forwarded-proto'] as string) || '';
  const isSecure = req.secure || forwarded.split(',')[0] === 'https';

  // In Codespaces, the public URL is provided by the port-forwarding service and
  // the request reaches the app through the forwarded localhost connection.
  // We allow localhost/127.0.0.1 traffic for local development while keeping HTTPS
  // enforced for external requests.
  const host = req.hostname || '';
  const isLocalhost = host === 'localhost' || host === '127.0.0.1' || host === '::1';

  if (isSecure || isLocalhost) return next();

  return res.status(403).json(buildErrorResponse('HTTPS required for this endpoint', 'HTTPS_REQUIRED'));
};

export default requireHttps;
