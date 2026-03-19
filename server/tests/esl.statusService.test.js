import { describe, expect, it, vi } from 'vitest';
import { createMemoryRepositories } from '../db/repositories/memory.js';
import { EslAuditLogService } from '../esl/eslAuditLogService.js';
import { EslStatusService } from '../esl/statusService.js';

const baseConfig = {
  eslHost: 'https://vendor.local',
  clientId: 'test',
  sign: 'sign',
  storeCode: '001',
  maxRetryAttempts: 1,
  retryBaseDelayMs: 0
};

function makeVendorCountResult({ online = 2, offline = 1, count = 3 } = {}) {
  return {
    success: true,
    error_code: 0,
    error_msg: '',
    request_id: 'REQ-COUNT',
    received_at: new Date().toISOString(),
    data: { online_count: online, offline_count: offline, count }
  };
}

function makeVendorQueryResult(items = []) {
  return {
    success: true,
    error_code: 0,
    error_msg: '',
    request_id: 'REQ-QUERY',
    received_at: new Date().toISOString(),
    data: items
  };
}

function makeSnapshot({ esl_code, online = true, battery_percent = 80, ap_code = 'AP01' } = {}) {
  return {
    esl_code,
    esl_version: 'v1',
    action: 0,
    online: online ? 1 : 0,
    esl_battery: battery_percent,
    battery_percent,
    product_code: null,
    ap_code,
    esltype_code: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

function createService({ getMock = vi.fn(), postMock = vi.fn() } = {}) {
  const repos = createMemoryRepositories();
  const auditLogService = new EslAuditLogService({ commandLogRepo: repos.commandLogRepo });
  const apiClient = { get: getMock, post: postMock };

  const svc = new EslStatusService({
    config: baseConfig,
    apiClient,
    auditLogService,
    statusRepo: repos.statusRepo,
    deadLetterRepo: repos.deadLetterRepo
  });

  return { svc, repos };
}

describe('EslStatusService', () => {
  it('queryCount normaliza resposta do fornecedor', async () => {
    const getMock = vi.fn().mockResolvedValue(makeVendorCountResult({ online: 5, offline: 2, count: 7 }));
    const { svc } = createService({ getMock });

    const result = await svc.queryCount();

    expect(result.success).toBe(true);
    expect(result.data.online_count).toBe(5);
    expect(result.data.offline_count).toBe(2);
    expect(result.data.total_count).toBe(7);
  });

  it('getCachedSummary retorna agregado do repositório', async () => {
    const { svc, repos } = createService();

    await repos.statusRepo.upsertStatusSnapshots([
      makeSnapshot({ esl_code: 'ESL001', online: true }),
      makeSnapshot({ esl_code: 'ESL002', online: false })
    ]);

    const summary = await svc.getCachedSummary();
    expect(summary.online_count).toBe(1);
    expect(summary.offline_count).toBe(1);
    expect(summary.total_count).toBe(2);
  });

  it('buildDashboardAggregate conta bateria baixa e agrupa por AP', async () => {
    const { svc, repos } = createService();

    await repos.statusRepo.upsertStatusSnapshots([
      makeSnapshot({ esl_code: 'ESL001', online: true, battery_percent: 80, ap_code: 'AP01' }),
      makeSnapshot({ esl_code: 'ESL002', online: false, battery_percent: 10, ap_code: 'AP02' }),
      makeSnapshot({ esl_code: 'ESL003', online: true, battery_percent: 15, ap_code: 'AP01' })
    ]);

    const agg = await svc.buildDashboardAggregate();

    expect(agg.kpis.totalTags).toBe(3);
    expect(agg.kpis.online).toBe(2);
    expect(agg.kpis.offline).toBe(1);
    expect(agg.kpis.lowBattery).toBe(2); // ESL002 (10%) e ESL003 (15%)
    expect(agg.offlineByCorridor).toHaveLength(1);
    expect(agg.offlineByCorridor[0].corridor).toBe('AP02');
    expect(agg.offlineByCorridor[0].offline).toBe(1);
  });

  it('queryEslStatus persiste snapshots no repositório', async () => {
    const vendorItems = [
      { esl_code: 'ESL001', online: 1, esl_battery: 80, ap_code: 'AP01' },
      { esl_code: 'ESL002', online: 0, esl_battery: 30, ap_code: 'AP02' }
    ];
    const getMock = vi.fn().mockResolvedValue(makeVendorQueryResult(vendorItems));
    const { svc, repos } = createService({ getMock });

    await svc.queryEslStatus({ page: 1, size: 100 });

    const snapshots = await repos.statusRepo.listStatusSnapshots();
    expect(snapshots.length).toBeGreaterThanOrEqual(2);
  });
});
