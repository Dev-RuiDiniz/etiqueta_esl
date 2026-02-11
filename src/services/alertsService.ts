import { alertsMock } from '../mocks/alerts';
import type { AlertItem } from '../types/alerts';
import { simulateNetwork } from './api';

export async function getAlerts(): Promise<AlertItem[]> {
  return simulateNetwork(alertsMock.map((alert) => ({ ...alert })), { minMs: 400, maxMs: 900, failRate: 0.05 });
}

export async function resolveAlert(id: string): Promise<void> {
  void id;
  await simulateNetwork(true, { minMs: 400, maxMs: 900, failRate: 0.05 });
}
