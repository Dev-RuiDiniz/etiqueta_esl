import Database from 'better-sqlite3';
import { existsSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { Pool } from 'pg';
import { loadDotEnv } from '../utils/env.js';
import { resolveSqliteStoragePaths } from '../db/sqlite/paths.js';
import { runPostgresMigrations } from './postgres-migrate.js';

function parseJson(value) {
  if (value == null || value === '') {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function resolveSqliteSourcePath() {
  const customArg = process.argv.find((arg) => arg.startsWith('--sqlite='));
  if (customArg) {
    return customArg.split('=')[1];
  }

  const envPath = (process.env.SQLITE_SOURCE_PATH ?? '').trim();
  if (envPath) {
    return envPath;
  }

  return resolveSqliteStoragePaths(process.env.BFF_DATA_DIR ?? '').databasePath;
}

async function withTransaction(pool, callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('SET LOCAL statement_timeout = 0');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

function sqliteTableExists(sqlite, tableName) {
  const row = sqlite
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?")
    .get(tableName);
  return Boolean(row?.name);
}

function readSqliteTable(sqlite, tableName) {
  if (!sqliteTableExists(sqlite, tableName)) {
    return [];
  }

  return sqlite.prepare(`SELECT * FROM ${tableName}`).all();
}

export async function migrateSqliteToPostgres({ sqlitePath, databaseUrl }) {
  if (!databaseUrl) {
    const error = new Error('DATABASE_URL is required for sqlite -> postgres migration.');
    error.code = 'DATABASE_URL_MISSING';
    throw error;
  }

  if (!sqlitePath || !existsSync(sqlitePath)) {
    const error = new Error(`SQLite source not found: ${sqlitePath}`);
    error.code = 'SQLITE_SOURCE_NOT_FOUND';
    throw error;
  }

  await runPostgresMigrations({ databaseUrl });

  const sqlite = new Database(sqlitePath, { readonly: true });
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: process.env.PGSSLMODE?.toLowerCase() === 'disable' ? false : { rejectUnauthorized: false }
  });

  const report = {
    sqlite_path: sqlitePath,
    migrated_at: new Date().toISOString(),
    tables: {}
  };

  try {
    await withTransaction(pool, async (client) => {
      const eslCatalog = readSqliteTable(sqlite, 'esl_catalog');
      for (const row of eslCatalog) {
        await client.query(
          `
          INSERT INTO esl_catalog (
            esl_code, display_name, esltype_code, ap_code, expected_ap_code, source,
            registration_status, last_seen_at, created_at, updated_at
          )
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
          ON CONFLICT (esl_code)
          DO UPDATE SET
            display_name = EXCLUDED.display_name,
            esltype_code = EXCLUDED.esltype_code,
            ap_code = EXCLUDED.ap_code,
            expected_ap_code = EXCLUDED.expected_ap_code,
            source = EXCLUDED.source,
            registration_status = EXCLUDED.registration_status,
            last_seen_at = EXCLUDED.last_seen_at,
            updated_at = EXCLUDED.updated_at;
          `,
          [
            row.esl_code,
            row.display_name ?? null,
            row.esltype_code ?? null,
            row.ap_code ?? null,
            row.expected_ap_code ?? null,
            row.source ?? 'MANUAL',
            row.registration_status ?? 'REGISTERED',
            row.last_seen_at ?? null,
            row.created_at,
            row.updated_at
          ]
        );
      }
      report.tables.esl_catalog = { source_count: eslCatalog.length, upserted: eslCatalog.length };

      const eslBindings = readSqliteTable(sqlite, 'esl_bindings');
      for (const row of eslBindings) {
        await client.query(
          `
          INSERT INTO esl_bindings (esl_code, product_code, template_id, bound_at, updated_at, binding_status)
          VALUES ($1,$2,$3,$4,$5,$6)
          ON CONFLICT (esl_code)
          DO UPDATE SET
            product_code = EXCLUDED.product_code,
            template_id = EXCLUDED.template_id,
            updated_at = EXCLUDED.updated_at,
            binding_status = EXCLUDED.binding_status;
          `,
          [row.esl_code, row.product_code, row.template_id ?? null, row.bound_at, row.updated_at, row.binding_status ?? 'BOUND']
        );
      }
      report.tables.esl_bindings = { source_count: eslBindings.length, upserted: eslBindings.length };

      const snapshots = readSqliteTable(sqlite, 'esl_status_snapshots');
      for (const row of snapshots) {
        await client.query(
          `
          INSERT INTO esl_status_snapshots (
            esl_code, esl_version, action, online, esl_battery, battery_percent,
            product_code, ap_code, esltype_code, created_at, updated_at, seen_at
          )
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
          ON CONFLICT (esl_code)
          DO UPDATE SET
            esl_version = EXCLUDED.esl_version,
            action = EXCLUDED.action,
            online = EXCLUDED.online,
            esl_battery = EXCLUDED.esl_battery,
            battery_percent = EXCLUDED.battery_percent,
            product_code = EXCLUDED.product_code,
            ap_code = EXCLUDED.ap_code,
            esltype_code = EXCLUDED.esltype_code,
            created_at = EXCLUDED.created_at,
            updated_at = EXCLUDED.updated_at,
            seen_at = EXCLUDED.seen_at;
          `,
          [
            row.esl_code,
            row.esl_version ?? null,
            row.action ?? null,
            Number(row.online ?? 0),
            Number(row.esl_battery ?? 0),
            row.battery_percent ?? null,
            row.product_code ?? null,
            row.ap_code ?? null,
            row.esltype_code ?? null,
            row.created_at ?? null,
            row.updated_at ?? null,
            row.seen_at
          ]
        );
      }
      report.tables.esl_status_snapshots = { source_count: snapshots.length, upserted: snapshots.length };

      const commandLogs = readSqliteTable(sqlite, 'esl_command_log');
      for (const row of commandLogs) {
        await client.query(
          `
          INSERT INTO esl_command_log (
            id, created_at, operation, request_id, success, error_code, error_msg, payload, response, meta
          )
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
          ON CONFLICT (id)
          DO UPDATE SET
            created_at = EXCLUDED.created_at,
            operation = EXCLUDED.operation,
            request_id = EXCLUDED.request_id,
            success = EXCLUDED.success,
            error_code = EXCLUDED.error_code,
            error_msg = EXCLUDED.error_msg,
            payload = EXCLUDED.payload,
            response = EXCLUDED.response,
            meta = EXCLUDED.meta;
          `,
          [
            row.id,
            row.created_at,
            row.operation,
            row.request_id ?? null,
            Number(row.success ?? 0) === 1,
            row.error_code ?? null,
            row.error_msg ?? null,
            parseJson(row.payload),
            parseJson(row.response),
            parseJson(row.meta)
          ]
        );
      }
      report.tables.esl_command_log = { source_count: commandLogs.length, upserted: commandLogs.length };

      const deadLetters = readSqliteTable(sqlite, 'dead_letters');
      for (const row of deadLetters) {
        await client.query(
          `
          INSERT INTO dead_letters (
            id, created_at, operation, payload, error, attempts, meta, status, last_error, processed_at
          )
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
          ON CONFLICT (id)
          DO UPDATE SET
            created_at = EXCLUDED.created_at,
            operation = EXCLUDED.operation,
            payload = EXCLUDED.payload,
            error = EXCLUDED.error,
            attempts = EXCLUDED.attempts,
            meta = EXCLUDED.meta,
            status = EXCLUDED.status,
            last_error = EXCLUDED.last_error,
            processed_at = EXCLUDED.processed_at;
          `,
          [
            row.id,
            row.created_at,
            row.operation,
            parseJson(row.payload),
            parseJson(row.error),
            Number(row.attempts ?? 0),
            parseJson(row.meta),
            row.status ?? 'PENDING',
            row.last_error ?? null,
            row.processed_at ?? null
          ]
        );
      }
      report.tables.dead_letters = { source_count: deadLetters.length, upserted: deadLetters.length };

      const users = readSqliteTable(sqlite, 'users');
      for (const row of users) {
        await client.query(
          `
          INSERT INTO users (id, email, password_hash, role, created_at, updated_at)
          VALUES ($1,$2,$3,$4,$5,$6)
          ON CONFLICT (email)
          DO UPDATE SET
            password_hash = EXCLUDED.password_hash,
            role = EXCLUDED.role,
            updated_at = EXCLUDED.updated_at;
          `,
          [row.id, row.email, row.password_hash, row.role, row.created_at, row.updated_at]
        );
      }
      report.tables.users = { source_count: users.length, upserted: users.length };

      const refreshTokens = readSqliteTable(sqlite, 'refresh_tokens');
      for (const row of refreshTokens) {
        await client.query(
          `
          INSERT INTO refresh_tokens (
            id, user_id, token_hash, expires_at, revoked, created_at, revoked_at
          )
          VALUES ($1,$2,$3,$4,$5,$6,$7)
          ON CONFLICT (token_hash)
          DO UPDATE SET
            user_id = EXCLUDED.user_id,
            expires_at = EXCLUDED.expires_at,
            revoked = EXCLUDED.revoked,
            revoked_at = EXCLUDED.revoked_at;
          `,
          [
            row.id,
            row.user_id,
            row.token_hash,
            row.expires_at,
            Number(row.revoked ?? 0) === 1,
            row.created_at,
            row.revoked_at ?? null
          ]
        );
      }
      report.tables.refresh_tokens = { source_count: refreshTokens.length, upserted: refreshTokens.length };

      const products = readSqliteTable(sqlite, 'products');
      for (const row of products) {
        await client.query(
          `
          INSERT INTO products (
            product_inner_code, product_code, product_name, spec, grade, price, quantity, unit, vip_price,
            origin_price, origin, manufacturer, promotion, last_synced_at, sync_status
          )
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
          ON CONFLICT (product_code)
          DO UPDATE SET
            product_inner_code = EXCLUDED.product_inner_code,
            product_name = EXCLUDED.product_name,
            spec = EXCLUDED.spec,
            grade = EXCLUDED.grade,
            price = EXCLUDED.price,
            quantity = EXCLUDED.quantity,
            unit = EXCLUDED.unit,
            vip_price = EXCLUDED.vip_price,
            origin_price = EXCLUDED.origin_price,
            origin = EXCLUDED.origin,
            manufacturer = EXCLUDED.manufacturer,
            promotion = EXCLUDED.promotion,
            last_synced_at = EXCLUDED.last_synced_at,
            sync_status = EXCLUDED.sync_status;
          `,
          [
            row.product_inner_code ?? null,
            row.product_code,
            row.product_name,
            row.spec ?? null,
            row.grade ?? null,
            Number(row.price ?? 0),
            row.quantity ?? null,
            row.unit ?? null,
            row.vip_price ?? null,
            row.origin_price ?? null,
            row.origin ?? null,
            row.manufacturer ?? null,
            row.promotion ?? null,
            row.last_synced_at,
            row.sync_status ?? 'PENDING'
          ]
        );
      }
      report.tables.products = { source_count: products.length, upserted: products.length };
    });
  } finally {
    sqlite.close();
    await pool.end();
  }

  report.success = true;
  return report;
}

const isDirectRun = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  loadDotEnv();
  const sqlitePath = resolveSqliteSourcePath();
  const result = await migrateSqliteToPostgres({
    sqlitePath,
    databaseUrl: process.env.DATABASE_URL
  });
  console.log(JSON.stringify(result, null, 2));
}
