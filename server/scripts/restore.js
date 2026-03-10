import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { loadConfig } from '../config.js';
import { createSqliteBackupSnapshot, ensureSqliteIntegrity, replaceSqliteDatabaseFile } from '../db/sqlite/maintenance.js';
import { ensureSqliteStorageDirs, resolveSqliteStoragePaths } from '../db/sqlite/paths.js';
import { REQUIRED_SQLITE_TABLES } from '../db/sqlite/schema.js';
import { loadDotEnv } from '../utils/env.js';

function printUsage() {
  console.log('Usage: npm run bff:restore -- <backup-file-path> [--yes]');
}

function parseArgs(argv) {
  const options = {
    yes: false,
    backupPath: ''
  };

  for (const arg of argv) {
    if (arg === '--yes') {
      options.yes = true;
      continue;
    }

    if (arg === '--help' || arg === '-h') {
      options.help = true;
      continue;
    }

    if (arg.startsWith('--')) {
      const error = new Error(`Unknown option: ${arg}`);
      error.code = 'INVALID_OPTION';
      throw error;
    }

    if (!options.backupPath) {
      options.backupPath = arg;
      continue;
    }

    const error = new Error(`Unexpected argument: ${arg}`);
    error.code = 'INVALID_ARGUMENT';
    throw error;
  }

  return options;
}

async function confirmRestore(backupPath, targetPath) {
  const rl = createInterface({ input, output });

  try {
    console.log(`[restore] source backup: ${backupPath}`);
    console.log(`[restore] target database: ${targetPath}`);

    const answer = await rl.question('Type RESTORE to confirm: ');
    return answer.trim() === 'RESTORE';
  } finally {
    rl.close();
  }
}

loadDotEnv();

try {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    printUsage();
    process.exit(0);
  }

  if (!options.backupPath) {
    printUsage();
    process.exit(1);
  }

  const config = loadConfig();

  if (config.persistenceMode !== 'sqlite') {
    console.error(`[restore] unsupported persistence mode: ${config.persistenceMode}. Set BFF_PERSISTENCE_MODE=sqlite.`);
    process.exit(1);
  }

  const storagePaths = resolveSqliteStoragePaths(config.dataDir);
  ensureSqliteStorageDirs(storagePaths);

  const sourceBackupPath = resolve(process.cwd(), options.backupPath);

  if (!existsSync(sourceBackupPath)) {
    console.error(`[restore] backup file not found: ${sourceBackupPath}`);
    process.exit(1);
  }

  ensureSqliteIntegrity({
    databasePath: sourceBackupPath,
    requiredTables: REQUIRED_SQLITE_TABLES
  });

  if (!options.yes) {
    const confirmed = await confirmRestore(sourceBackupPath, storagePaths.databasePath);

    if (!confirmed) {
      console.error('[restore] canceled by user.');
      process.exit(1);
    }
  }

  let safetySnapshotPath = null;

  if (existsSync(storagePaths.databasePath)) {
    const safetySnapshot = createSqliteBackupSnapshot({
      databasePath: storagePaths.databasePath,
      backupDir: storagePaths.backupDir,
      prefix: 'pre-restore',
      retentionCount: config.backupRetentionCount,
      requiredTables: REQUIRED_SQLITE_TABLES
    });

    safetySnapshotPath = safetySnapshot.backupPath;
    console.log(`[restore] safety snapshot created: ${safetySnapshotPath}`);
  }

  replaceSqliteDatabaseFile({
    sourcePath: sourceBackupPath,
    targetPath: storagePaths.databasePath
  });

  ensureSqliteIntegrity({
    databasePath: storagePaths.databasePath,
    requiredTables: REQUIRED_SQLITE_TABLES
  });

  console.log(`[restore] completed: ${storagePaths.databasePath}`);
  if (safetySnapshotPath) {
    console.log(`[restore] rollback snapshot: ${safetySnapshotPath}`);
  }
} catch (error) {
  console.error('[restore] failed', error?.message ?? error);
  process.exit(1);
}
