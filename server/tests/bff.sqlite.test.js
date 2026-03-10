import { createServer } from 'node:http';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import { join } from 'node:path';
import supertest from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createBffRuntime } from '../index.js';

const activeContexts = [];

async function createSqliteContext() {
  const dataDir = mkdtempSync(join(os.tmpdir(), 'etiqueta-bff-sqlite-'));
  const originalFetch = globalThis.fetch;

  globalThis.fetch = vi.fn(async () => ({
    status: 200,
    text: async () => JSON.stringify({ error_code: 0, error_msg: '' })
  }));

  const runtime = await createBffRuntime({
    configOverrides: {
      jobsEnabled: false,
      metricsEnabled: true,
      persistenceMode: 'sqlite',
      dataDir,
      backupEnabled: false,
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
      rmSync(dataDir, { recursive: true, force: true });
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

describe('SQLite persistence runtime', () => {
  it('keeps /readyz healthy and persists bind operations to local sqlite file', async () => {
    const ctx = await createSqliteContext();

    const readyResponse = await ctx.request.get('/readyz');
    expect(readyResponse.status).toBe(200);
    expect(readyResponse.body.data.checks.persistence_mode).toBe('sqlite');

    const eslCode = `ESL-${Date.now()}`;

    const bindResponse = await ctx.request.post('/api/esl/bind').send({
      esl_code: eslCode,
      product_code: 'SKU-SQLITE-001',
      template_id: 55
    });

    expect(bindResponse.status).toBe(200);
    expect(bindResponse.body.success).toBe(true);

    const binding = await ctx.runtime.repositories.bindingRepo.getBindingByEslCode(eslCode);
    expect(binding).toBeTruthy();
    expect(binding.product_code).toBe('SKU-SQLITE-001');
  });
});
