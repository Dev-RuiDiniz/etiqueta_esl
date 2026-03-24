import { createServer } from 'node:http';
import supertest from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';
import { createBffRuntime } from '../index.js';

const VENDOR_RESPONSES = {
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
        esl_code: 'DISCOVERED-001',
        online: 1,
        esl_battery: 3020,
        product_code: null,
        ap_code: 'AP-01',
        esltype_code: 'ESL-42R',
        updated_at: '2026-03-20T11:00:00.000Z'
      },
      {
        esl_code: 'DISCOVERED-002',
        online: 0,
        esl_battery: 2870,
        product_code: null,
        ap_code: null,
        esltype_code: null,
        updated_at: '2026-03-20T11:02:00.000Z'
      }
    ]
  },
  '/template/query': {
    success: true,
    error_code: 0,
    error_msg: '',
    request_id: 'TPL-001',
    received_at: new Date().toISOString(),
    data: [
      {
        id: 10,
        esltype_code: 'ESL-42R',
        esltemplate_name: 'Template 42R',
        esltemplate_default: 1
      },
      {
        id: 99,
        esltype_code: 'ESL-21R',
        esltemplate_name: 'Template 21R',
        esltemplate_default: 0
      }
    ]
  },
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
    data: {}
  },
  '/esl/unbind': {
    success: true,
    error_code: 0,
    error_msg: '',
    request_id: 'UNBIND-001',
    received_at: new Date().toISOString(),
    data: {}
  },
  '/esl/search': {
    success: true,
    error_code: 0,
    error_msg: '',
    request_id: 'SEARCH-001',
    received_at: new Date().toISOString(),
    data: {}
  }
};

function vendorFetchMock(url) {
  const urlStr = typeof url === 'string' ? url : url.toString();

  for (const [path, body] of Object.entries(VENDOR_RESPONSES)) {
    if (urlStr.includes(path)) {
      return Promise.resolve({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify(body))
      });
    }
  }

  return Promise.resolve({
    ok: false,
    status: 404,
    text: () => Promise.resolve('not found')
  });
}

const activeContexts = [];

async function createTestContext() {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = vendorFetchMock;

  const runtime = await createBffRuntime({
    configOverrides: {
      jobsEnabled: false,
      metricsEnabled: false,
      persistenceMode: 'memory',
      authEnabled: false,
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

describe('ESL catalog routes', () => {
  it('creates local ESLs, imports vendor discovery and binds/unbinds through catalog endpoints', async () => {
    const ctx = await createTestContext();

    const createRes = await ctx.request.post('/api/esl/catalog').send({
      esl_code: 'MANUAL-001',
      display_name: 'Entrada da loja',
      expected_ap_code: 'AP-EXPECTED-01'
    });

    expect(createRes.status).toBe(200);
    expect(createRes.body.data.esl_code).toBe('MANUAL-001');
    expect(createRes.body.data.source).toBe('MANUAL');
    expect(createRes.body.data.registration_status).toBe('PENDING_DISCOVERY');
    expect(createRes.body.data.expected_ap_code).toBe('AP-EXPECTED-01');

    const importRes = await ctx.request.post('/api/esl/catalog/import').send({});
    expect(importRes.status).toBe(200);
    expect(importRes.body.success).toBe(true);

    const catalogRes = await ctx.request.get('/api/esl/catalog');
    expect(catalogRes.status).toBe(200);
    expect(catalogRes.body.data.some((item) => item.esl_code === 'DISCOVERED-001')).toBe(true);

    const discovered = catalogRes.body.data.find((item) => item.esl_code === 'DISCOVERED-001');
    expect(discovered.ap_code).toBe('AP-01');
    expect(discovered.esltype_code).toBe('ESL-42R');
    expect(discovered.snapshot.esl_code).toBe('DISCOVERED-001');

    const overviewRes = await ctx.request.get('/api/esl/stations/overview');
    expect(overviewRes.status).toBe(200);
    expect(overviewRes.body.data.totals.stations).toBe(3);

    const apStation = overviewRes.body.data.stations.find((station) => station.station_code === 'AP-01');
    expect(apStation.total_tags).toBe(1);
    expect(apStation.tags[0].compatible_templates).toHaveLength(1);
    expect(apStation.tags[0].compatible_templates[0].id).toBe(10);

    const expectedStation = overviewRes.body.data.stations.find((station) => station.station_code === 'AP-EXPECTED-01');
    expect(expectedStation.total_tags).toBe(1);
    expect(expectedStation.tags[0].expected_ap_code).toBe('AP-EXPECTED-01');
    expect(expectedStation.tags[0].registration_status).toBe('PENDING_DISCOVERY');

    const unassignedStation = overviewRes.body.data.stations.find((station) => station.station_code === 'UNASSIGNED');
    expect(unassignedStation.total_tags).toBe(1);
    expect(unassignedStation.tags.every((tag) => tag.compatibility_known === false)).toBe(true);
    expect(unassignedStation.tags.every((tag) => tag.compatible_templates.length === 0)).toBe(true);

    await ctx.request.post('/api/esl/products/upsert').send({
      product_code: 'SKU-CAT-001',
      product_name: 'Produto Catálogo',
      price: 9.9
    });

    const bindBeforeDiscovery = await ctx.request.post('/api/esl/catalog/MANUAL-001/bind').send({
      product_code: 'SKU-CAT-001',
      template_id: 10
    });

    expect(bindBeforeDiscovery.status).toBe(409);
    expect(bindBeforeDiscovery.body.data.code).toBe('ESL_PENDING_DISCOVERY');

    await ctx.runtime.repositories.statusRepo.upsertStatusSnapshots([
      {
        esl_code: 'MANUAL-001',
        online: 1,
        esl_battery: 3010,
        ap_code: 'AP-EXPECTED-01',
        esltype_code: 'ESL-42R',
        updated_at: '2026-03-20T12:00:00.000Z'
      }
    ]);

    await ctx.runtime.repositories.eslCatalogRepo.upsertCatalogItem({
      esl_code: 'MANUAL-001',
      registration_status: 'REGISTERED',
      ap_code: 'AP-EXPECTED-01',
      expected_ap_code: 'AP-EXPECTED-01',
      esltype_code: 'ESL-42R'
    });

    const bindRes = await ctx.request.post('/api/esl/catalog/MANUAL-001/bind').send({
      product_code: 'SKU-CAT-001',
      template_id: 10
    });

    expect(bindRes.status).toBe(200);
    expect(bindRes.body.success).toBe(true);

    const boundCatalog = await ctx.request.get('/api/esl/catalog');
    const manualItem = boundCatalog.body.data.find((item) => item.esl_code === 'MANUAL-001');
    expect(manualItem.binding.product_code).toBe('SKU-CAT-001');
    expect(manualItem.registration_status).toBe('BOUND');

    const unbindRes = await ctx.request.post('/api/esl/catalog/MANUAL-001/unbind').send({});
    expect(unbindRes.status).toBe(200);
    expect(unbindRes.body.success).toBe(true);

    const afterUnbind = await ctx.request.get('/api/esl/catalog');
    const manualAfterUnbind = afterUnbind.body.data.find((item) => item.esl_code === 'MANUAL-001');
    expect(manualAfterUnbind.binding).toBe(null);
    expect(manualAfterUnbind.registration_status).toBe('REGISTERED');
  });
});
