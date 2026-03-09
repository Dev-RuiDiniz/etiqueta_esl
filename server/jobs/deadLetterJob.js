import { listDeadLetters, removeDeadLetter } from '../db/deadLetterRepo.js';

// Job de reprocessamento da dead-letter queue.
export function startDeadLetterJob({ intervalMs, logger = console, replayHandlers = {} }) {
  let running = false;

  const timer = setInterval(async () => {
    if (running) {
      return;
    }

    running = true;

    try {
      const deadLetters = listDeadLetters(100);

      for (const item of deadLetters) {
        const handler = replayHandlers[item.operation];

        if (!handler) {
          continue;
        }

        try {
          await handler(item);
          removeDeadLetter(item.id);
        } catch (error) {
          logger.error('[job:deadLetter] replay failed', {
            dead_letter_id: item.id,
            operation: item.operation,
            error: error?.message ?? 'Unknown error'
          });
        }
      }
    } catch (error) {
      logger.error('[job:deadLetter] crashed', error);
    } finally {
      running = false;
    }
  }, intervalMs);

  return () => {
    clearInterval(timer);
  };
}
