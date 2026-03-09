import { runWithRetry } from './eslRetryPolicy.js';
import { toVendorDirectPayload } from './eslMapper.js';

export class EslRefreshService {
  constructor({ config, apiClient, auditLogService }) {
    this.config = config;
    this.apiClient = apiClient;
    this.auditLogService = auditLogService;
    // Fila em memória para consolidar triggers e evitar excesso de bind_task.
    this.queuedEslCodes = new Set();
  }

  enqueueRefresh(eslCodes) {
    for (const eslCode of eslCodes) {
      if (!eslCode) {
        continue;
      }

      this.queuedEslCodes.add(eslCode);
    }

    return {
      queued_count: this.queuedEslCodes.size
    };
  }

  getQueuedRefreshCount() {
    return this.queuedEslCodes.size;
  }

  async triggerRefresh() {
    const payload = {};

    const result = await runWithRetry(
      () => this.apiClient.post('/esl/bind_task', payload),
      {
        operation: 'esl.bind_task',
        payload,
        meta: { queued_count: this.queuedEslCodes.size }
      },
      this.config
    );

    this.auditLogService.record({
      operation: 'esl.bind_task',
      payload,
      request_id: result.request_id,
      success: result.success,
      error_code: result.error_code,
      error_msg: result.error_msg,
      response: result.data,
      queued_count: this.queuedEslCodes.size
    });

    if (result.success) {
      this.queuedEslCodes.clear();
    }

    return {
      ...result,
      queued_count: this.queuedEslCodes.size
    };
  }

  async dispatchQueuedRefresh() {
    // Job periódico usa este método para só disparar quando há pendências.
    if (this.queuedEslCodes.size === 0) {
      return {
        success: true,
        request_id: null,
        queued_count: 0,
        skipped: true,
        error_code: 0,
        error_msg: ''
      };
    }

    return this.triggerRefresh();
  }

  async directUpdate(items) {
    // Fluxo de urgência: envia conteúdo/template diretamente para as etiquetas.
    const payload = toVendorDirectPayload(items);

    const result = await runWithRetry(
      () => this.apiClient.post('/esl/direct', payload),
      {
        operation: 'esl.direct',
        payload,
        meta: { count: items.length }
      },
      this.config
    );

    this.auditLogService.record({
      operation: 'esl.direct',
      payload,
      request_id: result.request_id,
      success: result.success,
      error_code: result.error_code,
      error_msg: result.error_msg,
      response: result.data
    });

    return result;
  }
}
