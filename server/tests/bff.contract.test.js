import { createServer } from 'node:http';
import supertest from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createBffRuntime } from '../index.js';

const baseConfig = {
  jobsEnabled: false,
  metricsEnabled: true,
  persistenceMode: 'memory',
  authEnabled: false,
  eslHost: 'https://vendor.local',
  clientId: 'default',
  sign: 'sign',
  storeCode: '001'
};

const activeContexts = [];

async function createTestContext({ configOverrides = {}, fetchMock = null } = {}) {
  const originalFetch = globalThis.fetch;

  if (fetchMock) {
    globalThis.fetch = fetchMock;
  }

  const runtime = await createBffRuntime({
    configOverrides: {
      ...baseConfig,
      ...configOverrides
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
      globalThis.fetch = originalFetch;
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

describe('BFF contract', () => {
  it('retorna contrato padrão em /healthz', async () => {
    const ctx = await createTestContext();
    const response = await ctx.request.get('/healthz');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.error_code).toBe(0);
    expect(typeof response.body.request_id).toBe('string');
    expect(response.body.received_at).toBeTruthy();
    expect(response.body.data.status).toBe('ok');
  });

  it('retorna 404 com envelope padrão em rota inexistente', async () => {
    const ctx = await createTestContext();
    const response = await ctx.request.get('/nao-existe');

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.error_code).toBe(404);
    expect(response.body.error_msg).toBe('Route not found');
    expect(typeof response.body.request_id).toBe('string');
    expect(response.body.received_at).toBeTruthy();
  });

  it('expõe métricas no endpoint /metrics', async () => {
    const ctx = await createTestContext();

    await ctx.request.get('/healthz');

    const response = await ctx.request.get('/metrics');
    expect(response.status).toBe(200);
    expect(response.text).toContain('esl_bff_http_requests_total');
  });

  it('executa bind e registra auditoria com vendor mockado', async () => {
    const fetchMock = vi.fn(async () => {
      return {
        status: 200,
        text: async () => JSON.stringify({ error_code: 0, error_msg: '' })
      };
    });

    const ctx = await createTestContext({ fetchMock });

    const bindResponse = await ctx.request.post('/api/esl/bind').send({
      esl_code: '54200001',
      product_code: 'SKU-001',
      template_id: 10
    });

    expect(bindResponse.status).toBe(200);
    expect(bindResponse.body.success).toBe(true);

    const auditResponse = await ctx.request.get('/api/esl/audit?limit=10');
    expect(auditResponse.status).toBe(200);
    expect(Array.isArray(auditResponse.body.data)).toBe(true);
    expect(auditResponse.body.data.length).toBeGreaterThan(0);
    expect(fetchMock).toHaveBeenCalled();
  });
});
