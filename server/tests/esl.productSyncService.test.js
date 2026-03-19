import { describe, expect, it, vi } from 'vitest';
import { createMemoryRepositories } from '../db/repositories/memory.js';
import { EslAuditLogService } from '../esl/eslAuditLogService.js';
import { EslProductSyncService } from '../esl/productSyncService.js';
import { EslRefreshService } from '../esl/refreshService.js';

const baseConfig = {
  eslHost: 'https://vendor.local',
  clientId: 'test',
  sign: 'sign',
  storeCode: '001',
  maxRetryAttempts: 1,
  retryBaseDelayMs: 0
};

function makeSuccessResult(data = {}) {
  return {
    success: true,
    error_code: 0,
    error_msg: '',
    request_id: `REQ-${Date.now()}`,
    received_at: new Date().toISOString(),
    data
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

function createContext({ postMock }) {
  const repos = createMemoryRepositories();
  const auditLogService = new EslAuditLogService({ commandLogRepo: repos.commandLogRepo });
  const apiClientForRefresh = { post: vi.fn().mockResolvedValue(makeSuccessResult()) };
  const refreshService = new EslRefreshService({
    config: baseConfig,
    apiClient: apiClientForRefresh,
    auditLogService,
    deadLetterRepo: repos.deadLetterRepo
  });

  const apiClient = { post: postMock };
  const svc = new EslProductSyncService({
    config: baseConfig,
    apiClient,
    refreshService,
    auditLogService,
    bindingRepo: repos.bindingRepo,
    productRepo: repos.productRepo,
    deadLetterRepo: repos.deadLetterRepo
  });

  return { svc, repos };
}

describe('EslProductSyncService', () => {
  it('upsertProduct chama /product/create e persiste no productRepo', async () => {
    const postMock = vi.fn().mockResolvedValue(makeSuccessResult());
    const { svc, repos } = createContext({ postMock });

    const result = await svc.upsertProduct({ product_code: 'P001', product_name: 'Arroz', price: 9.9 });

    expect(result.success).toBe(true);
    expect(postMock).toHaveBeenCalledWith('/product/create', expect.objectContaining({ pc: 'P001' }));

    const stored = await repos.productRepo.getProduct('P001');
    expect(stored).not.toBeNull();
    expect(stored.product_name).toBe('Arroz');
    expect(stored.sync_status).toBe('SYNCED');
  });

  it('upsertProduct enfileira refresh para etiquetas vinculadas', async () => {
    const postMock = vi.fn().mockResolvedValue(makeSuccessResult());
    const { svc, repos } = createContext({ postMock });

    // Cria um vínculo manual para P001
    await repos.bindingRepo.upsertBinding({ esl_code: 'ESL001', product_code: 'P001' });

    await svc.upsertProduct({ product_code: 'P001', product_name: 'Arroz', price: 9.9 });

    expect(svc.refreshService.getQueuedRefreshCount()).toBe(1);
  });

  it('upsertProduct em falha não persiste no repo', async () => {
    const postMock = vi.fn().mockResolvedValue(makeFailResult());
    const { svc, repos } = createContext({ postMock });

    const result = await svc.upsertProduct({ product_code: 'P002', product_name: 'Feijão', price: 7.5 });

    expect(result.success).toBe(false);
    const stored = await repos.productRepo.getProduct('P002');
    expect(stored).toBeNull();
  });

  it('flushPendingUpserts não faz chamada quando fila está vazia', async () => {
    const postMock = vi.fn();
    const { svc } = createContext({ postMock });

    const result = await svc.flushPendingUpserts();

    expect(result.success).toBe(true);
    expect(result.flushed_count).toBe(0);
    expect(postMock).not.toHaveBeenCalled();
  });

  it('flushPendingUpserts envia itens pendentes em lote', async () => {
    const postMock = vi.fn().mockResolvedValue(makeSuccessResult());
    const { svc } = createContext({ postMock });

    svc.enqueueProductUpserts([
      { product_code: 'P001', product_name: 'A', price: 1 },
      { product_code: 'P002', product_name: 'B', price: 2 }
    ]);

    const result = await svc.flushPendingUpserts(50);
    expect(result.success).toBe(true);
    expect(result.flushed_count).toBe(2);
  });

  it('listProducts e countProducts refletem repositório', async () => {
    const postMock = vi.fn().mockResolvedValue(makeSuccessResult());
    const { svc } = createContext({ postMock });

    await svc.upsertProduct({ product_code: 'P001', product_name: 'A', price: 1 });
    await svc.upsertProduct({ product_code: 'P002', product_name: 'B', price: 2 });

    const count = await svc.countProducts();
    const list = await svc.listProducts(10, 0);

    expect(count).toBe(2);
    expect(list).toHaveLength(2);
  });
});
