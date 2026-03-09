// Job de reprocessamento da dead-letter queue.
export function startDeadLetterJob({ deadLetterRepo, intervalMs, logger = console, metrics = null, replayHandlers = {} }) {
  let running = false;

  const timer = setInterval(async () => {
    if (running) {
      return;
    }

    running = true;

    try {
      const deadLetters = await deadLetterRepo.listDeadLetters(100);

      for (const item of deadLetters) {
        const handler = replayHandlers[item.operation];

        if (!handler) {
          continue;
        }

        try {
          await deadLetterRepo.markDeadLetterStatus(item.id, 'REPROCESSING');
          await handler(item);
          await deadLetterRepo.markDeadLetterStatus(item.id, 'PROCESSED');
          await deadLetterRepo.removeDeadLetter(item.id);
        } catch (error) {
          await deadLetterRepo.markDeadLetterStatus(item.id, 'FAILED', error?.message ?? 'Unknown error');
          logger.error({
            dead_letter_id: item.id,
            operation: item.operation,
            error: error?.message ?? 'Unknown error'
          }, '[job:deadLetter] replay failed');
        }
      }
      metrics?.trackJobRun?.('deadLetter', 'success');
    } catch (error) {
      logger.error({ err: error }, '[job:deadLetter] crashed');
      metrics?.trackJobRun?.('deadLetter', 'failed');
    } finally {
      running = false;
    }
  }, intervalMs);

  return () => {
    clearInterval(timer);
  };
}
