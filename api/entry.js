import { createBffRuntime } from '../server/index.js';

let runtimePromise = null;

function resolveServerlessPersistenceMode() {
  const configuredMode = (process.env.BFF_PERSISTENCE_MODE ?? '').trim().toLowerCase();

  if (configuredMode === 'postgres' && process.env.DATABASE_URL) {
    return 'postgres';
  }

  if (configuredMode === 'memory') {
    return 'memory';
  }

  if (configuredMode === 'sqlite') {
    return 'sqlite';
  }

  // Fallback seguro para funções serverless sem volume persistente.
  return process.env.DATABASE_URL ? 'postgres' : 'memory';
}

async function getRuntime() {
  if (!runtimePromise) {
    runtimePromise = createBffRuntime({
      configOverrides: {
        serverless: true,
        jobsEnabled: false,
        backupEnabled: false,
        persistenceMode: resolveServerlessPersistenceMode()
      }
    }).catch((error) => {
      runtimePromise = null;
      throw error;
    });
  }

  return runtimePromise;
}

function patchIncomingUrl(req) {
  const host = req.headers.host ?? '127.0.0.1';
  const parsed = new URL(req.url ?? '/', `http://${host}`);
  const rewrittenPath = parsed.searchParams.get('__path');

  if (!rewrittenPath) {
    return;
  }

  parsed.searchParams.delete('__path');
  const queryString = parsed.searchParams.toString();
  req.url = `${rewrittenPath}${queryString ? `?${queryString}` : ''}`;
}

export default async function handler(req, res) {
  try {
    patchIncomingUrl(req);
    const runtime = await getRuntime();
    await runtime.handler(req, res);
  } catch (error) {
    res.statusCode = 503;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(
      JSON.stringify({
        success: false,
        error_code: error?.code ?? 'SERVER_BOOTSTRAP_FAILED',
        error_msg: error?.message ?? 'Failed to initialize server runtime.',
        request_id: `BOOT-${Date.now()}`,
        received_at: new Date().toISOString(),
        data: null
      })
    );
  }
}
