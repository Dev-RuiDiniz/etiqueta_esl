import { mkdirSync } from 'node:fs';
import os from 'node:os';
import { resolve } from 'node:path';

const APP_FOLDER_NAME = 'etiqueta_esl';
const DATABASE_FILENAME = 'etiqueta_esl.sqlite';

function resolveDefaultBaseDir() {
  if (process.platform === 'win32') {
    const localAppData = (process.env.LOCALAPPDATA ?? '').trim();
    if (localAppData) {
      return resolve(localAppData, APP_FOLDER_NAME);
    }
  }

  return resolve(os.homedir(), `.${APP_FOLDER_NAME}`);
}

export function resolveSqliteStoragePaths(dataDirOverride = '') {
  const baseDir = dataDirOverride ? resolve(dataDirOverride) : resolveDefaultBaseDir();

  return {
    baseDir,
    dataDir: resolve(baseDir, 'data'),
    backupDir: resolve(baseDir, 'backups'),
    databasePath: resolve(baseDir, 'data', DATABASE_FILENAME)
  };
}

export function ensureSqliteStorageDirs(paths) {
  mkdirSync(paths.baseDir, { recursive: true });
  mkdirSync(paths.dataDir, { recursive: true });
  mkdirSync(paths.backupDir, { recursive: true });
}
