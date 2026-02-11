export type ApiMode = 'mock' | 'real';

export type ApiError = {
  message: string;
  code: string;
  traceId: string;
};

type SimulateNetworkOptions = {
  minMs?: number;
  maxMs?: number;
  failRate?: number;
  shouldFail?: boolean;
};

const DEFAULT_MIN_MS = 400;
const DEFAULT_MAX_MS = 900;
const DEFAULT_FAIL_RATE = 0.05;

const API_MODE = (import.meta.env.VITE_API_MODE ?? 'mock') as ApiMode;
const FORCE_API_ERROR = import.meta.env.VITE_FORCE_API_ERROR === 'true';

function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function createApiError(message: string): ApiError {
  const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase();

  return {
    message,
    code: 'MOCK_API_ERROR',
    traceId: `trace-${Date.now()}-${randomPart}`
  };
}

export async function simulateNetwork<T>(data: T, opts?: SimulateNetworkOptions): Promise<T> {
  const minMs = opts?.minMs ?? DEFAULT_MIN_MS;
  const maxMs = opts?.maxMs ?? DEFAULT_MAX_MS;
  const failRate = opts?.failRate ?? DEFAULT_FAIL_RATE;

  await sleep(randomBetween(minMs, maxMs));

  const failedByRate = Math.random() < failRate;
  const shouldFail = opts?.shouldFail || FORCE_API_ERROR || failedByRate;

  if (shouldFail) {
    throw createApiError('Não foi possível concluir a operação agora. Tente novamente.');
  }

  return data;
}

export { API_MODE, FORCE_API_ERROR };
