// Job periódico para drenar a fila de produtos pendentes.
export function startProductSyncJob({ productSyncService, intervalMs, logger = console }) {
  let running = false;

  const timer = setInterval(async () => {
    if (running) {
      return;
    }

    running = true;

    try {
      const result = await productSyncService.flushPendingUpserts(50);
      if (!result.success) {
        logger.error('[job:productSync] failed', result);
      }
    } catch (error) {
      logger.error('[job:productSync] crashed', error);
    } finally {
      running = false;
    }
  }, intervalMs);

  return () => {
    clearInterval(timer);
  };
}
