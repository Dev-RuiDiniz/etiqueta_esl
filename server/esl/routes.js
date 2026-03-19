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

    if (req.method === 'GET' && pathname === '/api/esl/status/dashboard') {
      const aggregate = await statusService.buildDashboardAggregate();
      sendJson(res, 200, {
        success: true,
        error_code: 0,
        error_msg: '',
        request_id: 'DASH',
        received_at: new Date().toISOString(),
        data: aggregate
      });
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

    if (req.method === 'GET' && pathname === '/api/esl/audit/history') {
      // Endpoint especializado para a tela de histórico: filtra product.create e esl.bind,
      // monta HistoryItem a partir dos campos payload/response do audit log.
      const limit = toPositiveInt(searchParams.get('limit'), 200);
      const rows = await auditLogService.list(limit);

      const items = rows
        .filter((r) => r.operation === 'product.create' || r.operation === 'esl.bind')
        .map((r) => {
          const payload = r.payload ?? {};
          const response = r.response ?? {};
          return {
            id: r.id,
            createdAt: r.created_at,
            tagId: String(payload.esl_code ?? response.esl_code ?? ''),
            sku: String(payload.product_code ?? response.product_code ?? ''),
            productName: String(payload.product_name ?? response.product_name ?? ''),
            previousPrice: Number(response.previous_price ?? 0),
            newPrice: Number(payload.price ?? response.price ?? 0),
            status: r.success ? 'CONFIRMED' : 'FAILED',
            source: payload.source ?? 'SYSTEM'
          };
        });

      sendJson(res, 200, {
        success: true,
        error_code: 0,
        error_msg: '',
        request_id: 'HIST',
        received_at: new Date().toISOString(),
        data: items
      });
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

    if (req.method === 'GET' && pathname === '/api/esl/alerts') {
      // Deriva alertas de snapshots (offline/bateria baixa) e dead-letters (falhas pendentes).
      const [snapshots, deadLetters] = await Promise.all([
        statusService.statusRepo.listStatusSnapshots(),
        deadLetterRepo.listDeadLetters(500)
      ]);

      const alerts = [];

      for (const s of snapshots) {
        const isOnline = s.online === 1 || s.online === true;
        const battery = s.battery_percent != null ? Number(s.battery_percent) : Number(s.esl_battery ?? 100);

        if (!isOnline) {
          alerts.push({
            id: `OFFLINE-${s.esl_code}`,
            createdAt: s.seen_at ?? new Date().toISOString(),
            type: 'OFFLINE',
            priority: 'HIGH',
            status: 'OPEN',
            tagId: s.esl_code,
            sku: s.product_code ?? '',
            productName: '',
            location: s.ap_code ?? 'Desconhecido',
            details: `Etiqueta offline desde ${s.seen_at ?? 'desconhecido'}`
          });
        } else if (battery < 20) {
          alerts.push({
            id: `BATTERY-${s.esl_code}`,
            createdAt: s.seen_at ?? new Date().toISOString(),
            type: 'LOW_BATTERY',
            priority: 'MEDIUM',
            status: 'OPEN',
            tagId: s.esl_code,
            sku: s.product_code ?? '',
            productName: '',
            location: s.ap_code ?? 'Desconhecido',
            details: `Bateria em ${battery}%`
          });
        }
      }

      for (const dl of deadLetters) {
        if (dl.status !== 'PENDING') continue;
        const payload = dl.payload ?? {};
        alerts.push({
          id: dl.id,
          createdAt: dl.created_at,
          type: 'UPDATE_FAILED',
          priority: 'HIGH',
          status: 'OPEN',
          tagId: String(payload.esl_code ?? ''),
          sku: String(payload.product_code ?? ''),
          productName: String(payload.product_name ?? ''),
          location: '',
          details: dl.last_error ?? `Operação ${dl.operation} falhou após ${dl.attempts} tentativa(s)`
        });
      }

      sendJson(res, 200, {
        success: true,
        error_code: 0,
        error_msg: '',
        request_id: 'ALERTS',
        received_at: new Date().toISOString(),
        data: alerts
      });
      return true;
    }

    // Resolve um alerta: marca dead-letter como PROCESSED ou ignora alertas derivados de snapshot.
    const resolveAlertMatch = req.method === 'POST' && pathname.match(/^\/api\/esl\/alerts\/([^/]+)\/resolve$/);
    if (resolveAlertMatch) {
      const alertId = decodeURIComponent(resolveAlertMatch[1]);

      // Alertas derivados de snapshot (OFFLINE-*, BATTERY-*) são transitórios — não há entidade persistida.
      if (alertId.startsWith('OFFLINE-') || alertId.startsWith('BATTERY-')) {
        sendJson(res, 200, {
          success: true,
          error_code: 0,
          error_msg: '',
          request_id: `RESOLVE-${Date.now()}`,
          received_at: new Date().toISOString(),
          data: { id: alertId, resolved: true }
        });
        return true;
      }

      const updated = await deadLetterRepo.markDeadLetterStatus(alertId, 'PROCESSED', 'Resolvido manualmente');
      if (!updated) {
        sendJson(res, 404, {
          success: false,
          error_code: 404,
          error_msg: 'Alerta não encontrado.',
          request_id: `RESOLVE-${Date.now()}`,
          received_at: new Date().toISOString(),
          data: null
        });
        return true;
      }

      sendJson(res, 200, {
        success: true,
        error_code: 0,
        error_msg: '',
        request_id: `RESOLVE-${Date.now()}`,
        received_at: new Date().toISOString(),
        data: { id: alertId, resolved: true }
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
