import type { Request, Response, NextFunction } from 'express';
import { verifySessionToken } from '../../../application/userManagement.js';
import type { UserRepository } from '../../../domain/repositories.js';
import { PostgresUserRepository } from '../../../infrastructure/database/repositories.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    role: string;
  };
}

const getCookieValue = (cookieHeader: string | undefined, name: string): string | undefined => {
  if (!cookieHeader) {
    return undefined;
  }

  const match = cookieHeader.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
  if (!match) {
    return undefined;
  }

  return decodeURIComponent(match.slice(name.length + 1));
};

export const authenticateRequest = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
  repository: UserRepository = new PostgresUserRepository(),
) => {
  const header = req.headers.authorization;
  const bearerToken = typeof header === 'string' && header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  const tokenFromCookie = getCookieValue(req.headers.cookie, 'crm_session');
  const token = bearerToken || tokenFromCookie || '';

  if (!token) {
    return res.status(401).json({ success: false, error: 'Token de sesión requerido' });
  }

  const verified = await verifySessionToken(token, repository);
  if ('reason' in verified) {
    const errorMessage = verified.reason === 'revoked'
      ? 'Token de sesión revocado'
      : verified.reason === 'expired'
        ? 'Token de sesión expirado'
        : 'Token de sesión inválido';
    return res.status(401).json({ success: false, error: errorMessage });
  }

  req.user = { userId: verified.userId, role: verified.role };
  return next();
};
