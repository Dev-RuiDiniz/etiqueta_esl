import { historyMock } from '../mocks/history';
import type { HistoryItem } from '../types/history';

const SHOULD_FAIL = false;
const MIN_DELAY_MS = 400;
const MAX_DELAY_MS = 900;

function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function wait(min: number, max: number) {
  const delay = randomBetween(min, max);

  return new Promise((resolve) => {
    window.setTimeout(resolve, delay);
  });
}

export async function getHistory(): Promise<HistoryItem[]> {
  await wait(MIN_DELAY_MS, MAX_DELAY_MS);

  if (SHOULD_FAIL) {
    throw new Error('Erro ao carregar histórico');
  }

  return historyMock.map((item) => ({ ...item }));
}
