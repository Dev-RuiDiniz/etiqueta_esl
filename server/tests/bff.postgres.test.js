import { createServer } from 'node:http';
import { spawnSync } from 'node:child_process';
import supertest from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createBffRuntime } from '../index.js';

const DATABASE_URL = (process.env.DATABASE_URL ?? '').trim();
const hasDatabase = Boolean(DATABASE_URL);
const activeContexts = [];

function ensureMigrationsUp() {
  const result = spawnSync('node', ['server/scripts/migrate.js', 'up'], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      DATABASE_URL
    },
    encoding: 'utf8'
  });

  if (result.status !== 0) {
    throw new Error(`Migration failed: ${result.stderr || result.stdout}`);
  }
}

async function createPostgresContext() {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = vi.fn(async () => ({
    status: 200,
    text: async () => JSON.stringify({ error_code: 0, error_msg: '' })
  }));

  const runtime = await createBffRuntime({
    configOverrides: {
      jobsEnabled: false,
      metricsEnabled: true,
      persistenceMode: 'postgres',
      databaseUrl: DATABASE_URL,
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

describe.skipIf(!hasDatabase)('PostgreSQL persistence', () => {
  it('persiste bind no banco e mantém /readyz saudável após migrações', async () => {
    ensureMigrationsUp();
    const ctx = await createPostgresContext();

    const readyResponse = await ctx.request.get('/readyz');
    expect(readyResponse.status).toBe(200);

    const eslCode = `ESL-${Date.now()}`;

    const bindResponse = await ctx.request.post('/api/esl/bind').send({
      esl_code: eslCode,
      product_code: 'SKU-POSTGRES-001',
      template_id: 55
    });

    expect(bindResponse.status).toBe(200);
    expect(bindResponse.body.success).toBe(true);

    const binding = await ctx.runtime.repositories.bindingRepo.getBindingByEslCode(eslCode);
    expect(binding).toBeTruthy();
    expect(binding.product_code).toBe('SKU-POSTGRES-001');
  });
});
