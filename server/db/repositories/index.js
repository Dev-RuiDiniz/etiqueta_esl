import { assertPersistenceConfig } from '../../config.js';
import { createMemoryRepositories } from './memory.js';
import { createSqliteRepositories } from './sqlite.js';

export function createRepositories(config) {
  assertPersistenceConfig(config);

  const mode = config.persistenceMode;

  if (mode === 'sqlite') {
    return createSqliteRepositories({
      dataDir: config.dataDir,
      backupRetentionCount: config.backupRetentionCount
    });
  }

  if (mode === 'memory') {
    return createMemoryRepositories();
  }

  const error = new Error(`Unsupported persistence mode: ${mode}`);
  error.code = 'PERSISTENCE_MODE_UNSUPPORTED';
  throw error;
}
