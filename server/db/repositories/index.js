import { assertPersistenceConfig } from '../../config.js';
import { createMemoryRepositories } from './memory.js';

export async function createRepositories(config) {
  assertPersistenceConfig(config);

  const mode = config.persistenceMode;

  if (mode === 'sqlite') {
    const { createSqliteRepositories } = await import('./sqlite.js');
    return createSqliteRepositories({
      dataDir: config.dataDir,
      backupRetentionCount: config.backupRetentionCount
    });
  }

  if (mode === 'memory') {
    return createMemoryRepositories();
  }

  if (mode === 'postgres') {
    const { createPostgresRepositories } = await import('./postgres.js');
    return createPostgresRepositories({
      databaseUrl: config.databaseUrl
    });
  }

  const error = new Error(`Unsupported persistence mode: ${mode}`);
  error.code = 'PERSISTENCE_MODE_UNSUPPORTED';
  throw error;
}
