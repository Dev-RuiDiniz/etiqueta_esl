// Job periódico para disparar bind_task quando existir fila de refresh.
export function startRefreshTriggerJob({ refreshService, intervalMs, logger = console }) {
  let running = false;

  const timer = setInterval(async () => {
    if (running) {
      return;
    }

    running = true;

    try {
      const result = await refreshService.dispatchQueuedRefresh();
      if (!result.success) {
        logger.error('[job:refreshTrigger] failed', result);
      }
    } catch (error) {
      logger.error('[job:refreshTrigger] crashed', error);
    } finally {
      running = false;
    }
  }, intervalMs);

  return () => {
    clearInterval(timer);
  };
}
