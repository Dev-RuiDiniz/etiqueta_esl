import { getMissingEslConfig } from '../config.js';
import { sendJson } from '../utils/http.js';

function toPositiveInt(raw, fallback) {
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : fallback;
}

function buildCommandResult(result) {
  return {
    success: Boolean(result?.success),
    error_code: Number(result?.error_code ?? (result?.success ? 0 : 1)),
    error_msg: String(result?.error_msg ?? ''),
    request_id: String(result?.request_id ?? ''),
    received_at: result?.received_at ?? new Date().toISOString(),
    data: result?.data ?? null
  };
}

export function createEslRoutes({
  config,
  productSyncService,
  templateService,
  bindingService,
  refreshService,
  statusService,
  ledService,
  auditLogService,
  deadLetterRepo,
  runJobsOnce
}) {
  return async function route(req, res, url, body) {
    const { pathname, searchParams } = url;

    // Endpoints de operação e monitoramento expostos ao frontend.
    if (req.method === 'GET' && pathname === '/api/esl/health') {
      const missing = getMissingEslConfig(config);

      sendJson(res, 200, {
        success: missing.length === 0,
        service: 'esl-bff',
        mode: missing.length === 0 ? 'ready' : 'degraded',
        missing,
        jobs_enabled: config.jobsEnabled,
        store_code: config.storeCode
      });
      return true;
    }

    if (req.method === 'GET' && pathname === '/api/esl/templates') {
      const page = toPositiveInt(searchParams.get('page'), 1);
      const size = toPositiveInt(searchParams.get('size'), 100);
      const forceRefresh = searchParams.get('forceRefresh') === 'true';

      const result = await templateService.queryTemplates({ page, size, forceRefresh });
      sendJson(res, 200, buildCommandResult(result));
      return true;
    }

    if (req.method === 'GET' && pathname === '/api/esl/status/summary') {
      const summary = await statusService.getCachedSummary();
      sendJson(res, 200, {
        success: true,
        error_code: 0,
        error_msg: '',
        request_id: 'CACHE',
        received_at: new Date().toISOString(),
        data: summary
      });
      return true;
    }

    if (req.method === 'GET' && pathname === '/api/esl/status') {
      const page = toPositiveInt(searchParams.get('page'), 1);
      const size = toPositiveInt(searchParams.get('size'), 100);
      const result = await statusService.queryEslStatus({ page, size });
      sendJson(res, 200, buildCommandResult(result));
      return true;
    }

    if (req.method === 'POST' && pathname === '/api/esl/status/sync') {
      const result = await statusService.syncStatus();
      sendJson(res, 200, buildCommandResult(result));
      return true;
    }

    if (req.method === 'POST' && pathname === '/api/esl/status/query') {
      const eslCodes = Array.isArray(body.esl_codes) ? body.esl_codes.map(String) : [];
      const page = toPositiveInt(body.page, 1);
      const size = toPositiveInt(body.size, 100);

      const result = await statusService.querySpecificStatus({
        esl_codes: eslCodes,
        page,
        size
      });

      sendJson(res, 200, buildCommandResult(result));
      return true;
    }

    if (req.method === 'POST' && pathname === '/api/esl/products/upsert') {
      const result = await productSyncService.upsertProduct(body);
      sendJson(res, 200, buildCommandResult(result));
      return true;
    }

    if (req.method === 'POST' && pathname === '/api/esl/products/upsert-bulk') {
      const items = Array.isArray(body.items) ? body.items : [];
      const result = await productSyncService.upsertProducts(items);
      sendJson(res, 200, buildCommandResult(result));
      return true;
    }

    if (req.method === 'POST' && pathname === '/api/esl/bind') {
      const result = await bindingService.bind({
        esl_code: body.esl_code,
        product_code: body.product_code,
        template_id: body.template_id
      });

      sendJson(res, 200, buildCommandResult(result));
      return true;
    }

    if (req.method === 'POST' && pathname === '/api/esl/bind/bulk') {
      const items = Array.isArray(body.items) ? body.items : [];
      const result = await bindingService.bindMany(items);
      sendJson(res, 200, buildCommandResult(result));
      return true;
    }

    if (req.method === 'POST' && pathname === '/api/esl/unbind') {
      const result = await bindingService.unbind(String(body.esl_code ?? ''));
      sendJson(res, 200, buildCommandResult(result));
      return true;
    }

    if (req.method === 'POST' && pathname === '/api/esl/refresh/trigger') {
      const queuedCodes = Array.isArray(body.esl_codes) ? body.esl_codes.map(String) : [];
      if (queuedCodes.length > 0) {
        refreshService.enqueueRefresh(queuedCodes);
      }

      const result = await refreshService.triggerRefresh();
      sendJson(res, 200, buildCommandResult(result));
      return true;
    }

    if (req.method === 'POST' && pathname === '/api/esl/led/search') {
      const eslCodes = Array.isArray(body.esl_codes) ? body.esl_codes.map(String) : [];
      const result = await ledService.search(eslCodes);
      sendJson(res, 200, buildCommandResult(result));
      return true;
    }

    if (req.method === 'POST' && pathname === '/api/esl/direct') {
      const items = Array.isArray(body.items) ? body.items : [];
      const result = await refreshService.directUpdate(items);
      sendJson(res, 200, buildCommandResult(result));
      return true;
    }

    if (req.method === 'GET' && pathname === '/api/esl/audit') {
      const limit = toPositiveInt(searchParams.get('limit'), 100);
      const rows = await auditLogService.list(limit);

      sendJson(res, 200, {
        success: true,
        error_code: 0,
        error_msg: '',
        request_id: 'CACHE',
        received_at: new Date().toISOString(),
        data: rows
      });
      return true;
    }

    if (req.method === 'GET' && pathname === '/api/esl/dead-letters') {
      const limit = toPositiveInt(searchParams.get('limit'), 100);
      const rows = await deadLetterRepo.listDeadLetters(limit);

      sendJson(res, 200, {
        success: true,
        error_code: 0,
        error_msg: '',
        request_id: 'CACHE',
        received_at: new Date().toISOString(),
        data: rows
      });
      return true;
    }

    if (req.method === 'POST' && pathname === '/api/esl/jobs/run') {
      // Endpoint administrativo para execução manual de ciclos de job.
      const result = await runJobsOnce();
      sendJson(res, 200, {
        success: true,
        error_code: 0,
        error_msg: '',
        request_id: `JOB-${Date.now()}`,
        received_at: new Date().toISOString(),
        data: result
      });
      return true;
    }

    return false;
  };
}
