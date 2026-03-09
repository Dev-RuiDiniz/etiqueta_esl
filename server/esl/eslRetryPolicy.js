import { addDeadLetter } from '../db/deadLetterRepo.js';

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function defaultRetryable(error) {
  if (!error) {
    return false;
  }

  if (error.name === 'AbortError') {
    return true;
  }

  if (typeof error.statusCode === 'number' && error.statusCode >= 500) {
    return true;
  }

  if (error.code === 'ENOTFOUND' || error.code === 'ECONNRESET' || error.code === 'ECONNREFUSED') {
    return true;
  }

  return false;
}

export async function runWithRetry(task, context, config, options = {}) {
  // Política de retry com backoff exponencial + fallback para dead-letter.
  const attempts = options.attempts ?? config.maxRetryAttempts;
  const baseDelayMs = options.baseDelayMs ?? config.retryBaseDelayMs;
  const isRetryable = options.isRetryable ?? defaultRetryable;

  let lastError = null;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await task(attempt);
    } catch (error) {
      lastError = error;

      const canRetry = attempt < attempts && isRetryable(error);
      if (!canRetry) {
        break;
      }

      const backoff = Math.min(baseDelayMs * 2 ** (attempt - 1), 5000);
      await sleep(backoff);
    }
  }

  addDeadLetter({
    operation: context.operation,
    payload: context.payload,
    error: {
      message: lastError?.message ?? 'Unknown retry failure',
      code: lastError?.code ?? 'RETRY_FAILED',
      statusCode: lastError?.statusCode
    },
    attempts,
    meta: context.meta ?? {}
  });

  throw lastError;
}
