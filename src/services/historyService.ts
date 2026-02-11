import { historyMock } from '../mocks/history';
import type { HistoryItem } from '../types/history';
import { simulateNetwork } from './api';

export async function getHistory(): Promise<HistoryItem[]> {
  return simulateNetwork(historyMock.map((item) => ({ ...item })), { minMs: 400, maxMs: 900, failRate: 0.04 });
}
