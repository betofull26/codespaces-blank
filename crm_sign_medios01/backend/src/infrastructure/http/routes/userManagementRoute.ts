import { Router } from 'express';
import { changeUserRole, changeUserStatus, createUser, deleteUser, getUserById, listUsers, loginUser, revokeSessionToken, updateUser, validateLoginPayload } from '../../../application/userManagement.js';
import { ensureAuthorized } from '../../../application/authorization.js';
import { buildSuccessResponse, buildErrorResponse } from '../../../common/apiResponse.js';
import { PostgresUserRepository } from '../../../infrastructure/database/repositories.js';
import { authenticateRequest } from '../middleware/authMiddleware.js';

export const userManagementRouter = Router();

const requireAuth = async (req: any, res: any, next: any) => {
  await authenticateRequest(req, res, next);
};

userManagementRouter.use('/users', requireAuth);
userManagementRouter.use('/auth/me', requireAuth);

userManagementRouter.get('/users', async (req, res) => {
  try {
    const role = (req.user?.role as 'admin' | 'supervisor' | 'agent' | undefined) ?? 'agent';
    ensureAuthorized(role, 'view-users');
    const repository = new PostgresUserRepository();
    const users = await listUsers(repository);
    res.json(buildSuccessResponse(users, 'Usuarios obtenidos correctamente'));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'UNKNOWN_ERROR';
    const statusCode = message === 'Unauthorized' ? 403 : 400;
    res.status(statusCode).json(buildErrorResponse('No se pudieron obtener los usuarios', message));
  }
});

userManagementRouter.get('/users/:id', async (req, res) => {
  try {
    const role = (req.user?.role as 'admin' | 'supervisor' | 'agent' | undefined) ?? 'agent';
    ensureAuthorized(role, 'view-users');
    const repository = new PostgresUserRepository();
    const user = await getUserById(repository, req.params.id);
    res.json(buildSuccessResponse(user, 'Usuario obtenido correctamente'));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'UNKNOWN_ERROR';
    const statusCode = message === 'Unauthorized' ? 403 : 400;
    res.status(statusCode).json(buildErrorResponse('No se pudo obtener el usuario', message));
  }
});

userManagementRouter.post('/users', async (req, res) => {
  try {
    const role = (req.user?.role as 'admin' | 'supervisor' | 'agent' | undefined) ?? 'agent';
    ensureAuthorized(role, 'manage-users');
    const repository = new PostgresUserRepository();
    const user = await createUser(repository, req.body, req.body.actorId ?? 'system');
    res.json(buildSuccessResponse(user, 'Usuario creado correctamente'));
  } catch (error) {
    console.error('[POST /users] Error creating user:', error);
    const message = error instanceof Error ? error.message : 'UNKNOWN_ERROR';
    const statusCode = message === 'Unauthorized' ? 403 : 400;
    res.status(statusCode).json(buildErrorResponse('No se pudo crear el usuario', message));
  }
});

userManagementRouter.put('/users/:id', async (req, res) => {
  try {
    const role = (req.user?.role as 'admin' | 'supervisor' | 'agent' | undefined) ?? 'agent';
    ensureAuthorized(role, 'manage-users');
    const repository = new PostgresUserRepository();
    const user = await updateUser(repository, { ...req.body, id: req.params.id }, req.body.actorId ?? 'system');
    res.json(buildSuccessResponse(user, 'Usuario actualizado correctamente'));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'UNKNOWN_ERROR';
    const statusCode = message === 'Unauthorized' ? 403 : 400;
    res.status(statusCode).json(buildErrorResponse('No se pudo actualizar el usuario', message));
  }
});

userManagementRouter.patch('/users/:id/role', async (req, res) => {
  try {
    const role = (req.user?.role as 'admin' | 'supervisor' | 'agent' | undefined) ?? 'agent';
    ensureAuthorized(role, 'manage-users');
    const repository = new PostgresUserRepository();
    const user = await changeUserRole(repository, req.params.id, req.body.role, req.body.actorId ?? 'system');
    res.json(buildSuccessResponse(user, 'Rol actualizado correctamente'));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'UNKNOWN_ERROR';
    const statusCode = message === 'Unauthorized' ? 403 : 400;
    res.status(statusCode).json(buildErrorResponse('No se pudo actualizar el rol', message));
  }
});

userManagementRouter.patch('/users/:id/status', async (req, res) => {
  try {
    const role = (req.user?.role as 'admin' | 'supervisor' | 'agent' | undefined) ?? 'agent';
    ensureAuthorized(role, 'manage-users');
    
    const status = req.body.status;
    if (!status || !['active', 'inactive', 'suspended'].includes(status)) {
      return res.status(400).json(buildErrorResponse('Estado inválido', 'INVALID_STATUS'));
    }

    const repository = new PostgresUserRepository();
    const user = await changeUserStatus(repository, req.params.id, status as 'active' | 'inactive' | 'suspended', req.body.actorId ?? 'system');
    
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

userManagementRouter.delete('/users/:id', async (req, res) => {
  try {
    const role = (req.user?.role as 'admin' | 'supervisor' | 'agent' | undefined) ?? 'agent';
    ensureAuthorized(role, 'manage-users');

    const repository = new PostgresUserRepository();
    await deleteUser(repository, req.params.id, req.body.actorId ?? 'system');

    res.json(buildSuccessResponse(null, 'Ficha eliminada correctamente'));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'UNKNOWN_ERROR';
    const statusCode = message === 'Unauthorized' ? 403 : 400;
    res.status(statusCode).json(buildErrorResponse('No se pudo eliminar la ficha', message));
  }
});

userManagementRouter.post('/auth/login', async (req, res) => {
  try {
    const { username, password } = validateLoginPayload(req.body);
    const repository = new PostgresUserRepository();
    const result = await loginUser(repository, username, password, req.body.actorId ?? 'system');

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

userManagementRouter.post('/auth/logout', async (req, res) => {
  const token = req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7).trim() : '';
  const tokenFromCookie = req.headers.cookie?.split(';').map((part) => part.trim()).find((part) => part.startsWith('crm_session='))?.slice('crm_session='.length);
  const sessionToken = token || tokenFromCookie || '';

  if (sessionToken) {
    await revokeSessionToken(sessionToken, new PostgresUserRepository());
  }

  res.clearCookie('crm_session', { path: '/' });
  res.json(buildSuccessResponse(null, 'Sesión cerrada correctamente'));
});
