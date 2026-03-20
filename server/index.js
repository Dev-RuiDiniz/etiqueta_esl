import { createServer } from 'node:http';
import { pathToFileURL } from 'node:url';
import { assertAuthConfig, getMissingEslConfig, loadConfig } from './config.js';
import { AuthService } from './auth/service.js';
import { createAuthRoutes } from './auth/routes.js';
import { authorizeRequest } from './auth/guard.js';
import { createRepositories } from './db/repositories/index.js';
import { EslApiClient } from './esl/eslApiClient.js';
import { EslAuditLogService } from './esl/eslAuditLogService.js';
import { EslBindingService } from './esl/bindService.js';
import { EslCatalogService } from './esl/catalogService.js';
import { EslLedService } from './esl/ledService.js';
import { EslProductSyncService } from './esl/productSyncService.js';
import { EslRefreshService } from './esl/refreshService.js';
import { createEslRoutes } from './esl/routes.js';
import { EslStatusService } from './esl/statusService.js';
import { EslTemplateService } from './esl/templateService.js';
import { startBackupJob } from './jobs/backupJob.js';
import { startDeadLetterJob } from './jobs/deadLetterJob.js';
import { startProductSyncJob } from './jobs/productSyncJob.js';
import { startReconciliationJob } from './jobs/reconciliationJob.js';
import { startRefreshTriggerJob } from './jobs/refreshTriggerJob.js';
import { startRetentionJob } from './jobs/retentionJob.js';
import { startStatusPollingJob } from './jobs/statusPollingJob.js';
import { createLogger } from './observability/logger.js';
import { createMetrics } from './observability/metrics.js';
import { loadDotEnv } from './utils/env.js';
import { categorizeError, toHttpErrorPayload } from './utils/errors.js';
import { readJsonBody, sendJson, sendNoContent, setCorsHeaders } from './utils/http.js';

function buildRequestId(prefix = 'REQ') {
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix}-${Date.now()}-${random}`;
}

export async function createBffRuntime({ configOverrides = {} } = {}) {
  // Carrega .env/.env.local sem dependências externas.
  loadDotEnv();

  const config = {
    ...loadConfig(),
    ...configOverrides
  };

  assertAuthConfig(config);

  const logger = createLogger(config);
  const repositories = createRepositories(config);

  const auditLogService = new EslAuditLogService({
    commandLogRepo: repositories.commandLogRepo
  });

  const refreshService = new EslRefreshService({
    config,
    apiClient: null,
    auditLogService,
    deadLetterRepo: repositories.deadLetterRepo
    // metrics é atribuído após createMetrics (abaixo)
  });

  const metrics = createMetrics(config, {
    refreshService,
    deadLetterRepo: repositories.deadLetterRepo
  });

  const apiClient = new EslApiClient(config, { metrics, logger });
  refreshService.apiClient = apiClient;
  refreshService.metrics = metrics;

  const productSyncService = new EslProductSyncService({
    config,
    apiClient,
    refreshService,
    auditLogService,
    bindingRepo: repositories.bindingRepo,
    productRepo: repositories.productRepo,
    deadLetterRepo: repositories.deadLetterRepo,
    metrics
  });

  const bindingService = new EslBindingService({
    config,
    apiClient,
    refreshService,
    auditLogService,
    bindingRepo: repositories.bindingRepo,
    deadLetterRepo: repositories.deadLetterRepo,
    metrics,
    eslCatalogRepo: repositories.eslCatalogRepo
  });

  const statusService = new EslStatusService({
    config,
    apiClient,
    auditLogService,
    statusRepo: repositories.statusRepo,
    deadLetterRepo: repositories.deadLetterRepo,
    eslCatalogRepo: repositories.eslCatalogRepo
  });

  const templateService = new EslTemplateService({
    config,
    apiClient,
    auditLogService,
    deadLetterRepo: repositories.deadLetterRepo
  });

  const ledService = new EslLedService({
    config,
    apiClient,
    auditLogService,
    deadLetterRepo: repositories.deadLetterRepo
  });

  const catalogService = new EslCatalogService({
    eslCatalogRepo: repositories.eslCatalogRepo,
    bindingRepo: repositories.bindingRepo,
    statusRepo: repositories.statusRepo,
    productRepo: repositories.productRepo,
    templateService,
    statusService,
    bindingService,
    ledService
  });

  const authService = new AuthService({
    config,
    userRepo: repositories.userRepo,
    refreshTokenRepo: repositories.refreshTokenRepo,
    logger
  });

  await authService.ensureDefaultAdmin();

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

  const eslRoute = createEslRoutes({
    config,
    productSyncService,
    templateService,
    bindingService,
    refreshService,
    statusService,
    ledService,
    catalogService,
    auditLogService,
    deadLetterRepo: repositories.deadLetterRepo,
    bindingRepo: repositories.bindingRepo,
    runJobsOnce
  });

  const authRoute = createAuthRoutes({ authService });

  async function probeVendorHealth() {
    if (getMissingEslConfig(config).length > 0) {
      return {
        success: false,
        error_code: 'ESL_CONFIG_MISSING',
        error_msg: 'Missing ESL configuration'
      };
    }

    try {
      const result = await apiClient.get('/esl/query_count', {}, { requestTimeoutMs: Math.min(config.requestTimeoutMs, 3000) });

      if (!result.success) {
        return {
          success: false,
          error_code: result.error_code ?? 'ESL_VENDOR_UNREADY',
          error_msg: result.error_msg || 'Vendor readiness probe failed'
        };
      }

      return {
        success: true,
        error_code: 0,
        error_msg: ''
      };
    } catch (error) {
      return {
        success: false,
        error_code: error?.code ?? 'ESL_VENDOR_UNREACHABLE',
        error_msg: error?.message ?? 'Vendor readiness probe failed'
      };
    }
  }

  async function sendReadyStatus(res, requestId = null) {
    const missingEslConfig = getMissingEslConfig(config);
    let dbReady = false;
    let dbReadyError = null;
    let vendorProbe = {
      success: false,
      error_code: 'ESL_CONFIG_MISSING',
      error_msg: 'Missing ESL configuration'
    };

    try {
      dbReady = await repositories.ready();
    } catch (error) {
      dbReady = false;
      dbReadyError = error?.message ?? 'unknown';
    }

    const checks = {
      esl_config_ready: missingEslConfig.length === 0,
      persistence_mode: repositories.mode,
      db_ready: dbReady
    };

    let authConfigReady = true;

    try {
      assertAuthConfig(config);
    } catch {
      authConfigReady = false;
    }

    checks.auth_config_ready = authConfigReady;
    checks.vendor_api_ready = false;

    if (checks.esl_config_ready) {
      vendorProbe = await probeVendorHealth();
      checks.vendor_api_ready = vendorProbe.success;
    }

    const ready = checks.esl_config_ready && checks.db_ready && checks.auth_config_ready && checks.vendor_api_ready;

    sendJson(res, ready ? 200 : 503, {
      success: ready,
      error_code: ready ? 0 : 503,
      error_msg: ready ? '' : 'Service not ready',
      request_id: requestId ?? buildRequestId('READY'),
      received_at: new Date().toISOString(),
      data: {
        checks,
        missing_esl_config: missingEslConfig,
        db_error: dbReadyError,
        vendor_probe: vendorProbe
      }
    });
  }

  const stopJobs = [];

  function startJobs() {
    if (config.backupEnabled) {
      if (repositories.mode === 'sqlite' && typeof repositories.createBackup === 'function') {
        stopJobs.push(
          startBackupJob({
            repositories,
            intervalMs: config.backupIntervalMs,
            retentionCount: config.backupRetentionCount,
            logger
          })
        );

        logger.info(
          {
            interval_ms: config.backupIntervalMs,
            retention_count: config.backupRetentionCount,
            backup_dir: repositories.storagePaths?.backupDir ?? null
          },
          'Local backup job enabled.'
        );
      } else {
        logger.info(
          { persistence_mode: repositories.mode },
          'Local backup job skipped: persistence mode does not support local backups.'
        );
      }
    } else {
      logger.info('Local backup job disabled by configuration.');
    }

    if (!config.jobsEnabled) {
      logger.info('Background ESL jobs disabled by configuration.');
      return;
    }

    stopJobs.push(
      startProductSyncJob({
        productSyncService,
        intervalMs: config.productSyncIntervalMs,
        logger,
        metrics
      }),
      startRefreshTriggerJob({
        refreshService,
        intervalMs: config.refreshTriggerIntervalMs,
        logger,
        metrics
      }),
      startStatusPollingJob({
        statusService,
        intervalMs: config.statusPollingIntervalMs,
        logger,
        metrics
      }),
      startReconciliationJob({
        statusService,
        bindingService,
        bindingRepo: repositories.bindingRepo,
        refreshService,
        intervalMs: config.reconciliationIntervalMs,
        logger,
        metrics
      }),
      startDeadLetterJob({
        deadLetterRepo: repositories.deadLetterRepo,
        intervalMs: config.deadLetterIntervalMs,
        logger,
        metrics,
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
      }),
      startRetentionJob({
        commandLogRepo: repositories.commandLogRepo,
        deadLetterRepo: repositories.deadLetterRepo,
        commandLogRetentionDays: config.commandLogRetentionDays,
        deadLetterRetentionDays: config.deadLetterRetentionDays,
        intervalMs: config.retentionIntervalMs,
        logger
      })
    );

    logger.info('Background ESL jobs are enabled and running.');
  }

  async function stopAll() {
    for (const stop of stopJobs) {
      stop();
    }

    await repositories.close();
  }

  async function handler(req, res) {
    setCorsHeaders(res, req, config.allowedOrigins);

    const host = req.headers.host ?? `127.0.0.1:${config.port}`;
    const url = new URL(req.url ?? '/', `http://${host}`);
    const requestId = buildRequestId();

    const stopTimer = metrics.startHttpTimer(req.method, url.pathname);
    res.on('finish', () => {
      stopTimer(res.statusCode);
    });

    if (req.method === 'OPTIONS') {
      sendNoContent(res);
      return;
    }

    if (req.method === 'GET' && url.pathname === '/healthz') {
      sendJson(res, 200, {
        success: true,
        error_code: 0,
        error_msg: '',
        request_id: requestId,
        received_at: new Date().toISOString(),
        data: {
          status: 'ok',
          uptime_seconds: process.uptime()
        }
      });
      return;
    }

    if (req.method === 'GET' && url.pathname === '/readyz') {
      await sendReadyStatus(res, requestId);
      return;
    }

    if (req.method === 'GET' && url.pathname === '/metrics') {
      const metricsPayload = await metrics.render();
      res.writeHead(200, {
        'Content-Type': metrics.registry.contentType
      });
      res.end(metricsPayload);
      return;
    }

    let body = {};

    if (req.method !== 'GET') {
      try {
        body = await readJsonBody(req);
      } catch (error) {
        metrics.trackError(categorizeError(error));
        const statusCode = error.code === 'PAYLOAD_TOO_LARGE' ? 413 : 400;
        sendJson(res, statusCode, {
          success: false,
          error_code: statusCode,
          error_msg: error.message,
          request_id: requestId,
          received_at: new Date().toISOString(),
          data: {
            code: error.code ?? 'INVALID_JSON'
          }
        });
        return;
      }
    }

    try {
      const authHandled = await authRoute(req, res, url.pathname, body);
      if (authHandled) {
        return;
      }

      req.user = await authorizeRequest(req, url.pathname, config, authService);

      const handled = await eslRoute(req, res, url, body);
      if (handled) {
        return;
      }

      sendJson(res, 404, {
        success: false,
        error_code: 404,
        error_msg: 'Route not found',
        request_id: requestId,
        received_at: new Date().toISOString(),
        data: null
      });
    } catch (error) {
      const category = categorizeError(error);
      metrics.trackError(category);
      logger.error({ err: error, category, path: url.pathname, method: req.method, request_id: requestId }, 'Request failed');
      const payload = toHttpErrorPayload(error, requestId);
      sendJson(res, Number(error?.statusCode ?? 500), payload);
    }
  }

  return {
    config,
    logger,
    metrics,
    repositories,
    services: {
      apiClient,
      auditLogService,
      refreshService,
      productSyncService,
      bindingService,
      statusService,
      templateService,
      ledService,
      catalogService,
      authService
    },
    startJobs,
    stopAll,
    handler
  };
}

export async function startBffServer(options = {}) {
  const runtime = await createBffRuntime(options);
  runtime.startJobs();

  const server = createServer(runtime.handler);

  await new Promise((resolve) => {
    server.listen(runtime.config.port, () => {
      runtime.logger.info({ port: runtime.config.port }, 'esl-bff listening');
      resolve();
    });
  });

  async function shutdown() {
    await new Promise((resolve) => {
      server.close(() => resolve());
    });
    await runtime.stopAll();
  }

  return {
    runtime,
    server,
    shutdown
  };
}

const isDirectRun = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  const { shutdown } = await startBffServer();

  const handleSignal = async () => {
    await shutdown();
    process.exit(0);
  };

  process.on('SIGINT', handleSignal);
  process.on('SIGTERM', handleSignal);
}
