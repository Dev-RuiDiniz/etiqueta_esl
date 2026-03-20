import { runWithRetry } from './eslRetryPolicy.js';
import { fromVendorStatusRecord, toVendorQueryStatusPayload } from './eslMapper.js';

function extractArrayFromResult(result) {
  if (Array.isArray(result.data)) {
    return result.data;
  }

  if (result.data && typeof result.data === 'object' && Array.isArray(result.data.data)) {
    return result.data.data;
  }

  return [];
}

function normalizeCountData(result) {
  if (!result.data || typeof result.data !== 'object' || Array.isArray(result.data)) {
    return {
      online_count: 0,
      offline_count: 0,
      total_count: 0
    };
  }

  const onlineCount = Number(result.data.online_count ?? 0);
  const offlineCount = Number(result.data.offline_count ?? 0);
  const count = Number(result.data.count ?? onlineCount + offlineCount);

  return {
    online_count: onlineCount,
    offline_count: offlineCount,
    total_count: count
  };
}

export class EslStatusService {
  constructor({ config, apiClient, auditLogService, statusRepo, deadLetterRepo, eslCatalogRepo }) {
    this.config = config;
    this.apiClient = apiClient;
    this.auditLogService = auditLogService;
    this.statusRepo = statusRepo;
    this.deadLetterRepo = deadLetterRepo;
    this.eslCatalogRepo = eslCatalogRepo;
  }

  async syncStatus() {
    const payload = {};

    const result = await runWithRetry(
      () => this.apiClient.post('/esl/sync', payload),
      {
        operation: 'esl.sync',
        payload
      },
      this.config,
      { deadLetterRepo: this.deadLetterRepo }
    );

    await this.auditLogService.record({
      operation: 'esl.sync',
      payload,
      request_id: result.request_id,
      success: result.success,
      error_code: result.error_code,
      error_msg: result.error_msg,
      response: result.data
    });

    return result;
  }

  async queryCount() {
    const result = await runWithRetry(
      () => this.apiClient.get('/esl/query_count', {}),
      {
        operation: 'esl.query_count',
        payload: {}
      },
      this.config,
      { deadLetterRepo: this.deadLetterRepo }
    );

    const countData = normalizeCountData(result);

    await this.auditLogService.record({
      operation: 'esl.query_count',
      payload: {},
      request_id: result.request_id,
      success: result.success,
      error_code: result.error_code,
      error_msg: result.error_msg,
      response: result.data,
      count_data: countData
    });

    return {
      ...result,
      data: countData
    };
  }

  async queryEslStatus({ page = 1, size = 100 } = {}) {
    const query = {
      f1: String(page),
      f2: String(size)
    };

    const result = await runWithRetry(
      () => this.apiClient.get('/esl/query', query),
      {
        operation: 'esl.query',
        payload: query
      },
      this.config,
      { deadLetterRepo: this.deadLetterRepo }
    );

    // Normaliza payload do fornecedor e persiste snapshot para consumo rápido no dashboard.
    const snapshots = extractArrayFromResult(result).map((item) => fromVendorStatusRecord(item));
    await this.statusRepo.upsertStatusSnapshots(snapshots);
    for (const snapshot of snapshots) {
      await this.eslCatalogRepo?.upsertCatalogItem?.({
        esl_code: snapshot.esl_code,
        esltype_code: snapshot.esltype_code ?? null,
        ap_code: snapshot.ap_code ?? null,
        source: 'VENDOR_DISCOVERY',
        registration_status: 'REGISTERED',
        last_seen_at: snapshot.updated_at ?? snapshot.created_at ?? new Date().toISOString()
      });
    }

    await this.auditLogService.record({
      operation: 'esl.query',
      payload: query,
      request_id: result.request_id,
      success: result.success,
      error_code: result.error_code,
      error_msg: result.error_msg,
      response_count: snapshots.length
    });

    return {
      ...result,
      data: snapshots
    };
  }

  async querySpecificStatus({ esl_codes = [], page = 1, size = 100 } = {}) {
    const payload = toVendorQueryStatusPayload({ esl_codes, page, size });

    const result = await runWithRetry(
      () => this.apiClient.post('/esl/query_status', payload),
      {
        operation: 'esl.query_status',
        payload,
        meta: { count: esl_codes.length }
      },
      this.config,
      { deadLetterRepo: this.deadLetterRepo }
    );

    // Consulta direcionada usada por validações pós-atualização e tela de detalhe.
    const snapshots = extractArrayFromResult(result).map((item) => fromVendorStatusRecord(item));
    await this.statusRepo.upsertStatusSnapshots(snapshots);
    for (const snapshot of snapshots) {
      await this.eslCatalogRepo?.upsertCatalogItem?.({
        esl_code: snapshot.esl_code,
        esltype_code: snapshot.esltype_code ?? null,
        ap_code: snapshot.ap_code ?? null,
        source: 'VENDOR_DISCOVERY',
        registration_status: 'REGISTERED',
        last_seen_at: snapshot.updated_at ?? snapshot.created_at ?? new Date().toISOString()
      });
    }

    await this.auditLogService.record({
      operation: 'esl.query_status',
      payload,
      request_id: result.request_id,
      success: result.success,
      error_code: result.error_code,
      error_msg: result.error_msg,
      response_count: snapshots.length
    });

    return {
      ...result,
      data: snapshots
    };
  }

  async getCachedSummary() {
    return this.statusRepo.getStatusSummary();
  }

  async buildDashboardAggregate() {
    // Agrega snapshots locais para o dashboard sem chamar o fornecedor.
    const snapshots = await this.statusRepo.listStatusSnapshots();
    const now = new Date().toISOString();

    let online = 0;
    let offline = 0;
    let lowBattery = 0;
    const corridorMap = new Map();

    for (const s of snapshots) {
      const isOnline = s.online === 1 || s.online === true;
      if (isOnline) {
        online += 1;
      } else {
        offline += 1;
        const corridor = s.ap_code ?? 'Desconhecido';
        corridorMap.set(corridor, (corridorMap.get(corridor) ?? 0) + 1);
      }

      const battery = s.battery_percent != null ? Number(s.battery_percent) : Number(s.esl_battery ?? 100);
      if (battery < 20) {
        lowBattery += 1;
      }
    }

    const offlineByCorridor = Array.from(corridorMap.entries())
      .map(([corridor, count]) => ({ corridor, offline: count }))
      .sort((a, b) => b.offline - a.offline)
      .slice(0, 10);

    const total = online + offline;
    const status = total === 0 ? 'Atenção' : offline === 0 ? 'Online' : 'Atenção';

    return {
      kpis: { totalTags: total, online, offline, lowBattery },
      offlineByCorridor,
      lastUpdate: { timestamp: now, status }
    };
  }

  async pollAndCacheStatus({ pageSize = 100 } = {}) {
    const countResult = await this.queryCount();

    if (!countResult.success) {
      return countResult;
    }

    const totalCount = Math.max(0, Number(countResult.data.total_count ?? 0));
    // Estratégia de polling: primeiro total, depois paginação completa.
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

    for (let page = 1; page <= totalPages; page += 1) {
      const pageResult = await this.queryEslStatus({ page, size: pageSize });

      if (!pageResult.success) {
        return pageResult;
      }
    }

    return {
      success: true,
      error_code: 0,
      error_msg: '',
      request_id: countResult.request_id,
      received_at: new Date().toISOString(),
      data: await this.getCachedSummary()
    };
  }
}
