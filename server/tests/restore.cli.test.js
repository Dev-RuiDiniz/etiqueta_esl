import { mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { afterEach, describe, expect, it } from 'vitest';
import { createBffRuntime } from '../index.js';

const activeContexts = [];

async function createRuntime(dataDir) {
  const runtime = await createBffRuntime({
    configOverrides: {
      jobsEnabled: false,
      metricsEnabled: true,
      persistenceMode: 'sqlite',
      dataDir,
      backupEnabled: false,
      authEnabled: false,
      eslHost: 'https://vendor.local',
      clientId: 'default',
      sign: 'sign',
      storeCode: '001'
    }
  });

  activeContexts.push(runtime);
  return runtime;
}

function createTempDir() {
  return mkdtempSync(join(os.tmpdir(), 'etiqueta-restore-cli-'));
}

afterEach(async () => {
  while (activeContexts.length > 0) {
    const runtime = activeContexts.pop();
    await runtime.stopAll();
  }
});

describe('Restore CLI', () => {
  it('restores database file and creates pre-restore safety snapshot', async () => {
    const dataDir = createTempDir();

    const runtimeBefore = await createRuntime(dataDir);
    await runtimeBefore.repositories.bindingRepo.upsertBinding({
      esl_code: 'ESL-RESTORE',
      product_code: 'SKU-BEFORE'
    });

    const backup = await runtimeBefore.repositories.createBackup({
      prefix: 'manual',
      retentionCount: 7
    });

    await runtimeBefore.repositories.bindingRepo.upsertBinding({
      esl_code: 'ESL-RESTORE',
      product_code: 'SKU-AFTER'
    });

    await runtimeBefore.stopAll();
    activeContexts.pop();

    const restoreResult = spawnSync('node', ['server/scripts/restore.js', backup.backupPath, '--yes'], {
      cwd: process.cwd(),
      encoding: 'utf8',
      env: {
        ...process.env,
        BFF_PERSISTENCE_MODE: 'sqlite',
        BFF_DATA_DIR: dataDir
      }
    });

    expect(restoreResult.status).toBe(0);

    const runtimeAfter = await createRuntime(dataDir);
    const restoredBinding = await runtimeAfter.repositories.bindingRepo.getBindingByEslCode('ESL-RESTORE');

    expect(restoredBinding.product_code).toBe('SKU-BEFORE');

    const preRestoreFiles = readdirSync(runtimeAfter.repositories.storagePaths.backupDir).filter((name) =>
      name.startsWith('pre-restore-')
    );

    expect(preRestoreFiles.length).toBeGreaterThan(0);

    await runtimeAfter.stopAll();
    activeContexts.pop();
    rmSync(dataDir, { recursive: true, force: true });
  });

  it('fails with controlled error when backup file is invalid', () => {
    const dataDir = createTempDir();
    const invalidBackupPath = resolve(dataDir, 'invalid-backup.sqlite');
    writeFileSync(invalidBackupPath, 'not-a-valid-sqlite-file', 'utf8');

    const restoreResult = spawnSync('node', ['server/scripts/restore.js', invalidBackupPath, '--yes'], {
      cwd: process.cwd(),
      encoding: 'utf8',
      env: {
        ...process.env,
        BFF_PERSISTENCE_MODE: 'sqlite',
        BFF_DATA_DIR: dataDir
      }
    });

    expect(restoreResult.status).toBe(1);
    expect(restoreResult.stderr).toContain('[restore] failed');

    rmSync(dataDir, { recursive: true, force: true });
  });
});
