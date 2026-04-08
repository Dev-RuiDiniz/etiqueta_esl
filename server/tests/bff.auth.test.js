import { createServer } from 'node:http';
import supertest from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';
import { createBffRuntime } from '../index.js';

const activeContexts = [];

async function createAuthContext() {
  const runtime = await createBffRuntime({
    configOverrides: {
      jobsEnabled: false,
      metricsEnabled: true,
      persistenceMode: 'memory',
      authEnabled: true,
      jwtAccessSecret: 'test-access-secret',
      jwtRefreshSecret: 'test-refresh-secret',
      jwtAccessTtl: '15m',
      jwtRefreshTtl: '7d',
      authDefaultAdminEmail: 'admin@local.test',
      authDefaultAdminPassword: 'Admin@123',
      eslHost: 'https://vendor.local',
      clientId: 'default',
      sign: 'sign',
      storeCode: '001'
    }
  });

  const server = createServer(runtime.handler);
  await new Promise((resolve) => server.listen(0, resolve));

  const context = {
    runtime,
    request: supertest(server),
    async close() {
      await new Promise((resolve) => server.close(() => resolve()));
      await runtime.stopAll();
    }
  };

  activeContexts.push(context);
  return context;
}

afterEach(async () => {
  while (activeContexts.length > 0) {
    const ctx = activeContexts.pop();
    await ctx.close();
  }
});

describe('Auth JWT + RBAC', () => {
  it('retorna 401 em /api/esl/* sem token quando auth está habilitado', async () => {
    const ctx = await createAuthContext();

    const response = await ctx.request.get('/api/esl/health');
    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.data.code).toBe('AUTH_MISSING_TOKEN');
  });

  it('faz login e acessa rota GET permitida com token válido', async () => {
    const ctx = await createAuthContext();

    const loginResponse = await ctx.request.post('/api/auth/login').send({
      email: 'admin@local.test',
      password: 'Admin@123'
    });

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body.success).toBe(true);
    const accessToken = loginResponse.body.data.access_token;
    expect(accessToken).toBeTruthy();

    const protectedResponse = await ctx.request
      .get('/api/esl/health')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(protectedResponse.status).toBe(200);
    expect(protectedResponse.body.success).toBe(true);
  });

  it('permite usuario executar rota POST operacional', async () => {
    const ctx = await createAuthContext();

    await ctx.runtime.services.authService.createUser({
      email: 'usuario@local.test',
      password: 'Usuario@123',
      role: 'usuario'
    });

    const loginViewer = await ctx.request.post('/api/auth/login').send({
      email: 'usuario@local.test',
      password: 'Usuario@123'
    });

    const viewerToken = loginViewer.body.data.access_token;

    const allowedResponse = await ctx.request
      .post('/api/esl/catalog')
      .set('Authorization', `Bearer ${viewerToken}`)
      .send({
        esl_code: 'ESL-1001',
        display_name: 'Gondola A'
      });

    expect(allowedResponse.status).toBe(200);
  });

  it('retorna 403 para administrador em rota sensível exclusiva de desenvolvedor', async () => {
    const ctx = await createAuthContext();

    await ctx.runtime.services.authService.createUser({
      email: 'gestor-sensivel@local.test',
      password: 'AdminLocal@123',
      role: 'administrador'
    });

    const loginAdmin = await ctx.request.post('/api/auth/login').send({
      email: 'gestor-sensivel@local.test',
      password: 'AdminLocal@123'
    });

    const adminToken = loginAdmin.body.data.access_token;

    const forbiddenResponse = await ctx.request
      .get('/api/esl/dead-letters')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(forbiddenResponse.status).toBe(403);
    expect(forbiddenResponse.body.data.code).toBe('AUTH_FORBIDDEN');
  });

  it('permite administrador acessar dashboard admin e gerenciar usuário comum', async () => {
    const ctx = await createAuthContext();

    await ctx.runtime.services.authService.createUser({
      email: 'gestor@local.test',
      password: 'Gestor@123',
      role: 'administrador'
    });

    const loginAdmin = await ctx.request.post('/api/auth/login').send({
      email: 'gestor@local.test',
      password: 'Gestor@123'
    });

    const adminToken = loginAdmin.body.data.access_token;

    const dashboardResponse = await ctx.request
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(dashboardResponse.status).toBe(200);
    expect(dashboardResponse.body.data.users.by_role.administrador).toBeGreaterThanOrEqual(1);

    const createUserResponse = await ctx.request
      .post('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        email: 'operacao@local.test',
        password: 'Operacao@123',
        role: 'usuario'
      });

    expect(createUserResponse.status).toBe(200);
    expect(createUserResponse.body.data.role).toBe('usuario');
  });

  it('bloqueia administrador ao criar usuário desenvolvedor', async () => {
    const ctx = await createAuthContext();

    await ctx.runtime.services.authService.createUser({
      email: 'gestor2@local.test',
      password: 'Gestor@123',
      role: 'administrador'
    });

    const loginAdmin = await ctx.request.post('/api/auth/login').send({
      email: 'gestor2@local.test',
      password: 'Gestor@123'
    });

    const adminToken = loginAdmin.body.data.access_token;

    const response = await ctx.request
      .post('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        email: 'root@local.test',
        password: 'Root@12345',
        role: 'desenvolvedor'
      });

    expect(response.status).toBe(403);
    expect(response.body.data.code).toBe('AUTH_FORBIDDEN_ROLE_ASSIGNMENT');
  });

  it('executa refresh e logout com refresh token', async () => {
    const ctx = await createAuthContext();

    const loginResponse = await ctx.request.post('/api/auth/login').send({
      email: 'admin@local.test',
      password: 'Admin@123'
    });

    const refreshToken = loginResponse.body.data.refresh_token;

    const refreshResponse = await ctx.request.post('/api/auth/refresh').send({
      refresh_token: refreshToken
    });

    expect(refreshResponse.status).toBe(200);
    expect(refreshResponse.body.data.access_token).toBeTruthy();
    expect(refreshResponse.body.data.refresh_token).toBeTruthy();

    const logoutResponse = await ctx.request.post('/api/auth/logout').send({
      refresh_token: refreshResponse.body.data.refresh_token
    });

    expect(logoutResponse.status).toBe(200);
    expect(logoutResponse.body.data.logged_out).toBe(true);
  });
});
