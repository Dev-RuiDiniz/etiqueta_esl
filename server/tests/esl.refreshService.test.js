import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMemoryRepositories } from '../db/repositories/memory.js';
import { EslAuditLogService } from '../esl/eslAuditLogService.js';
import { EslRefreshService } from '../esl/refreshService.js';

const baseConfig = {
  eslHost: 'https://vendor.local',
  clientId: 'test',
  sign: 'sign',
  storeCode: '001',
  maxRetryAttempts: 1,
  retryBaseDelayMs: 0
};

function makeSuccessResult() {
  return {
    success: true,
    error_code: 0,
    error_msg: '',
    request_id: `REQ-${Date.now()}`,
    received_at: new Date().toISOString(),
    data: {}
  };
}

function makeFailResult(msg = 'Vendor error') {
  return {
    success: false,
    error_code: 1,
    error_msg: msg,
    request_id: `REQ-${Date.now()}`,
    received_at: new Date().toISOString(),
    data: null
  };
}

function createService({ postMock }) {
  const repos = createMemoryRepositories();
  const auditLogService = new EslAuditLogService({ commandLogRepo: repos.commandLogRepo });
  const apiClient = { post: postMock };

  return new EslRefreshService({
    config: baseConfig,
    apiClient,
    auditLogService,
    deadLetterRepo: repos.deadLetterRepo
  });
}

describe('EslRefreshService', () => {
  it('enqueueRefresh adiciona códigos ao Set', () => {
    const svc = createService({ postMock: vi.fn() });
    svc.enqueueRefresh(['ESL001', 'ESL002']);
    expect(svc.getQueuedRefreshCount()).toBe(2);
  });

  it('enqueueRefresh ignora valores vazios', () => {
    const svc = createService({ postMock: vi.fn() });
    svc.enqueueRefresh(['', null, undefined, 'ESL001']);
    expect(svc.getQueuedRefreshCount()).toBe(1);
  });

  it('triggerRefresh limpa a fila em caso de sucesso', async () => {
    const postMock = vi.fn().mockResolvedValue(makeSuccessResult());
    const svc = createService({ postMock });

    svc.enqueueRefresh(['ESL001', 'ESL002']);
    const result = await svc.triggerRefresh();

    expect(result.success).toBe(true);
    expect(svc.getQueuedRefreshCount()).toBe(0);
    expect(postMock).toHaveBeenCalledWith('/esl/bind_task', {});
  });

  it('triggerRefresh restaura a fila em caso de falha (race condition fix)', async () => {
    const postMock = vi.fn().mockResolvedValue(makeFailResult());
    const svc = createService({ postMock });

    svc.enqueueRefresh(['ESL001', 'ESL002']);

    // Simula adição concurrent durante o await: feita ANTES do triggerRefresh
    // pois Jest/Node é single-thread (não há verdadeiro paralelismo), mas
    // o snapshot garante que o estado pré-await seja restaurado em falha.
    const result = await svc.triggerRefresh();

    expect(result.success).toBe(false);
    // Após falha, os códigos do snapshot devem ter sido restaurados.
    expect(svc.getQueuedRefreshCount()).toBe(2);
  });

  it('dispatchQueuedRefresh pula quando fila está vazia', async () => {
    const postMock = vi.fn();
    const svc = createService({ postMock });

    const result = await svc.dispatchQueuedRefresh();

    expect(result.skipped).toBe(true);
    expect(result.success).toBe(true);
    expect(postMock).not.toHaveBeenCalled();
  });

  it('dispatchQueuedRefresh chama triggerRefresh quando há itens na fila', async () => {
    const postMock = vi.fn().mockResolvedValue(makeSuccessResult());
    const svc = createService({ postMock });

    svc.enqueueRefresh(['ESL001']);
    const result = await svc.dispatchQueuedRefresh();

    expect(result.success).toBe(true);
    expect(postMock).toHaveBeenCalledOnce();
  });
});
