import { recordLogicalVendorFailure, runWithRetry } from './eslRetryPolicy.js';
import { toVendorDirectPayload } from './eslMapper.js';

export class EslRefreshService {
  constructor({ config, apiClient, auditLogService, deadLetterRepo, metrics }) {
    this.config = config;
    this.apiClient = apiClient;
    this.auditLogService = auditLogService;
    this.deadLetterRepo = deadLetterRepo;
    this.metrics = metrics ?? { trackBusinessEvent() {} };
    // Fila em memória para consolidar triggers e evitar excesso de bind_task.
    this.queuedEslCodes = new Set();
  }

  enqueueRefresh(eslCodes) {
    // A fila em memória deduplica ESLs para evitar explosão de bind_task
    // quando múltiplas operações tocam a mesma etiqueta no mesmo intervalo.
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
    // Snapshot atômico da fila antes do await para evitar race condition:
    // códigos adicionados durante a chamada async pertencem ao próximo ciclo.
    const snapshot = new Set(this.queuedEslCodes);
    this.queuedEslCodes.clear();

    // bind_task é um trigger global do fornecedor: o snapshot preserva quantas
    // ESLs motivaram o disparo, mesmo que a API não receba a lista explicitamente.
    const payload = {};

    const result = await runWithRetry(
      () => this.apiClient.post('/esl/bind_task', payload),
      {
        operation: 'esl.bind_task',
        payload,
        meta: { queued_count: snapshot.size }
      },
      this.config,
      { deadLetterRepo: this.deadLetterRepo }
    );

    await this.auditLogService.record({
      operation: 'esl.bind_task',
      payload,
      request_id: result.request_id,
      success: result.success,
      error_code: result.error_code,
      error_msg: result.error_msg,
      response: result.data,
      queued_count: snapshot.size
    });

    if (!result.success) {
      // Restaurar códigos do snapshot na fila para nova tentativa no próximo ciclo.
      for (const code of snapshot) {
        this.queuedEslCodes.add(code);
      }

      await recordLogicalVendorFailure(
        result,
        {
          operation: 'esl.bind_task',
          payload,
          meta: { queued_count: snapshot.size }
        },
        this.deadLetterRepo
      );
    }

    this.metrics.trackBusinessEvent('refresh_triggered', result.success ? 'success' : 'failure');

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
    // Fluxo de urgência: envia conteúdo/template diretamente para as etiquetas,
    // sem depender da fila consolidada de bind/unbind.
    const payload = toVendorDirectPayload(items);

    const result = await runWithRetry(
      () => this.apiClient.post('/esl/direct', payload),
      {
        operation: 'esl.direct',
        payload,
        meta: { count: items.length }
      },
      this.config,
      { deadLetterRepo: this.deadLetterRepo }
    );

    await this.auditLogService.record({
      operation: 'esl.direct',
      payload,
      request_id: result.request_id,
      success: result.success,
      error_code: result.error_code,
      error_msg: result.error_msg,
      response: result.data
    });

    if (!result.success) {
      await recordLogicalVendorFailure(
        result,
        {
          operation: 'esl.direct',
          payload,
          meta: { count: items.length }
        },
        this.deadLetterRepo
      );
    }

    return result;
  }
}
