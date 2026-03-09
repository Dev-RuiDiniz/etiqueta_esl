// Job periódico para disparar bind_task quando existir fila de refresh.
export function startRefreshTriggerJob({ refreshService, intervalMs, logger = console, metrics = null }) {
  let running = false;

  const timer = setInterval(async () => {
    if (running) {
      return;
    }

    running = true;

    try {
      const result = await refreshService.dispatchQueuedRefresh();
      if (!result.success) {
        logger.error({ result }, '[job:refreshTrigger] failed');
        metrics?.trackJobRun?.('refreshTrigger', 'failed');
      } else {
        metrics?.trackJobRun?.('refreshTrigger', 'success');
      }
    } catch (error) {
      logger.error({ err: error }, '[job:refreshTrigger] crashed');
      metrics?.trackJobRun?.('refreshTrigger', 'failed');
    } finally {
      running = false;
    }
  }, intervalMs);

  return () => {
    clearInterval(timer);
  };
}
