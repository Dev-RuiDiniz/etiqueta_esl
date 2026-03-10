import { copyFileSync, existsSync, mkdirSync, readdirSync, renameSync, rmSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import Database from 'better-sqlite3';
import { REQUIRED_SQLITE_TABLES } from './schema.js';

function formatBackupTimestamp(date = new Date()) {
  const year = String(date.getFullYear());
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  const milliseconds = String(date.getMilliseconds()).padStart(3, '0');
  return `${year}${month}${day}-${hours}${minutes}${seconds}${milliseconds}`;
}

function toPositiveInt(value, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.floor(parsed);
}

function listBackups(backupDir, prefix) {
  if (!existsSync(backupDir)) {
    return [];
  }

  return readdirSync(backupDir)
    .filter((name) => name.startsWith(`${prefix}-`) && name.endsWith('.sqlite'))
    .map((name) => {
      const filepath = resolve(backupDir, name);
      const stats = statSync(filepath);
      return {
        name,
        filepath,
        mtimeMs: stats.mtimeMs
      };
    })
    .sort((a, b) => b.mtimeMs - a.mtimeMs);
}

function pruneBackups(backupDir, prefix, retentionCount) {
  const keepCount = toPositiveInt(retentionCount, 7);
  const backups = listBackups(backupDir, prefix);
  const filesToRemove = backups.slice(keepCount);

  for (const file of filesToRemove) {
    rmSync(file.filepath, { force: true });
  }

  return filesToRemove.map((file) => file.filepath);
}

function copyFileAtomically(sourcePath, targetPath) {
  const tempPath = resolve(dirname(targetPath), `.tmp-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`);

  try {
    copyFileSync(sourcePath, tempPath);
    renameSync(tempPath, targetPath);
  } catch (error) {
    rmSync(tempPath, { force: true });
    throw error;
  }
}

function assertRequiredTables(db, requiredTables) {
  const getTableStmt = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?");

  for (const tableName of requiredTables) {
    const row = getTableStmt.get(tableName);
    if (!row) {
      const error = new Error(`Missing required table: ${tableName}`);
      error.code = 'SQLITE_TABLE_MISSING';
      throw error;
    }
  }
}

export function ensureSqliteIntegrity({ databasePath, requiredTables = REQUIRED_SQLITE_TABLES }) {
  const db = new Database(databasePath, {
    readonly: true,
    fileMustExist: true
  });

  try {
    const integrityResult = String(db.pragma('integrity_check', { simple: true }) ?? '')
      .trim()
      .toLowerCase();

    if (integrityResult !== 'ok') {
      const error = new Error(`SQLite integrity check failed: ${integrityResult}`);
      error.code = 'SQLITE_INTEGRITY_FAILED';
      throw error;
    }

    assertRequiredTables(db, requiredTables);
    return true;
  } finally {
    db.close();
  }
}

export function createSqliteBackupSnapshot({
  databasePath,
  backupDir,
  prefix = 'backup',
  retentionCount = 7,
  requiredTables = REQUIRED_SQLITE_TABLES,
  db = null
}) {
  if (!existsSync(databasePath)) {
    const error = new Error(`Database file not found: ${databasePath}`);
    error.code = 'SQLITE_DATABASE_NOT_FOUND';
    throw error;
  }

  mkdirSync(backupDir, { recursive: true });

  if (db) {
    db.pragma('wal_checkpoint(TRUNCATE)');
  }

  const filename = `${prefix}-${formatBackupTimestamp()}.sqlite`;
  const backupPath = resolve(backupDir, filename);

  copyFileAtomically(databasePath, backupPath);

  try {
    ensureSqliteIntegrity({ databasePath: backupPath, requiredTables });
  } catch (error) {
    rmSync(backupPath, { force: true });
    throw error;
  }

  const removedFiles = pruneBackups(backupDir, prefix, retentionCount);

  return {
    backupPath,
    removedFiles
  };
}

export function replaceSqliteDatabaseFile({ sourcePath, targetPath }) {
  if (!existsSync(sourcePath)) {
    const error = new Error(`Backup file not found: ${sourcePath}`);
    error.code = 'SQLITE_BACKUP_FILE_NOT_FOUND';
    throw error;
  }

  mkdirSync(dirname(targetPath), { recursive: true });

  const tempTargetPath = resolve(dirname(targetPath), `.restore-${Date.now()}-${Math.random().toString(36).slice(2, 10)}.tmp`);

  try {
    copyFileSync(sourcePath, tempTargetPath);

    rmSync(`${targetPath}-wal`, { force: true });
    rmSync(`${targetPath}-shm`, { force: true });
    rmSync(targetPath, { force: true });

    renameSync(tempTargetPath, targetPath);
  } catch (error) {
    rmSync(tempTargetPath, { force: true });
    throw error;
  }
}
