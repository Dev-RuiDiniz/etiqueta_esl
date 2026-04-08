import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { Pool } from 'pg';
import { loadDotEnv } from '../utils/env.js';

function resolveMigrationsDir() {
  const currentFile = fileURLToPath(import.meta.url);
  const currentDir = dirname(currentFile);
  return join(currentDir, '..', 'db', 'postgres', 'migrations');
}

export async function runPostgresMigrations({ databaseUrl, migrationsDir = resolveMigrationsDir() } = {}) {
  if (!databaseUrl) {
    const error = new Error('DATABASE_URL is required to run postgres migrations.');
    error.code = 'DATABASE_URL_MISSING';
    throw error;
  }

  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: process.env.PGSSLMODE?.toLowerCase() === 'disable' ? false : { rejectUnauthorized: false }
  });

  const migrationFiles = readdirSync(migrationsDir)
    .filter((name) => name.endsWith('.sql'))
    .sort((a, b) => a.localeCompare(b));

  const client = await pool.connect();
  const applied = [];

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    for (const fileName of migrationFiles) {
      const version = fileName.replace(/\.sql$/i, '');
      const alreadyApplied = await client.query('SELECT 1 FROM schema_migrations WHERE version = $1 LIMIT 1;', [version]);

      if (alreadyApplied.rowCount > 0) {
        continue;
      }

      const sql = readFileSync(join(migrationsDir, fileName), 'utf8');
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (version) VALUES ($1);', [version]);
      await client.query('COMMIT');
      applied.push(version);
    }
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch {
      // noop
    }
    throw error;
  } finally {
    client.release();
    await pool.end();
  }

  return {
    success: true,
    applied,
    total_discovered: migrationFiles.length
  };
}

const isDirectRun = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  loadDotEnv();
  const result = await runPostgresMigrations({ databaseUrl: process.env.DATABASE_URL });
  console.log(JSON.stringify(result, null, 2));
}
