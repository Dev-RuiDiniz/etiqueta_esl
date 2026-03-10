import { existsSync, mkdtempSync, readdirSync, rmSync } from 'node:fs';
import os from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { createSqliteRepositories } from '../db/repositories/sqlite.js';
import { startBackupJob } from '../jobs/backupJob.js';

const activeContexts = [];

function createContext(retentionCount = 2) {
  const dataDir = mkdtempSync(join(os.tmpdir(), 'etiqueta-sqlite-backup-'));
  const repositories = createSqliteRepositories({
    dataDir,
    backupRetentionCount: retentionCount
  });

  const context = {
    repositories,
    dataDir,
    async close() {
      await repositories.close();
      rmSync(dataDir, { recursive: true, force: true });
    }
  };

  activeContexts.push(context);
  return context;
}

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

afterEach(async () => {
  while (activeContexts.length > 0) {
    const ctx = activeContexts.pop();
    await ctx.close();
  }
});

describe('SQLite backup', () => {
  it('creates local backups and enforces retention', async () => {
    const ctx = createContext(2);
    const repos = ctx.repositories;

    await repos.bindingRepo.upsertBinding({
      esl_code: 'ESL-BKP-1',
      product_code: 'SKU-BKP-1'
    });

    const backup1 = await repos.createBackup({ prefix: 'backup', retentionCount: 2 });
    await wait(5);
    const backup2 = await repos.createBackup({ prefix: 'backup', retentionCount: 2 });
    await wait(5);
    const backup3 = await repos.createBackup({ prefix: 'backup', retentionCount: 2 });

    expect(existsSync(backup1.backupPath) || existsSync(backup2.backupPath) || existsSync(backup3.backupPath)).toBe(true);

    const backupFiles = readdirSync(repos.storagePaths.backupDir).filter((name) => name.startsWith('backup-') && name.endsWith('.sqlite'));
    expect(backupFiles.length).toBe(2);
  });

  it('runs scheduled backups through backup job', async () => {
    const ctx = createContext(2);
    const repos = ctx.repositories;

    await repos.bindingRepo.upsertBinding({
      esl_code: 'ESL-BKP-JOB',
      product_code: 'SKU-BKP-JOB'
    });

    const logger = {
      info() {},
      error() {}
    };

    const stop = startBackupJob({
      repositories: repos,
      intervalMs: 30,
      retentionCount: 2,
      logger
    });

    await wait(130);
    stop();

    const backupFiles = readdirSync(repos.storagePaths.backupDir).filter((name) => name.startsWith('backup-') && name.endsWith('.sqlite'));
    expect(backupFiles.length).toBeGreaterThan(0);
    expect(backupFiles.length).toBeLessThanOrEqual(2);
  });
});
