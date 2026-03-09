import { createServer } from 'node:http';
import { loadConfig } from './config.js';
import { EslApiClient } from './esl/eslApiClient.js';
import { EslAuditLogService } from './esl/eslAuditLogService.js';
import { EslBindingService } from './esl/bindService.js';
import { EslLedService } from './esl/ledService.js';
import { EslProductSyncService } from './esl/productSyncService.js';
import { EslRefreshService } from './esl/refreshService.js';
import { createEslRoutes } from './esl/routes.js';
import { EslStatusService } from './esl/statusService.js';
import { EslTemplateService } from './esl/templateService.js';
import { startDeadLetterJob } from './jobs/deadLetterJob.js';
import { startProductSyncJob } from './jobs/productSyncJob.js';
import { startReconciliationJob } from './jobs/reconciliationJob.js';
import { startRefreshTriggerJob } from './jobs/refreshTriggerJob.js';
import { startStatusPollingJob } from './jobs/statusPollingJob.js';
import { loadDotEnv } from './utils/env.js';
import { readJsonBody, sendJson, sendNoContent, setCorsHeaders } from './utils/http.js';

// Carrega .env/.env.local sem dependências externas.
loadDotEnv();

const config = loadConfig();
const apiClient = new EslApiClient(config);
const auditLogService = new EslAuditLogService();
const refreshService = new EslRefreshService({ config, apiClient, auditLogService });
const productSyncService = new EslProductSyncService({
  config,
  apiClient,
  refreshService,
  auditLogService
});
const bindingService = new EslBindingService({
  config,
  apiClient,
  refreshService,
  auditLogService
});
const statusService = new EslStatusService({ config, apiClient, auditLogService });
const templateService = new EslTemplateService({ config, apiClient, auditLogService });
const ledService = new EslLedService({ config, apiClient, auditLogService });

async function runJobsOnce() {
  // Execução manual útil para troubleshooting e smoke test operacional.
  const productSync = await productSyncService.flushPendingUpserts(50);
  const refreshDispatch = await refreshService.dispatchQueuedRefresh();
  const statusPoll = await statusService.pollAndCacheStatus({ pageSize: 100 });

  return {
    product_sync: productSync,
    refresh_dispatch: refreshDispatch,
    status_poll: statusPoll
  };
}

const route = createEslRoutes({
  config,
  productSyncService,
  templateService,
  bindingService,
  refreshService,
  statusService,
  ledService,
  auditLogService,
  runJobsOnce
});

const server = createServer(async (req, res) => {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    sendNoContent(res);
    return;
  }

  const host = req.headers.host ?? `127.0.0.1:${config.port}`;
  const url = new URL(req.url ?? '/', `http://${host}`);

  let body = {};

  if (req.method !== 'GET') {
    try {
      body = await readJsonBody(req);
    } catch (error) {
      sendJson(res, 400, {
        success: false,
        error_code: 400,
        error_msg: error.message,
        request_id: `REQ-${Date.now()}`,
        received_at: new Date().toISOString(),
        data: null
      });
      return;
    }
  }

  try {
    const handled = await route(req, res, url, body);

    if (!handled) {
      sendJson(res, 404, {
        success: false,
        error_code: 404,
        error_msg: 'Route not found',
        request_id: `REQ-${Date.now()}`,
        received_at: new Date().toISOString(),
        data: null
      });
    }
  } catch (error) {
    sendJson(res, 500, {
      success: false,
      error_code: error.statusCode ?? 500,
      error_msg: error.message ?? 'Internal server error',
      request_id: `REQ-${Date.now()}`,
      received_at: new Date().toISOString(),
      data: {
        code: error.code ?? 'INTERNAL_ERROR'
      }
    });
  }
});

const stopJobs = [];

if (config.jobsEnabled) {
  // Agenda jobs principais definidos no plano de integração.
  stopJobs.push(
    startProductSyncJob({ productSyncService, intervalMs: config.productSyncIntervalMs }),
    startRefreshTriggerJob({ refreshService, intervalMs: config.refreshTriggerIntervalMs }),
    startStatusPollingJob({ statusService, intervalMs: config.statusPollingIntervalMs }),
    startReconciliationJob({
      statusService,
      bindingService,
      refreshService,
      intervalMs: config.reconciliationIntervalMs
    }),
    startDeadLetterJob({
      intervalMs: config.deadLetterIntervalMs,
      replayHandlers: {
        'product.create': async (entry) => {
          if (entry.payload) {
            await productSyncService.upsertProduct({
              product_code: entry.payload.pc ?? entry.payload.product_code,
              product_name: entry.payload.pn ?? entry.payload.product_name,
              price: entry.payload.pp ?? entry.payload.price,
              quantity: entry.payload.qty ?? entry.payload.quantity
            });
          }
        },
        'product.create_multiple': async (entry) => {
          if (Array.isArray(entry.payload)) {
            await productSyncService.upsertProducts(
              entry.payload.map((item) => ({
                product_code: item.pc ?? item.product_code,
                product_name: item.pn ?? item.product_name,
                price: item.pp ?? item.price,
                quantity: item.qty ?? item.quantity
              }))
            );
          }
        },
        'esl.bind': async (entry) => {
          if (entry.payload) {
            await bindingService.bind({
              esl_code: entry.payload.f1,
              product_code: entry.payload.f2,
              template_id: entry.payload.f3
            });
          }
        },
        'esl.unbind': async (entry) => {
          if (entry.payload?.f1) {
            await bindingService.unbind(entry.payload.f1);
          }
        },
        'esl.bind_task': async () => {
          await refreshService.triggerRefresh();
        }
      }
    })
  );
}

server.listen(config.port, () => {
  console.log(`[esl-bff] listening on http://127.0.0.1:${config.port}`);
  if (config.jobsEnabled) {
    console.log('[esl-bff] background jobs are enabled');
  }
});

function shutdown() {
  for (const stopJob of stopJobs) {
    stopJob();
  }

  server.close(() => {
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
