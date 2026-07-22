import { Router, type Request, type Response, type NextFunction } from 'express';
import { changeUserRole, changeUserStatus, createUser, deleteUser, getUserById, listUsers, logAuditEvent, loginUser, revokeSessionToken, updateUser, validateLoginPayload } from '../../../application/userManagement.js';
import { ensureAuthorized } from '../../../application/authorization.js';
import { buildSuccessResponse, buildErrorResponse } from '../../../common/apiResponse.js';
import type { AuthenticatedUser } from '../../../domain/repositories.js';
import { authenticateRequest } from '../middleware/authMiddleware.js';
import type { DeviceModel } from '../../../domain/models.js';
import { getUserRepository } from '../repositoryFactory.js';

interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

export const userManagementRouter = Router();

const requireAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  await authenticateRequest(req, res, next);
};

userManagementRouter.use('/users', requireAuth);
userManagementRouter.use('/auth/me', requireAuth);
userManagementRouter.use('/devices', requireAuth);

userManagementRouter.get('/users', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const role = (req.user?.role as 'admin' | 'supervisor' | 'agent' | undefined) ?? 'agent';
    ensureAuthorized(role, 'view-users');
    const repository = getUserRepository();
    const users = await listUsers(repository);
    res.json(buildSuccessResponse(users, 'Usuarios obtenidos correctamente'));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'UNKNOWN_ERROR';
    const statusCode = message === 'Unauthorized' ? 403 : 400;
    res.status(statusCode).json(buildErrorResponse('No se pudieron obtener los usuarios', message));
  }
});

userManagementRouter.get('/users/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const role = (req.user?.role as 'admin' | 'supervisor' | 'agent' | undefined) ?? 'agent';
    ensureAuthorized(role, 'view-users');
    const repository = getUserRepository();
    const user = await getUserById(repository, id);
    res.json(buildSuccessResponse(user, 'Usuario obtenido correctamente'));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'UNKNOWN_ERROR';
    const statusCode = message === 'Unauthorized' ? 403 : 400;
    res.status(statusCode).json(buildErrorResponse('No se pudo obtener el usuario', message));
  }
});

userManagementRouter.post('/users', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const role = (req.user?.role as 'admin' | 'supervisor' | 'agent' | undefined) ?? 'agent';
    ensureAuthorized(role, 'manage-users');
    const repository = getUserRepository();
    const actorId = typeof req.body?.actorId === 'string' ? req.body.actorId : 'system';
    const user = await createUser(repository, req.body, actorId);
    await logAuditEvent(repository, 'user', user.id, 'create_user_route', actorId, { source: 'real-route', requestedBy: req.user?.userId ?? actorId });
    res.json(buildSuccessResponse(user, 'Usuario creado correctamente'));
  } catch (error) {
    console.error('[POST /users] Error creating user:', error);
    const message = error instanceof Error ? error.message : 'UNKNOWN_ERROR';
    const statusCode = message === 'Unauthorized' ? 403 : 400;
    res.status(statusCode).json(buildErrorResponse('No se pudo crear el usuario', message));
  }
});

userManagementRouter.put('/users/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const role = (req.user?.role as 'admin' | 'supervisor' | 'agent' | undefined) ?? 'agent';
    ensureAuthorized(role, 'manage-users');
    const repository = getUserRepository();
    const actorId = typeof req.body?.actorId === 'string' ? req.body.actorId : 'system';
    const user = await updateUser(repository, { ...req.body, id: req.params.id }, actorId);
    await logAuditEvent(repository, 'user', user.id, 'update_user_route', actorId, { source: 'real-route', requestedBy: req.user?.userId ?? actorId });
    res.json(buildSuccessResponse(user, 'Usuario actualizado correctamente'));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'UNKNOWN_ERROR';
    const statusCode = message === 'Unauthorized' ? 403 : 400;
    res.status(statusCode).json(buildErrorResponse('No se pudo actualizar el usuario', message));
  }
});

userManagementRouter.patch('/users/:id/role', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const actorId = typeof req.body?.actorId === 'string' ? req.body.actorId : 'system';
    const role = (req.user?.role as 'admin' | 'supervisor' | 'agent' | undefined) ?? 'agent';
    ensureAuthorized(role, 'manage-users');
    const repository = getUserRepository();
    const user = await changeUserRole(repository, id, req.body.role, actorId);
    await logAuditEvent(repository, 'user', user.id, 'change_role_route', actorId, { source: 'real-route', requestedBy: req.user?.userId ?? actorId });
    res.json(buildSuccessResponse(user, 'Rol actualizado correctamente'));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'UNKNOWN_ERROR';
    const statusCode = message === 'Unauthorized' ? 403 : 400;
    res.status(statusCode).json(buildErrorResponse('No se pudo actualizar el rol', message));
  }
});

userManagementRouter.patch('/users/:id/status', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const actorId = typeof req.body?.actorId === 'string' ? req.body.actorId : 'system';
    const role = (req.user?.role as 'admin' | 'supervisor' | 'agent' | undefined) ?? 'agent';
    ensureAuthorized(role, 'manage-users');
    
    const status = req.body.status;
    if (!status || !['active', 'inactive', 'suspended'].includes(status)) {
      return res.status(400).json(buildErrorResponse('Estado inválido', 'INVALID_STATUS'));
    }

    const repository = getUserRepository();
    const user = await changeUserStatus(repository, id, status as 'active' | 'inactive' | 'suspended', actorId);
    await logAuditEvent(repository, 'user', user.id, 'change_status_route', actorId, { source: 'real-route', requestedBy: req.user?.userId ?? actorId });
    
    if (!user) {
      return res.status(404).json(buildErrorResponse('Usuario no encontrado', 'USER_NOT_FOUND'));
    }

    res.json(buildSuccessResponse(user, 'Estado actualizado correctamente'));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'UNKNOWN_ERROR';
    const statusCode = message === 'Unauthorized' ? 403 : 400;
    res.status(statusCode).json(buildErrorResponse('No se pudo actualizar el estado', message));
  }
});

userManagementRouter.delete('/users/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const actorId = typeof req.body?.actorId === 'string' ? req.body.actorId : 'system';
    const role = (req.user?.role as 'admin' | 'supervisor' | 'agent' | undefined) ?? 'agent';
    ensureAuthorized(role, 'manage-users');

    const repository = getUserRepository();
    await deleteUser(repository, id, actorId);
    await logAuditEvent(repository, 'user', id, 'delete_user_route', actorId, { source: 'real-route', requestedBy: req.user?.userId ?? actorId });

    res.json(buildSuccessResponse(null, 'Ficha eliminada correctamente'));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'UNKNOWN_ERROR';
    const statusCode = message === 'Unauthorized' ? 403 : 400;
    res.status(statusCode).json(buildErrorResponse('No se pudo eliminar la ficha', message));
  }
});

userManagementRouter.get('/devices', async (_req, res: Response) => {
  try {
    const repository = getUserRepository();
    const devices = await repository.listDevices();
    res.json(buildSuccessResponse(devices, 'Dispositivos obtenidos correctamente'));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'UNKNOWN_ERROR';
    res.status(500).json(buildErrorResponse('No se pudieron obtener los dispositivos', message));
  }
});

userManagementRouter.put('/devices/:userId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const role = (req.user?.role as 'admin' | 'supervisor' | 'agent' | undefined) ?? 'agent';
    ensureAuthorized(role, 'manage-users');
    const repository = getUserRepository();
    const actorId = typeof req.body?.actorId === 'string' ? req.body.actorId : 'system';
    const userId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
    const payload = (req.body ?? {}) as Partial<DeviceModel>;
    const device = await repository.upsertDevice({
      id: `device-${userId}`,
      userId,
      brandModel: typeof payload.brandModel === 'string' ? payload.brandModel : null,
      serialNumber1: typeof payload.serialNumber1 === 'string' ? payload.serialNumber1 : null,
      serialNumber2: typeof payload.serialNumber2 === 'string' ? payload.serialNumber2 : null,
      assignedPhone: typeof payload.assignedPhone === 'string' ? payload.assignedPhone : null,
    });
    await logAuditEvent(repository, 'device', userId, 'update_device_route', actorId, { source: 'real-route', requestedBy: req.user?.userId ?? actorId, deviceId: device.id });
    res.json(buildSuccessResponse(device, 'Dispositivo actualizado correctamente'));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'UNKNOWN_ERROR';
    const statusCode = message === 'Unauthorized' ? 403 : 400;
    res.status(statusCode).json(buildErrorResponse('No se pudo actualizar el dispositivo', message));
  }
});

userManagementRouter.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = validateLoginPayload(req.body);
    const repository = getUserRepository();
    const actorId = typeof req.body?.actorId === 'string' ? req.body.actorId : 'system';
    const result = await loginUser(repository, username, password, actorId);
    await logAuditEvent(repository, 'credential', result.user.id, 'login_route', actorId, { source: 'real-route', username });

    res.cookie('crm_session', result.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 8,
      path: '/',
    });

    res.json(buildSuccessResponse(result, 'Inicio de sesión correcto'));
  } catch (error) {
    res.status(401).json(buildErrorResponse('Credenciales inválidas', error instanceof Error ? error.message : 'UNKNOWN_ERROR'));
  }
});

userManagementRouter.post('/auth/logout', async (req: Request, res: Response) => {
  const token = req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7).trim() : '';
  const tokenFromCookie = req.headers.cookie?.split(';').map((part) => part.trim()).find((part) => part.startsWith('crm_session='))?.slice('crm_session='.length);
  const sessionToken = token || tokenFromCookie || '';

  if (sessionToken) {
    const repository = getUserRepository();
    await revokeSessionToken(sessionToken, repository);
    await logAuditEvent(repository, 'credential', 'session', 'logout_route', 'system', { source: 'real-route', tokenPresent: true });
  }

  res.clearCookie('crm_session', { path: '/' });
  res.json(buildSuccessResponse(null, 'Sesión cerrada correctamente'));
});
