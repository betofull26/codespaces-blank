import { Router } from 'express';
import { changeUserRole, changeUserStatus, createUser, deleteUser, getUserById, listUsers, loginUser, updateUser } from '../../../application/userManagement.js';
import { ensureAuthorized } from '../../../application/authorization.js';
import { buildSuccessResponse, buildErrorResponse } from '../../../common/apiResponse.js';
import { PostgresUserRepository } from '../../../infrastructure/database/repositories.js';

export const userManagementRouter = Router();

userManagementRouter.get('/users', async (req, res) => {
  try {
    const role = (req.headers['x-user-role'] as string | undefined) ?? 'agent';
    ensureAuthorized(role as 'admin' | 'supervisor' | 'agent', 'view-users');
    const repository = new PostgresUserRepository();
    const users = await listUsers(repository);
    res.json(buildSuccessResponse(users, 'Usuarios obtenidos correctamente'));
  } catch (error) {
    res.status(400).json(buildErrorResponse('No se pudieron obtener los usuarios', error instanceof Error ? error.message : 'UNKNOWN_ERROR'));
  }
});

userManagementRouter.get('/users/:id', async (req, res) => {
  try {
    const role = (req.headers['x-user-role'] as string | undefined) ?? 'agent';
    ensureAuthorized(role as 'admin' | 'supervisor' | 'agent', 'view-users');
    const repository = new PostgresUserRepository();
    const user = await getUserById(repository, req.params.id);
    res.json(buildSuccessResponse(user, 'Usuario obtenido correctamente'));
  } catch (error) {
    res.status(400).json(buildErrorResponse('No se pudo obtener el usuario', error instanceof Error ? error.message : 'UNKNOWN_ERROR'));
  }
});

userManagementRouter.post('/users', async (req, res) => {
  try {
    const role = (req.headers['x-user-role'] as string | undefined) ?? 'agent';
    ensureAuthorized(role as 'admin' | 'supervisor' | 'agent', 'manage-users');
    const repository = new PostgresUserRepository();
    const user = await createUser(repository, req.body, req.body.actorId ?? 'system');
    res.json(buildSuccessResponse(user, 'Usuario creado correctamente'));
  } catch (error) {
    console.error('[POST /users] Error creating user:', error);
    const message = error instanceof Error ? error.message : 'UNKNOWN_ERROR';
    res.status(400).json(buildErrorResponse('No se pudo crear el usuario', message));
  }
});

userManagementRouter.put('/users/:id', async (req, res) => {
  try {
    const role = (req.headers['x-user-role'] as string | undefined) ?? 'agent';
    ensureAuthorized(role as 'admin' | 'supervisor' | 'agent', 'manage-users');
    const repository = new PostgresUserRepository();
    const user = await updateUser(repository, { ...req.body, id: req.params.id }, req.body.actorId ?? 'system');
    res.json(buildSuccessResponse(user, 'Usuario actualizado correctamente'));
  } catch (error) {
    res.status(400).json(buildErrorResponse('No se pudo actualizar el usuario', error instanceof Error ? error.message : 'UNKNOWN_ERROR'));
  }
});

userManagementRouter.patch('/users/:id/role', async (req, res) => {
  try {
    const role = (req.headers['x-user-role'] as string | undefined) ?? 'agent';
    ensureAuthorized(role as 'admin' | 'supervisor' | 'agent', 'manage-users');
    const repository = new PostgresUserRepository();
    const user = await changeUserRole(repository, req.params.id, req.body.role, req.body.actorId ?? 'system');
    res.json(buildSuccessResponse(user, 'Rol actualizado correctamente'));
  } catch (error) {
    res.status(400).json(buildErrorResponse('No se pudo actualizar el rol', error instanceof Error ? error.message : 'UNKNOWN_ERROR'));
  }
});

userManagementRouter.patch('/users/:id/status', async (req, res) => {
  try {
    const role = (req.headers['x-user-role'] as string | undefined) ?? 'agent';
    ensureAuthorized(role as 'admin' | 'supervisor' | 'agent', 'manage-users');
    
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
    res.status(400).json(buildErrorResponse('No se pudo actualizar el estado', error instanceof Error ? error.message : 'UNKNOWN_ERROR'));
  }
});

userManagementRouter.delete('/users/:id', async (req, res) => {
  try {
    const role = (req.headers['x-user-role'] as string | undefined) ?? 'agent';
    ensureAuthorized(role as 'admin' | 'supervisor' | 'agent', 'manage-users');

    const repository = new PostgresUserRepository();
    await deleteUser(repository, req.params.id, req.body.actorId ?? 'system');

    res.json(buildSuccessResponse(null, 'Ficha eliminada correctamente'));
  } catch (error) {
    res.status(400).json(buildErrorResponse('No se pudo eliminar la ficha', error instanceof Error ? error.message : 'UNKNOWN_ERROR'));
  }
});

userManagementRouter.post('/auth/login', async (req, res) => {
  try {
    const repository = new PostgresUserRepository();
    const result = await loginUser(repository, req.body.username, req.body.password, req.body.actorId ?? 'system');
    res.json(buildSuccessResponse(result, 'Inicio de sesión correcto'));
  } catch (error) {
    res.status(401).json(buildErrorResponse('Credenciales inválidas', error instanceof Error ? error.message : 'UNKNOWN_ERROR'));
  }
});
