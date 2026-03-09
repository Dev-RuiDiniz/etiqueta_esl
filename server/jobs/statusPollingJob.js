// Job periódico de polling do parque de etiquetas (online/offline/bateria).
export function startStatusPollingJob({ statusService, intervalMs, logger = console, metrics = null }) {
  let running = false;

  const timer = setInterval(async () => {
    if (running) {
      return;
    }

    running = true;

    try {
      const result = await statusService.pollAndCacheStatus({ pageSize: 100 });
      if (!result.success) {
        logger.error({ result }, '[job:statusPolling] failed');
        metrics?.trackJobRun?.('statusPolling', 'failed');
      } else {
        metrics?.trackJobRun?.('statusPolling', 'success');
      }
    } catch (error) {
      logger.error({ err: error }, '[job:statusPolling] crashed');
      metrics?.trackJobRun?.('statusPolling', 'failed');
    } finally {
      running = false;
    }
  }, intervalMs);

  return () => {
    clearInterval(timer);
  };
}
