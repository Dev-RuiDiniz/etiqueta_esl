import { getMissingEslConfig } from '../config.js';
import { sendJson } from '../utils/http.js';
import { requirePositiveInt, requirePositiveNumber, requireString, requireStringArray } from '../utils/validate.js';

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
  catalogService,
  refreshService,
  statusService,
  ledService,
  auditLogService,
  deadLetterRepo,
  bindingRepo,
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

    if (req.method === 'GET' && pathname === '/api/esl/catalog') {
      const items = await catalogService.listCatalog();
      sendJson(res, 200, {
        success: true,
        error_code: 0,
        error_msg: '',
        request_id: 'CATALOG',
        received_at: new Date().toISOString(),
        data: items
      });
      return true;
    }

    if (req.method === 'POST' && pathname === '/api/esl/catalog') {
      requireString(body.esl_code, 'esl_code', { maxLen: 32 });
      if (typeof body.display_name !== 'undefined' && body.display_name !== null) {
        requireString(body.display_name, 'display_name', { maxLen: 128 });
      }

      const item = await catalogService.createCatalogItem({
        esl_code: String(body.esl_code).trim(),
        display_name: body.display_name != null ? String(body.display_name).trim() : null
      });

      sendJson(res, 200, {
        success: true,
        error_code: 0,
        error_msg: '',
        request_id: 'CATALOG-CREATE',
        received_at: new Date().toISOString(),
        data: item
      });
      return true;
    }

    if (req.method === 'POST' && pathname === '/api/esl/catalog/import') {
      const result = await catalogService.importFromVendor({
        pageSize: toPositiveInt(body.page_size, 100)
      });
      sendJson(res, 200, buildCommandResult(result));
      return true;
    }

    const catalogUpdateMatch = pathname.match(/^\/api\/esl\/catalog\/([^/]+)$/);
    if (req.method === 'PATCH' && catalogUpdateMatch) {
      const eslCode = decodeURIComponent(catalogUpdateMatch[1]);
      const item = await catalogService.updateCatalogItem(eslCode, {
        display_name: typeof body.display_name !== 'undefined' ? (body.display_name == null ? null : String(body.display_name).trim()) : undefined,
        esltype_code: typeof body.esltype_code !== 'undefined' ? (body.esltype_code == null ? null : String(body.esltype_code).trim()) : undefined,
        ap_code: typeof body.ap_code !== 'undefined' ? (body.ap_code == null ? null : String(body.ap_code).trim()) : undefined
      });

      if (!item) {
        sendJson(res, 404, {
          success: false,
          error_code: 404,
          error_msg: 'Etiqueta não encontrada.',
          request_id: 'CATALOG-UPDATE',
          received_at: new Date().toISOString(),
          data: null
        });
        return true;
      }

      sendJson(res, 200, {
        success: true,
        error_code: 0,
        error_msg: '',
        request_id: 'CATALOG-UPDATE',
        received_at: new Date().toISOString(),
        data: item
      });
      return true;
    }

    const catalogBindMatch = pathname.match(/^\/api\/esl\/catalog\/([^/]+)\/bind$/);
    if (req.method === 'POST' && catalogBindMatch) {
      const eslCode = decodeURIComponent(catalogBindMatch[1]);
      requireString(body.product_code, 'product_code', { maxLen: 64 });
      const templateId = requirePositiveInt(body.template_id, 'template_id', { allowNull: true });
      const result = await catalogService.bindCatalogItem(eslCode, {
        product_code: String(body.product_code).trim(),
        template_id: templateId
      });
      sendJson(res, 200, buildCommandResult(result));
      return true;
    }

    const catalogUnbindMatch = pathname.match(/^\/api\/esl\/catalog\/([^/]+)\/unbind$/);
    if (req.method === 'POST' && catalogUnbindMatch) {
      const eslCode = decodeURIComponent(catalogUnbindMatch[1]);
      const result = await catalogService.unbindCatalogItem(eslCode);
      sendJson(res, 200, buildCommandResult(result));
      return true;
    }

    const catalogSearchMatch = pathname.match(/^\/api\/esl\/catalog\/([^/]+)\/search$/);
    if (req.method === 'POST' && catalogSearchMatch) {
      const eslCode = decodeURIComponent(catalogSearchMatch[1]);
      const result = await catalogService.searchCatalogItem(eslCode);
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

    if (req.method === 'GET' && pathname === '/api/esl/products') {
      const page = toPositiveInt(searchParams.get('page'), 1);
      const size = toPositiveInt(searchParams.get('size'), 50);
      const offset = (page - 1) * size;

      const [products, total] = await Promise.all([
        productSyncService.listProducts(size, offset),
        productSyncService.countProducts()
      ]);

      sendJson(res, 200, {
        success: true,
        error_code: 0,
        error_msg: '',
        request_id: 'PROD-LIST',
        received_at: new Date().toISOString(),
        data: { products, total, page, size }
      });
      return true;
    }

    if (req.method === 'GET' && pathname === '/api/esl/bindings') {
      const productCode = searchParams.get('product_code') ?? '';

      if (productCode) {
        const bindings = await bindingRepo.listBindingsByProductCode(productCode);
        sendJson(res, 200, {
          success: true,
          error_code: 0,
          error_msg: '',
          request_id: 'BIND-LIST',
          received_at: new Date().toISOString(),
          data: bindings
        });
      } else {
        const bindings = await bindingRepo.listBindings();
        sendJson(res, 200, {
          success: true,
          error_code: 0,
          error_msg: '',
          request_id: 'BIND-LIST',
          received_at: new Date().toISOString(),
          data: bindings
        });
      }
      return true;
    }

    if (req.method === 'POST' && pathname === '/api/esl/products/upsert') {
      requireString(body.product_code, 'product_code', { maxLen: 64 });
      requireString(body.product_name, 'product_name', { maxLen: 256 });
      requirePositiveNumber(body.price, 'price');
      const result = await productSyncService.upsertProduct(body);
      sendJson(res, 200, buildCommandResult(result));
      return true;
    }

    if (req.method === 'POST' && pathname === '/api/esl/products/upsert-bulk') {
      if (!Array.isArray(body.items) || body.items.length === 0) {
        sendJson(res, 422, { success: false, error_code: 422, error_msg: "O campo 'items' deve ser um array não vazio.", request_id: 'VAL', received_at: new Date().toISOString(), data: { field: 'items' } });
        return true;
      }
      if (body.items.length > 500) {
        sendJson(res, 422, { success: false, error_code: 422, error_msg: "O campo 'items' pode conter no máximo 500 itens.", request_id: 'VAL', received_at: new Date().toISOString(), data: { field: 'items' } });
        return true;
      }
      const result = await productSyncService.upsertProducts(body.items);
      sendJson(res, 200, buildCommandResult(result));
      return true;
    }

    if (req.method === 'POST' && pathname === '/api/esl/bind') {
      requireString(body.esl_code, 'esl_code', { maxLen: 32 });
      requireString(body.product_code, 'product_code', { maxLen: 64 });
      const templateId = requirePositiveInt(body.template_id, 'template_id', { allowNull: true });
      const result = await bindingService.bind({
        esl_code: String(body.esl_code).trim(),
        product_code: String(body.product_code).trim(),
        template_id: templateId
      });

      sendJson(res, 200, buildCommandResult(result));
      return true;
    }

    if (req.method === 'POST' && pathname === '/api/esl/bind/bulk') {
      if (!Array.isArray(body.items) || body.items.length === 0) {
        sendJson(res, 422, { success: false, error_code: 422, error_msg: "O campo 'items' deve ser um array não vazio.", request_id: 'VAL', received_at: new Date().toISOString(), data: { field: 'items' } });
        return true;
      }
      if (body.items.length > 500) {
        sendJson(res, 422, { success: false, error_code: 422, error_msg: "O campo 'items' pode conter no máximo 500 itens.", request_id: 'VAL', received_at: new Date().toISOString(), data: { field: 'items' } });
        return true;
      }
      const result = await bindingService.bindMany(body.items);
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
