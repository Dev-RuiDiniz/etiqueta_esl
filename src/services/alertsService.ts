import { alertsMock } from '../mocks/alerts';
import type { AlertItem } from '../types/alerts';

const ALERTS_MIN_DELAY_MS = 400;
const ALERTS_MAX_DELAY_MS = 900;
const RESOLVE_MIN_DELAY_MS = 200;
const RESOLVE_MAX_DELAY_MS = 600;
const SHOULD_FAIL = false;

function getRandomDelay(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function wait(min: number, max: number) {
  await new Promise((resolve) => {
    window.setTimeout(resolve, getRandomDelay(min, max));
  });
}

function maybeFail() {
  if (SHOULD_FAIL) {
    throw new Error('Erro simulado no serviço de alertas');
  }
}

export async function getAlerts(): Promise<AlertItem[]> {
  await wait(ALERTS_MIN_DELAY_MS, ALERTS_MAX_DELAY_MS);
  maybeFail();
  return alertsMock;
}

export async function resolveAlert(id: string): Promise<void> {
  void id;
  await wait(RESOLVE_MIN_DELAY_MS, RESOLVE_MAX_DELAY_MS);
  maybeFail();
}
