import { alertsMock } from '../mocks/alerts';
import type { AlertItem } from '../types/alerts';
import { API_MODE, simulateNetwork } from './api';
import { eslGet, eslPost } from './esl/apiClient';

export async function getAlerts(): Promise<AlertItem[]> {
  if (API_MODE !== 'mock') {
    const result = await eslGet<AlertItem[]>('/alerts');
    return Array.isArray(result.data) ? result.data : [];
  }

  return simulateNetwork(alertsMock.map((alert) => ({ ...alert })), { minMs: 400, maxMs: 900, failRate: 0.05 });
}

export async function resolveAlert(id: string): Promise<void> {
  if (API_MODE !== 'mock') {
    await eslPost(`/alerts/${encodeURIComponent(id)}/resolve`, {});
    return;
  }

  void id;
  await simulateNetwork(true, { minMs: 400, maxMs: 900, failRate: 0.05 });
}
