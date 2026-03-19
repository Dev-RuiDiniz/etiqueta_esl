import { dashboardSummaryMock } from '../mocks/dashboard';
import type { DashboardSummary } from '../types/dashboard';
import { API_MODE, simulateNetwork } from './api';
import { eslGet } from './esl/apiClient';

export async function getDashboardSummary(): Promise<DashboardSummary> {
  if (API_MODE !== 'mock') {
    const result = await eslGet<DashboardSummary>('/status/dashboard');
    return result.data as DashboardSummary;
  }

  return simulateNetwork(dashboardSummaryMock, { minMs: 400, maxMs: 900, failRate: 0.03 });
}
