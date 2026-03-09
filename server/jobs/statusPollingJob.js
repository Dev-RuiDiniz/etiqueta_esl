// Job periódico de polling do parque de etiquetas (online/offline/bateria).
export function startStatusPollingJob({ statusService, intervalMs, logger = console }) {
  let running = false;

  const timer = setInterval(async () => {
    if (running) {
      return;
    }

    running = true;

    try {
      const result = await statusService.pollAndCacheStatus({ pageSize: 100 });
      if (!result.success) {
        logger.error('[job:statusPolling] failed', result);
      }
    } catch (error) {
      logger.error('[job:statusPolling] crashed', error);
    } finally {
      running = false;
    }
  }, intervalMs);

  return () => {
    clearInterval(timer);
  };
}
