import { runWithRetry } from './eslRetryPolicy.js';
import { fromVendorTemplateRecord } from './eslMapper.js';

function extractTemplates(data) {
  if (Array.isArray(data)) {
    return data;
  }

  if (data && typeof data === 'object' && Array.isArray(data.data)) {
    return data.data;
  }

  return [];
}

export class EslTemplateService {
  constructor({ config, apiClient, auditLogService }) {
    this.config = config;
    this.apiClient = apiClient;
    this.auditLogService = auditLogService;
    // Cache local para reduzir chamadas repetidas ao endpoint de templates.
    this.cache = {
      expiresAt: 0,
      templates: []
    };
  }

  async queryTemplates({ page = 1, size = 100, forceRefresh = false } = {}) {
    const now = Date.now();

    if (!forceRefresh && this.cache.templates.length > 0 && now < this.cache.expiresAt) {
      return {
        success: true,
        error_code: 0,
        error_msg: '',
        request_id: 'CACHE',
        received_at: new Date().toISOString(),
        data: this.cache.templates,
        cached: true
      };
    }

    const query = {
      f1: String(page),
      f2: String(size)
    };

    const result = await runWithRetry(
      () => this.apiClient.get('/template/query', query),
      {
        operation: 'template.query',
        payload: query
      },
      this.config
    );

    const templates = extractTemplates(result.data).map((item) => fromVendorTemplateRecord(item));

    this.cache = {
      templates,
      expiresAt: now + this.config.templateCacheTtlMs
    };

    this.auditLogService.record({
      operation: 'template.query',
      payload: query,
      request_id: result.request_id,
      success: result.success,
      error_code: result.error_code,
      error_msg: result.error_msg,
      response_count: templates.length
    });

    return {
      ...result,
      data: templates,
      cached: false
    };
  }
}
