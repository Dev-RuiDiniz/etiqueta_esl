import { assertPersistenceConfig } from '../../config.js';
import { createMemoryRepositories } from './memory.js';
import { createPostgresRepositories } from './postgres.js';

export function createRepositories(config) {
  assertPersistenceConfig(config);

  const mode = config.persistenceMode;

  if (mode === 'postgres') {
    return createPostgresRepositories(config.databaseUrl);
  }

  if (mode !== 'memory') {
    const error = new Error(`Unsupported persistence mode: ${mode}`);
    error.code = 'PERSISTENCE_MODE_UNSUPPORTED';
    throw error;
  }

  return createMemoryRepositories();
}
