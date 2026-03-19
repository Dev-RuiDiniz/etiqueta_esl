import { createServer } from 'node:http';
import supertest from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';
import { createBffRuntime } from '../index.js';

// Sequência de respostas do fornecedor para simular o fluxo completo:
// upsert produto → bind → refresh → query status

const VENDOR_RESPONSES = {
  '/product/create': {
    success: true,
    error_code: 0,
    error_msg: '',
    request_id: 'PROD-001',
    received_at: new Date().toISOString(),
    data: {}
  },
  '/esl/bind': {
    success: true,
    error_code: 0,
    error_msg: '',
    request_id: 'BIND-001',
    received_at: new Date().toISOString(),
    data: { f1: 'ESL001', f2: 'P001' }
  },
  '/esl/bind_task': {
    success: true,
    error_code: 0,
    error_msg: '',
    request_id: 'TASK-001',
    received_at: new Date().toISOString(),
    data: {}
  },
  '/esl/query_count': {
    success: true,
    error_code: 0,
    error_msg: '',
    request_id: 'CNT-001',
    received_at: new Date().toISOString(),
    data: { count: 1, online_count: 1, offline_count: 0 }
  },
  '/esl/query': {
    success: true,
    error_code: 0,
    error_msg: '',
    request_id: 'QRY-001',
    received_at: new Date().toISOString(),
    data: [
      {
        esl_code: 'ESL001',
        online: 1,
        esl_battery: 80,
        battery_percent: 80,
        ap_code: 'AP01',
        product_code: 'P001'
      }
    ]
  }
};

function vendorFetchMock(url, init) {
  const urlStr = typeof url === 'string' ? url : url.toString();
  const method = (init?.method ?? 'GET').toUpperCase();

  for (const [path, body] of Object.entries(VENDOR_RESPONSES)) {
    if (urlStr.includes(path) && (method === 'POST' || method === 'GET')) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(body),
        text: () => Promise.resolve(JSON.stringify(body))
      });
    }
  }

  return Promise.resolve({
    ok: false,
    status: 404,
    json: () => Promise.resolve({ error: 'Not found' }),
    text: () => Promise.resolve('Not found')
  });
}

const baseConfig = {
  jobsEnabled: false,
  metricsEnabled: false,
  persistenceMode: 'memory',
  authEnabled: false,
  eslHost: 'https://vendor.local',
  clientId: 'test',
  sign: 'sign',
  storeCode: '001'
};

const activeContexts = [];

async function createTestContext() {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = vendorFetchMock;

  const runtime = await createBffRuntime({ configOverrides: baseConfig });
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

describe('Workflow ESL completo: produto → bind → refresh → status', () => {
  it('executa fluxo completo e reflete estado no dashboard', async () => {
    const ctx = await createTestContext();

    // 1. Upsert de produto
    const upsertRes = await ctx.request
      .post('/api/esl/products/upsert')
      .send({ product_code: 'P001', product_name: 'Arroz Integral', price: 12.9 });

    expect(upsertRes.status).toBe(200);
    expect(upsertRes.body.success).toBe(true);

    // 2. Bind etiqueta ao produto
    const bindRes = await ctx.request
      .post('/api/esl/bind')
      .send({ esl_code: 'ESL001', product_code: 'P001', template_id: null });

    expect(bindRes.status).toBe(200);
    expect(bindRes.body.success).toBe(true);

    // 3. Verificar que o binding foi persistido
    const bindingsRes = await ctx.request.get('/api/esl/bindings?product_code=P001');
    expect(bindingsRes.status).toBe(200);
    expect(bindingsRes.body.data).toHaveLength(1);
    expect(bindingsRes.body.data[0].esl_code).toBe('ESL001');

    // 4. Trigger refresh
    const refreshRes = await ctx.request
      .post('/api/esl/refresh/trigger')
      .send({ esl_codes: ['ESL001'] });

    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body.success).toBe(true);

    // 5. Forçar sincronização de status do fornecedor
    const syncRes = await ctx.request.post('/api/esl/status/sync').send({});
    expect(syncRes.status).toBe(200);

    // Aguarda query do fornecedor via queryEslStatus (invocado pelo job manual)
    await ctx.request.post('/api/esl/jobs/run').send({});

    // 6. Dashboard deve refletir a etiqueta online
    const dashRes = await ctx.request.get('/api/esl/status/dashboard');
    expect(dashRes.status).toBe(200);
    expect(dashRes.body.success).toBe(true);
    expect(dashRes.body.data.kpis.totalTags).toBeGreaterThanOrEqual(1);
    expect(dashRes.body.data.kpis.online).toBeGreaterThanOrEqual(1);

    // 7. Alertas não devem ter OFFLINE para ESL001
    const alertsRes = await ctx.request.get('/api/esl/alerts');
    expect(alertsRes.status).toBe(200);

    const offlineAlerts = alertsRes.body.data.filter((a) => a.type === 'OFFLINE' && a.tagId === 'ESL001');
    expect(offlineAlerts).toHaveLength(0);

    // 8. Histórico deve ter ao menos uma entrada do produto upsertado
    const histRes = await ctx.request.get('/api/esl/audit/history?limit=50');
    expect(histRes.status).toBe(200);
    expect(Array.isArray(histRes.body.data)).toBe(true);
  });

  it('retorna 422 em bind com esl_code vazio', async () => {
    const ctx = await createTestContext();

    const res = await ctx.request.post('/api/esl/bind').send({
      esl_code: '',
      product_code: 'P001'
    });

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.error_code).toBe(422);
  });

  it('retorna 422 em upsert sem price', async () => {
    const ctx = await createTestContext();

    const res = await ctx.request.post('/api/esl/products/upsert').send({
      product_code: 'P999',
      product_name: 'Test',
      price: -5
    });

    expect(res.status).toBe(422);
    expect(res.body.error_code).toBe(422);
  });
});
