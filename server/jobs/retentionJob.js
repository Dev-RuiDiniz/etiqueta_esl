function dateDaysAgo(days) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

export function startRetentionJob({ commandLogRepo, deadLetterRepo, commandLogRetentionDays, deadLetterRetentionDays, intervalMs, logger = console }) {
  let running = false;

  const timer = setInterval(async () => {
    if (running) {
      return;
    }

    running = true;

    try {
      const commandCutoff = dateDaysAgo(commandLogRetentionDays);
      const deadLetterCutoff = dateDaysAgo(deadLetterRetentionDays);

      const [removedLogs, removedDeadLetters] = await Promise.all([
        commandLogRepo.purgeOlderThan(commandCutoff),
        deadLetterRepo.purgeOlderThan(deadLetterCutoff)
      ]);

      logger.info({ removed_logs: removedLogs, removed_dead_letters: removedDeadLetters }, '[job:retention] completed');
    } catch (error) {
      logger.error({ err: error }, '[job:retention] crashed');
    } finally {
      running = false;
    }
  }, intervalMs);

  return () => {
    clearInterval(timer);
  };
}
