import assert from 'node:assert/strict';
import test from 'node:test';
import type { AddressInfo } from 'node:net';
import type { UserModel } from '../domain/models.js';
import type { UserRepository } from '../domain/repositories.js';
import { createApp } from './app.js';
import { setUserRepositoryFactory, resetUserRepositoryFactory } from '../infrastructure/http/repositoryFactory.js';
import { requestJson } from '../../../src/app/services/apiClient.js';
import { createUser as createDashboardUser, fetchUsers, updateDeviceForUser } from '../../../src/app/services/dashboardApi.js';
import bcrypt from 'bcrypt';

class InMemoryUserRepository implements UserRepository {
  private users = new Map<string, UserModel>();
  private authUsers = new Map<string, any>();
  private devices = new Map<string, any>();
  private sessions = new Map<string, any>();
  private auditLogs: Array<{ id: string; entityType: string; entityId: string; action: string; performedBy: string; details: string; createdAt: string }> = [];

  async listUsers(): Promise<UserModel[]> {
    return [...this.users.values()];
  }

  async getUserById(id: string): Promise<UserModel | null> {
    return this.users.get(id) ?? null;
  }

  async getUserByUsername(username: string): Promise<UserModel | null> {
    return [...this.users.values()].find((user) => user.username === username) ?? null;
  }

  async createUser(user: UserModel): Promise<UserModel> {
    this.users.set(user.id, user);
    return user;
  }

  async updateUser(user: UserModel): Promise<UserModel> {
    this.users.set(user.id, user);
    return user;
  }

  async updateUserRole(id: string, role: UserModel['role'], _actorId: string): Promise<UserModel | null> {
    const current = this.users.get(id);
    if (!current) return null;
    const updated = { ...current, role, accessToPanel: role !== 'agent', updatedAt: new Date().toISOString() };
    this.users.set(id, updated);
    return updated;
  }

  async updateUserStatus(id: string, status: UserModel['status']): Promise<UserModel | null> {
    const current = this.users.get(id);
    if (!current) return null;
    const updated = { ...current, status, updatedAt: new Date().toISOString() };
    this.users.set(id, updated);
    return updated;
  }

  async deleteUser(id: string): Promise<void> {
    this.users.delete(id);
  }

  async createAuditLog(entry: { id: string; entityType: string; entityId: string; action: string; performedBy: string; details: string; createdAt: string }): Promise<void> {
    this.auditLogs.push(entry);
  }

  async createSession(session: any): Promise<void> {
    this.sessions.set(session.tokenHash, session);
  }

  async getSessionByTokenHash(tokenHash: string): Promise<any> {
    return this.sessions.get(tokenHash) ?? null;
  }

  async revokeSession(tokenHash: string): Promise<void> {
    const session = this.sessions.get(tokenHash);
    if (session) {
      session.revokedAt = new Date().toISOString();
      this.sessions.set(tokenHash, session);
    }
  }

  async listDevices(): Promise<any[]> {
    return [...this.devices.values()];
  }

  async getDeviceByUserId(userId: string): Promise<any | null> {
    return this.devices.get(userId) ?? null;
  }

  async upsertDevice(device: any): Promise<any> {
    this.devices.set(device.userId, device);
    return device;
  }

  async getAuthUserByUsername(username: string): Promise<any | null> {
    return this.authUsers.get(username) ?? null;
  }

  async upsertAuthUser(authUser: any): Promise<any> {
    this.authUsers.set(authUser.username, authUser);
    return authUser;
  }

  seedAdminUser(): void {
    const passwordHash = bcrypt.hashSync('secret', 10);
    this.users.set('admin-user', {
      id: 'admin-user',
      fullName: 'Admin Principal',
      username: 'admin',
      passwordHash,
      role: 'admin',
      status: 'active',
      accessToPanel: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }
}

test('frontend and backend complete a full user-management flow end to end', async (t) => {
  const repository = new InMemoryUserRepository();
  repository.seedAdminUser();
  setUserRepositoryFactory(() => repository);

  const app = createApp();
  const server = app.listen(0, '127.0.0.1');
  t.after(() => {
    resetUserRepositoryFactory();
    server.close();
  });

  await new Promise<void>((resolve) => server.once('listening', resolve));
  const address = server.address() as AddressInfo;
  const baseUrl = `http://127.0.0.1:${address.port}/api`;
  process.env.VITE_API_BASE = baseUrl;

  const loginResponse = await requestJson<{ success: boolean; data?: { sessionToken: string } }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username: 'admin', password: 'secret' }),
  });

  const sessionToken = loginResponse.data?.sessionToken;
  assert.ok(sessionToken, 'expected a session token from the backend');

  const windowMock = {
    localStorage: {
      store: new Map<string, string>(),
      getItem(key: string) {
        return this.store.get(key) ?? null;
      },
      setItem(key: string, value: string) {
        this.store.set(key, value);
      },
      removeItem(key: string) {
        this.store.delete(key);
      },
    },
  };
  (globalThis as any).window = windowMock;
  windowMock.localStorage.setItem('crm_session_token', sessionToken);

  const createdUser = await createDashboardUser({
    fullName: 'María García',
    username: 'maria.garcia',
    passwordHash: 'plain-password',
    role: 'agent',
    status: 'active',
    accessToPanel: false,
  }, 'admin', 'admin-user');

  const users = await fetchUsers('admin');
  assert.ok(users.some((user) => user.id === createdUser.id));

  const updatedDevice = await updateDeviceForUser(createdUser.id, {
    brandModel: 'Samsung A54',
    serialNumber1: 'SN-001',
    serialNumber2: 'SN-002',
    assignedPhone: '+584141234567',
  }, 'admin');

  assert.equal(updatedDevice.userId, createdUser.id);
  assert.equal((updatedDevice as any).brandModel, 'Samsung A54');

  const persisted = await repository.getDeviceByUserId(createdUser.id);
  assert.equal(persisted?.assignedPhone, '+584141234567');
});
