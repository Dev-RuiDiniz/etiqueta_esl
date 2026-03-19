import { historyMock } from '../mocks/history';
import type { HistoryItem } from '../types/history';
import { API_MODE, simulateNetwork } from './api';
import { eslGet } from './esl/apiClient';

export async function getHistory(): Promise<HistoryItem[]> {
  if (API_MODE !== 'mock') {
    const result = await eslGet<HistoryItem[]>('/audit/history');
    return Array.isArray(result.data) ? result.data : [];
  }

  return simulateNetwork(historyMock.map((item) => ({ ...item })), { minMs: 400, maxMs: 900, failRate: 0.04 });
}
