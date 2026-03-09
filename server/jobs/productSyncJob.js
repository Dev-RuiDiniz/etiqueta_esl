// Job periódico para drenar a fila de produtos pendentes.
export function startProductSyncJob({ productSyncService, intervalMs, logger = console, metrics = null }) {
  let running = false;

  const timer = setInterval(async () => {
    if (running) {
      return;
    }

    running = true;

    try {
      const result = await productSyncService.flushPendingUpserts(50);
      if (!result.success) {
        logger.error({ result }, '[job:productSync] failed');
        metrics?.trackJobRun?.('productSync', 'failed');
      } else {
        metrics?.trackJobRun?.('productSync', 'success');
      }
    } catch (error) {
      logger.error({ err: error }, '[job:productSync] crashed');
      metrics?.trackJobRun?.('productSync', 'failed');
    } finally {
      running = false;
    }
  }, intervalMs);

  return () => {
    clearInterval(timer);
  };
}
