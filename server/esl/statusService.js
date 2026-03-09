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
  constructor({ config, apiClient, auditLogService, statusRepo, deadLetterRepo }) {
    this.config = config;
    this.apiClient = apiClient;
    this.auditLogService = auditLogService;
    this.statusRepo = statusRepo;
    this.deadLetterRepo = deadLetterRepo;
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
