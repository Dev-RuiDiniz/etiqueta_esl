import { dashboardSummaryMock } from '../mocks/dashboard';
import type { DashboardSummary } from '../types/dashboard';
import { API_MODE, simulateNetwork } from './api';

export async function getDashboardSummary(): Promise<DashboardSummary> {
  if (API_MODE !== 'mock') {
    return simulateNetwork(dashboardSummaryMock, { minMs: 400, maxMs: 900, failRate: 0.03 });
  }

  return simulateNetwork(dashboardSummaryMock, { minMs: 400, maxMs: 900, failRate: 0.03 });
}
