import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadDotEnv } from '../utils/env.js';
import { createPostgresPool } from '../db/postgres/client.js';

loadDotEnv();

const databaseUrl = (process.env.DATABASE_URL ?? '').trim();

if (!databaseUrl) {
  console.error('[migrate] Missing DATABASE_URL');
  process.exit(1);
}

const command = (process.argv[2] ?? 'up').trim().toLowerCase();
const migrationDir = resolve(process.cwd(), 'server/db/postgres/migrations');

function readSql(filePath) {
  return readFileSync(filePath, 'utf8');
}

function listMigrationNames() {
  return readdirSync(migrationDir)
    .filter((name) => name.endsWith('.up.sql'))
    .map((name) => name.replace('.up.sql', ''))
    .sort();
}

async function ensureMigrationTable(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

async function getAppliedMigrations(pool) {
  const result = await pool.query('SELECT id FROM schema_migrations ORDER BY id ASC');
  return new Set(result.rows.map((row) => row.id));
}

async function runUp(pool) {
  const names = listMigrationNames();
  const applied = await getAppliedMigrations(pool);

  for (const name of names) {
    if (applied.has(name)) {
      continue;
    }

    const sql = readSql(resolve(migrationDir, `${name}.up.sql`));

    await pool.query('BEGIN');
    try {
      await pool.query(sql);
      await pool.query('INSERT INTO schema_migrations (id) VALUES ($1)', [name]);
      await pool.query('COMMIT');
      console.log(`[migrate] applied ${name}`);
    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }
  }
}

async function runDown(pool) {
  const result = await pool.query('SELECT id FROM schema_migrations ORDER BY id DESC LIMIT 1');
  const latest = result.rows[0]?.id;

  if (!latest) {
    console.log('[migrate] no migrations to rollback');
    return;
  }

  const downPath = resolve(migrationDir, `${latest}.down.sql`);
  const sql = readSql(downPath);

  await pool.query('BEGIN');
  try {
    await pool.query(sql);
    await pool.query('DELETE FROM schema_migrations WHERE id = $1', [latest]);
    await pool.query('COMMIT');
    console.log(`[migrate] rolled back ${latest}`);
  } catch (error) {
    await pool.query('ROLLBACK');
    throw error;
  }
}

const pool = createPostgresPool(databaseUrl);

try {
  await ensureMigrationTable(pool);

  if (command === 'up') {
    await runUp(pool);
  } else if (command === 'down') {
    await runDown(pool);
  } else {
    console.error(`[migrate] unknown command: ${command}`);
    process.exitCode = 1;
  }
} catch (error) {
  console.error('[migrate] failed', error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
