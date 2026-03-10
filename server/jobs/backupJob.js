export function startBackupJob({ repositories, intervalMs, retentionCount, logger = console }) {
  let running = false;

  const timer = setInterval(async () => {
    if (running) {
      return;
    }

    running = true;

    try {
      const result = await repositories.createBackup({
        prefix: 'backup',
        retentionCount
      });

      logger.info(
        {
          backup_path: result.backupPath,
          removed_files: result.removedFiles.length
        },
        '[job:backup] completed'
      );
    } catch (error) {
      logger.error({ err: error }, '[job:backup] crashed');
    } finally {
      running = false;
    }
  }, intervalMs);

  return () => {
    clearInterval(timer);
  };
}
