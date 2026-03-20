import Database from 'better-sqlite3';
import { existsSync } from 'node:fs';
import { createSqliteBackupSnapshot, ensureSqliteIntegrity } from '../sqlite/maintenance.js';
import { ensureSqliteStorageDirs, resolveSqliteStoragePaths } from '../sqlite/paths.js';
import { REQUIRED_SQLITE_TABLES, SQLITE_SCHEMA_SQL } from '../sqlite/schema.js';

function buildId(prefix) {
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix}-${Date.now()}-${random}`;
}

function nowIso() {
  return new Date().toISOString();
}

function safeJson(value) {
  return value == null ? null : JSON.stringify(value);
}

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

function toSqliteBoolean(value) {
  return value ? 1 : 0;
}

function fromSqliteBoolean(value) {
  return value === 1 || value === true;
}

function toSafeInteger(value, fallback = 0) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.trunc(parsed);
}

function toNullableInteger(value) {
  if (value == null || value === '') {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return null;
  }

  return Math.trunc(parsed);
}

function mapCommandLogRow(row) {
  if (!row) {
    return null;
  }

  return {
    ...row,
    success: fromSqliteBoolean(row.success),
    payload: parseJson(row.payload),
    response: parseJson(row.response),
    meta: parseJson(row.meta)
  };
}

function mapDeadLetterRow(row) {
  if (!row) {
    return null;
  }

  return {
    ...row,
    payload: parseJson(row.payload),
    error: parseJson(row.error),
    meta: parseJson(row.meta)
  };
}

function mapRefreshTokenRow(row) {
  if (!row) {
    return null;
  }

  return {
    ...row,
    revoked: fromSqliteBoolean(row.revoked)
  };
}

function mapStatusSummaryRow(row) {
  if (!row) {
    return {
      online_count: 0,
      offline_count: 0,
      total_count: 0,
      updated_at: nowIso()
    };
  }

  return {
    online_count: toSafeInteger(row.online_count, 0),
    offline_count: toSafeInteger(row.offline_count, 0),
    total_count: toSafeInteger(row.total_count, 0),
    updated_at: nowIso()
  };
}

function mapCatalogRow(row) {
  if (!row) {
    return null;
  }

  return {
    esl_code: row.esl_code,
    display_name: row.display_name ?? null,
    esltype_code: row.esltype_code ?? null,
    ap_code: row.ap_code ?? null,
    source: row.source,
    registration_status: row.registration_status,
    last_seen_at: row.last_seen_at ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

function buildDuplicateUserError() {
  const error = new Error('User email already exists.');
  error.code = 'USER_DUPLICATE_EMAIL';
  return error;
}

export function createSqliteRepositories({ dataDir = '', backupRetentionCount = 7 } = {}) {
  const storagePaths = resolveSqliteStoragePaths(dataDir);
  ensureSqliteStorageDirs(storagePaths);

  const db = new Database(storagePaths.databasePath);
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = NORMAL');
  db.pragma('foreign_keys = ON');
  db.pragma('busy_timeout = 5000');
  db.exec(SQLITE_SCHEMA_SQL);

  const getTableStmt = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?");

  const insertCatalogStmt = db.prepare(`
    INSERT INTO esl_catalog (
      esl_code,
      display_name,
      esltype_code,
      ap_code,
      source,
      registration_status,
      last_seen_at,
      created_at,
      updated_at
    )
    VALUES (
      @esl_code,
      @display_name,
      @esltype_code,
      @ap_code,
      @source,
      @registration_status,
      @last_seen_at,
      @created_at,
      @updated_at
    );
  `);

  const upsertCatalogStmt = db.prepare(`
    INSERT INTO esl_catalog (
      esl_code,
      display_name,
      esltype_code,
      ap_code,
      source,
      registration_status,
      last_seen_at,
      created_at,
      updated_at
    )
    VALUES (
      @esl_code,
      @display_name,
      @esltype_code,
      @ap_code,
      @source,
      @registration_status,
      @last_seen_at,
      @created_at,
      @updated_at
    )
    ON CONFLICT (esl_code)
    DO UPDATE SET
      display_name = excluded.display_name,
      esltype_code = excluded.esltype_code,
      ap_code = excluded.ap_code,
      source = excluded.source,
      registration_status = excluded.registration_status,
      last_seen_at = excluded.last_seen_at,
      updated_at = excluded.updated_at;
  `);

  const updateCatalogStmt = db.prepare(`
    UPDATE esl_catalog
    SET
      display_name = @display_name,
      esltype_code = @esltype_code,
      ap_code = @ap_code,
      source = @source,
      registration_status = @registration_status,
      last_seen_at = @last_seen_at,
      updated_at = @updated_at
    WHERE esl_code = @esl_code
  `);

  const getCatalogStmt = db.prepare(
    'SELECT esl_code, display_name, esltype_code, ap_code, source, registration_status, last_seen_at, created_at, updated_at FROM esl_catalog WHERE esl_code = ?'
  );
  const listCatalogStmt = db.prepare(
    'SELECT esl_code, display_name, esltype_code, ap_code, source, registration_status, last_seen_at, created_at, updated_at FROM esl_catalog ORDER BY updated_at DESC'
  );
  const countCatalogStmt = db.prepare('SELECT COUNT(*) AS count FROM esl_catalog');

  const upsertBindingStmt = db.prepare(`
    INSERT INTO esl_bindings (esl_code, product_code, template_id, bound_at, updated_at, binding_status)
    VALUES (@esl_code, @product_code, @template_id, @bound_at, @updated_at, @binding_status)
    ON CONFLICT (esl_code)
    DO UPDATE SET
      product_code = excluded.product_code,
      template_id = excluded.template_id,
      binding_status = excluded.binding_status,
      updated_at = excluded.updated_at;
  `);

  const deleteBindingStmt = db.prepare('DELETE FROM esl_bindings WHERE esl_code = ?');
  const getBindingStmt = db.prepare(
    'SELECT esl_code, product_code, template_id, bound_at, updated_at, binding_status FROM esl_bindings WHERE esl_code = ?'
  );
  const listBindingsStmt = db.prepare(
    'SELECT esl_code, product_code, template_id, bound_at, updated_at, binding_status FROM esl_bindings ORDER BY updated_at DESC'
  );
  const listBindingsByProductStmt = db.prepare(
    'SELECT esl_code, product_code, template_id, bound_at, updated_at, binding_status FROM esl_bindings WHERE product_code = ? ORDER BY updated_at DESC'
  );
  const countBindingsStmt = db.prepare('SELECT COUNT(*) AS count FROM esl_bindings');

  const upsertStatusStmt = db.prepare(`
    INSERT INTO esl_status_snapshots (
      esl_code,
      esl_version,
      action,
      online,
      esl_battery,
      battery_percent,
      product_code,
      ap_code,
      esltype_code,
      created_at,
      updated_at,
      seen_at
    )
    VALUES (
      @esl_code,
      @esl_version,
      @action,
      @online,
      @esl_battery,
      @battery_percent,
      @product_code,
      @ap_code,
      @esltype_code,
      @created_at,
      @updated_at,
      @seen_at
    )
    ON CONFLICT (esl_code)
    DO UPDATE SET
      esl_version = excluded.esl_version,
      action = excluded.action,
      online = excluded.online,
      esl_battery = excluded.esl_battery,
      battery_percent = excluded.battery_percent,
      product_code = excluded.product_code,
      ap_code = excluded.ap_code,
      esltype_code = excluded.esltype_code,
      created_at = excluded.created_at,
      updated_at = excluded.updated_at,
      seen_at = excluded.seen_at;
  `);

  const getStatusStmt = db.prepare(
    'SELECT esl_code, esl_version, action, online, esl_battery, battery_percent, product_code, ap_code, esltype_code, created_at, updated_at, seen_at FROM esl_status_snapshots WHERE esl_code = ?'
  );
  const listStatusStmt = db.prepare(
    'SELECT esl_code, esl_version, action, online, esl_battery, battery_percent, product_code, ap_code, esltype_code, created_at, updated_at, seen_at FROM esl_status_snapshots ORDER BY seen_at DESC'
  );
  const statusSummaryStmt = db.prepare(`
    SELECT
      COALESCE(SUM(CASE WHEN online = 1 THEN 1 ELSE 0 END), 0) AS online_count,
      COALESCE(SUM(CASE WHEN online <> 1 THEN 1 ELSE 0 END), 0) AS offline_count,
      COUNT(*) AS total_count
    FROM esl_status_snapshots;
  `);

  const insertCommandLogStmt = db.prepare(`
    INSERT INTO esl_command_log (
      id,
      created_at,
      operation,
      request_id,
      success,
      error_code,
      error_msg,
      payload,
      response,
      meta
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
  `);
  const getCommandLogByIdStmt = db.prepare(
    'SELECT id, created_at, operation, request_id, success, error_code, error_msg, payload, response, meta FROM esl_command_log WHERE id = ?'
  );
  const listCommandLogsStmt = db.prepare(
    'SELECT id, created_at, operation, request_id, success, error_code, error_msg, payload, response, meta FROM esl_command_log ORDER BY created_at DESC LIMIT ?'
  );
  const findCommandByRequestStmt = db.prepare(
    'SELECT id, created_at, operation, request_id, success, error_code, error_msg, payload, response, meta FROM esl_command_log WHERE request_id = ? ORDER BY created_at DESC LIMIT 1'
  );
  const purgeCommandLogsStmt = db.prepare('DELETE FROM esl_command_log WHERE created_at < ?');
  const countCommandLogsStmt = db.prepare('SELECT COUNT(*) AS count FROM esl_command_log');

  const insertDeadLetterStmt = db.prepare(`
    INSERT INTO dead_letters (
      id,
      created_at,
      operation,
      payload,
      error,
      attempts,
      meta,
      status,
      last_error,
      processed_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
  `);
  const listDeadLettersStmt = db.prepare(
    'SELECT id, created_at, operation, payload, error, attempts, meta, status, last_error, processed_at FROM dead_letters ORDER BY created_at DESC LIMIT ?'
  );
  const getDeadLetterByIdStmt = db.prepare(
    'SELECT id, created_at, operation, payload, error, attempts, meta, status, last_error, processed_at FROM dead_letters WHERE id = ?'
  );
  const deleteDeadLetterStmt = db.prepare('DELETE FROM dead_letters WHERE id = ?');
  const updateDeadLetterStatusStmt = db.prepare(
    'UPDATE dead_letters SET status = ?, last_error = ?, processed_at = ? WHERE id = ?'
  );
  const purgeDeadLetterStmt = db.prepare('DELETE FROM dead_letters WHERE created_at < ?');
  const countDeadLettersStmt = db.prepare('SELECT COUNT(*) AS count FROM dead_letters');

  const upsertProductStmt = db.prepare(`
    INSERT INTO products (product_code, product_name, price, quantity, unit, vip_price, origin_price, promotion, last_synced_at, sync_status)
    VALUES (@product_code, @product_name, @price, @quantity, @unit, @vip_price, @origin_price, @promotion, @last_synced_at, @sync_status)
    ON CONFLICT (product_code)
    DO UPDATE SET
      product_name = excluded.product_name,
      price = excluded.price,
      quantity = excluded.quantity,
      unit = excluded.unit,
      vip_price = excluded.vip_price,
      origin_price = excluded.origin_price,
      promotion = excluded.promotion,
      last_synced_at = excluded.last_synced_at,
      sync_status = excluded.sync_status;
  `);
  const getProductStmt = db.prepare('SELECT * FROM products WHERE product_code = ?');
  const listProductsStmt = db.prepare('SELECT * FROM products ORDER BY last_synced_at DESC LIMIT ? OFFSET ?');
  const countProductsStmt = db.prepare('SELECT COUNT(*) AS count FROM products');

  const insertUserStmt = db.prepare(
    'INSERT INTO users (id, email, password_hash, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
  );
  const updateUserStmt = db.prepare(
    'UPDATE users SET email = COALESCE(?, email), password_hash = COALESCE(?, password_hash), role = COALESCE(?, role), updated_at = ? WHERE id = ?'
  );
  const findUserByEmailStmt = db.prepare('SELECT id, email, password_hash, role, created_at, updated_at FROM users WHERE email = ?');
  const findUserByIdStmt = db.prepare('SELECT id, email, password_hash, role, created_at, updated_at FROM users WHERE id = ?');
  const listUsersStmt = db.prepare('SELECT id, email, password_hash, role, created_at, updated_at FROM users ORDER BY created_at DESC LIMIT ?');

  const insertRefreshTokenStmt = db.prepare(
    'INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at, revoked, created_at, revoked_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  );
  const findRefreshTokenByHashStmt = db.prepare(
    'SELECT id, user_id, token_hash, expires_at, revoked, created_at, revoked_at FROM refresh_tokens WHERE token_hash = ?'
  );
  const revokeRefreshTokenStmt = db.prepare('UPDATE refresh_tokens SET revoked = 1, revoked_at = ? WHERE token_hash = ?');
  const revokeAllRefreshTokensStmt = db.prepare('UPDATE refresh_tokens SET revoked = 1, revoked_at = ? WHERE user_id = ? AND revoked = 0');

  const upsertStatusTxn = db.transaction((snapshots) => {
    const seenAt = nowIso();

    for (const item of snapshots) {
      if (!item?.esl_code) {
        continue;
      }

      upsertStatusStmt.run({
        esl_code: String(item.esl_code),
        esl_version: item.esl_version ?? null,
        action: toNullableInteger(item.action),
        online: toSqliteBoolean(item.online === 1 || item.online === true),
        esl_battery: toSafeInteger(item.esl_battery, 0),
        battery_percent: toNullableInteger(item.battery_percent),
        product_code: item.product_code ?? null,
        ap_code: item.ap_code ?? null,
        esltype_code: item.esltype_code ?? null,
        created_at: item.created_at ?? null,
        updated_at: item.updated_at ?? null,
        seen_at: seenAt
      });
    }
  });

  const eslCatalogRepo = {
    async createCatalogItem(input) {
      const now = nowIso();
      try {
        insertCatalogStmt.run({
          esl_code: String(input.esl_code),
          display_name: input.display_name ?? null,
          esltype_code: input.esltype_code ?? null,
          ap_code: input.ap_code ?? null,
          source: input.source ?? 'MANUAL',
          registration_status: input.registration_status ?? 'REGISTERED',
          last_seen_at: input.last_seen_at ?? null,
          created_at: now,
          updated_at: now
        });
      } catch (error) {
        if (String(error?.code ?? '') === 'SQLITE_CONSTRAINT_PRIMARYKEY') {
          const duplicate = new Error('ESL already registered.');
          duplicate.code = 'ESL_ALREADY_REGISTERED';
          throw duplicate;
        }
        throw error;
      }

      return mapCatalogRow(getCatalogStmt.get(String(input.esl_code)));
    },

    async upsertCatalogItem(input) {
      const now = nowIso();
      const existing = getCatalogStmt.get(String(input.esl_code));

      upsertCatalogStmt.run({
        esl_code: String(input.esl_code),
        display_name: input.display_name ?? existing?.display_name ?? null,
        esltype_code: input.esltype_code ?? existing?.esltype_code ?? null,
        ap_code: input.ap_code ?? existing?.ap_code ?? null,
        source: input.source ?? existing?.source ?? 'MANUAL',
        registration_status: input.registration_status ?? existing?.registration_status ?? 'REGISTERED',
        last_seen_at: input.last_seen_at ?? existing?.last_seen_at ?? null,
        created_at: existing?.created_at ?? now,
        updated_at: now
      });

      return mapCatalogRow(getCatalogStmt.get(String(input.esl_code)));
    },

    async updateCatalogItem(eslCode, updates) {
      const existing = getCatalogStmt.get(String(eslCode));
      if (!existing) {
        return null;
      }

      updateCatalogStmt.run({
        esl_code: String(eslCode),
        display_name: typeof updates.display_name !== 'undefined' ? updates.display_name : existing.display_name,
        esltype_code: typeof updates.esltype_code !== 'undefined' ? updates.esltype_code : existing.esltype_code,
        ap_code: typeof updates.ap_code !== 'undefined' ? updates.ap_code : existing.ap_code,
        source: updates.source ?? existing.source,
        registration_status: updates.registration_status ?? existing.registration_status,
        last_seen_at: typeof updates.last_seen_at !== 'undefined' ? updates.last_seen_at : existing.last_seen_at,
        updated_at: nowIso()
      });

      return mapCatalogRow(getCatalogStmt.get(String(eslCode)));
    },

    async getCatalogItem(eslCode) {
      return mapCatalogRow(getCatalogStmt.get(String(eslCode)));
    },

    async listCatalogItems() {
      return listCatalogStmt.all().map((row) => mapCatalogRow(row));
    },

    async countCatalogItems() {
      const row = countCatalogStmt.get();
      return toSafeInteger(row?.count, 0);
    }
  };

  const bindingRepo = {
    async upsertBinding(binding) {
      const now = nowIso();
      const existing = getBindingStmt.get(binding.esl_code);

      upsertBindingStmt.run({
        esl_code: binding.esl_code,
        product_code: binding.product_code,
        template_id: binding.template_id ?? existing?.template_id ?? null,
        bound_at: existing?.bound_at ?? now,
        updated_at: now,
        binding_status: binding.binding_status ?? 'BOUND'
      });

      return getBindingStmt.get(binding.esl_code) ?? null;
    },

    async removeBinding(eslCode) {
      const existing = getBindingStmt.get(eslCode);
      if (!existing) {
        return null;
      }

      deleteBindingStmt.run(eslCode);
      return {
        ...existing,
        binding_status: 'UNBOUND',
        updated_at: nowIso()
      };
    },

    async getBindingByEslCode(eslCode) {
      return getBindingStmt.get(eslCode) ?? null;
    },

    async listBindings() {
      return listBindingsStmt.all();
    },

    async listBindingsByProductCode(productCode) {
      return listBindingsByProductStmt.all(productCode);
    },

    async countBindings() {
      const row = countBindingsStmt.get();
      return toSafeInteger(row?.count, 0);
    }
  };

  const statusRepo = {
    async upsertStatusSnapshots(snapshots) {
      if (!Array.isArray(snapshots) || snapshots.length === 0) {
        return;
      }

      upsertStatusTxn(snapshots);
    },

    async getStatusSnapshot(eslCode) {
      return getStatusStmt.get(eslCode) ?? null;
    },

    async listStatusSnapshots() {
      return listStatusStmt.all();
    },

    async getStatusSummary() {
      return mapStatusSummaryRow(statusSummaryStmt.get());
    }
  };

  const commandLogRepo = {
    async addCommandLog(entry) {
      const id = entry.id ?? buildId('CMD');
      const createdAt = nowIso();

      insertCommandLogStmt.run(
        id,
        createdAt,
        entry.operation,
        entry.request_id ?? null,
        toSqliteBoolean(Boolean(entry.success)),
        entry.error_code ?? null,
        entry.error_msg ?? null,
        safeJson(entry.payload ?? null),
        safeJson(entry.response ?? null),
        safeJson(entry.meta ?? null)
      );

      return mapCommandLogRow(getCommandLogByIdStmt.get(id));
    },

    async listCommandLogs(limit = 100) {
      const rows = listCommandLogsStmt.all(Math.max(1, toSafeInteger(limit, 100)));
      return rows.map((row) => mapCommandLogRow(row));
    },

    async findCommandByRequestId(requestId) {
      return mapCommandLogRow(findCommandByRequestStmt.get(requestId));
    },

    async purgeOlderThan(beforeIsoDate) {
      const info = purgeCommandLogsStmt.run(beforeIsoDate);
      return toSafeInteger(info.changes, 0);
    },

    async countLogs() {
      const row = countCommandLogsStmt.get();
      return toSafeInteger(row?.count, 0);
    }
  };

  const deadLetterRepo = {
    async addDeadLetter(entry) {
      const id = entry.id ?? buildId('DLQ');
      const createdAt = nowIso();

      insertDeadLetterStmt.run(
        id,
        createdAt,
        entry.operation,
        safeJson(entry.payload ?? null),
        safeJson(entry.error ?? null),
        entry.attempts ?? 0,
        safeJson(entry.meta ?? null),
        entry.status ?? 'PENDING',
        entry.last_error ?? null,
        entry.processed_at ?? null
      );

      return mapDeadLetterRow(getDeadLetterByIdStmt.get(id));
    },

    async listDeadLetters(limit = 100) {
      const rows = listDeadLettersStmt.all(Math.max(1, toSafeInteger(limit, 100)));
      return rows.map((row) => mapDeadLetterRow(row));
    },

    async removeDeadLetter(deadLetterId) {
      const existing = getDeadLetterByIdStmt.get(deadLetterId);
      if (!existing) {
        return null;
      }

      deleteDeadLetterStmt.run(deadLetterId);
      return mapDeadLetterRow(existing);
    },

    async markDeadLetterStatus(deadLetterId, status, lastError = null) {
      const processedAt = status === 'PROCESSED' ? nowIso() : null;
      const info = updateDeadLetterStatusStmt.run(status, lastError, processedAt, deadLetterId);

      if (toSafeInteger(info.changes, 0) === 0) {
        return null;
      }

      return mapDeadLetterRow(getDeadLetterByIdStmt.get(deadLetterId));
    },

    async purgeOlderThan(beforeIsoDate) {
      const info = purgeDeadLetterStmt.run(beforeIsoDate);
      return toSafeInteger(info.changes, 0);
    },

    async countDeadLetters() {
      const row = countDeadLettersStmt.get();
      return toSafeInteger(row?.count, 0);
    }
  };

  const userRepo = {
    async createUser(user) {
      const now = nowIso();
      const id = user.id ?? buildId('USR');

      try {
        insertUserStmt.run(id, user.email, user.password_hash, user.role, now, now);
      } catch (error) {
        if (String(error?.code ?? '') === 'SQLITE_CONSTRAINT_UNIQUE') {
          throw buildDuplicateUserError();
        }

        throw error;
      }

      return findUserByIdStmt.get(id) ?? null;
    },

    async updateUser(userId, updates) {
      const now = nowIso();

      try {
        const info = updateUserStmt.run(updates.email ?? null, updates.password_hash ?? null, updates.role ?? null, now, userId);

        if (toSafeInteger(info.changes, 0) === 0) {
          return null;
        }
      } catch (error) {
        if (String(error?.code ?? '') === 'SQLITE_CONSTRAINT_UNIQUE') {
          throw buildDuplicateUserError();
        }

        throw error;
      }

      return findUserByIdStmt.get(userId) ?? null;
    },

    async findByEmail(email) {
      return findUserByEmailStmt.get(email) ?? null;
    },

    async findById(userId) {
      return findUserByIdStmt.get(userId) ?? null;
    },

    async listUsers(limit = 100) {
      return listUsersStmt.all(Math.max(1, toSafeInteger(limit, 100)));
    }
  };

  const refreshTokenRepo = {
    async createRefreshToken(entry) {
      const now = nowIso();
      const id = entry.id ?? buildId('RTK');

      insertRefreshTokenStmt.run(id, entry.user_id, entry.token_hash, entry.expires_at, 0, now, null);
      return mapRefreshTokenRow(findRefreshTokenByHashStmt.get(entry.token_hash));
    },

    async findByTokenHash(tokenHash) {
      return mapRefreshTokenRow(findRefreshTokenByHashStmt.get(tokenHash));
    },

    async revokeToken(tokenHash) {
      const existing = findRefreshTokenByHashStmt.get(tokenHash);
      if (!existing) {
        return null;
      }

      revokeRefreshTokenStmt.run(nowIso(), tokenHash);
      return mapRefreshTokenRow(findRefreshTokenByHashStmt.get(tokenHash));
    },

    async revokeAllByUserId(userId) {
      const info = revokeAllRefreshTokensStmt.run(nowIso(), userId);
      return toSafeInteger(info.changes, 0);
    }
  };

  const productRepo = {
    async upsertProduct(product) {
      upsertProductStmt.run({
        product_code: String(product.product_code),
        product_name: String(product.product_name ?? ''),
        price: Number(product.price ?? 0),
        quantity: product.quantity != null ? toSafeInteger(product.quantity, 0) : null,
        unit: product.unit ?? null,
        vip_price: product.vip_price != null ? Number(product.vip_price) : null,
        origin_price: product.origin_price != null ? Number(product.origin_price) : null,
        promotion: product.promotion ?? null,
        last_synced_at: nowIso(),
        sync_status: product.sync_status ?? 'SYNCED'
      });
      return getProductStmt.get(String(product.product_code)) ?? null;
    },

    async getProduct(productCode) {
      return getProductStmt.get(productCode) ?? null;
    },

    async listProducts(limit = 100, offset = 0) {
      return listProductsStmt.all(Math.max(1, toSafeInteger(limit, 100)), Math.max(0, toSafeInteger(offset, 0)));
    },

    async countProducts() {
      const row = countProductsStmt.get();
      return toSafeInteger(row?.count, 0);
    }
  };

  return {
    mode: 'sqlite',
    storagePaths,
    eslCatalogRepo,
    bindingRepo,
    statusRepo,
    commandLogRepo,
    deadLetterRepo,
    userRepo,
    refreshTokenRepo,
    productRepo,
    async createBackup({ prefix = 'backup', retentionCount = backupRetentionCount } = {}) {
      return createSqliteBackupSnapshot({
        db,
        databasePath: storagePaths.databasePath,
        backupDir: storagePaths.backupDir,
        prefix,
        retentionCount,
        requiredTables: REQUIRED_SQLITE_TABLES
      });
    },
    async ready() {
      if (!existsSync(storagePaths.databasePath)) {
        return false;
      }

      try {
        const integrity = String(db.pragma('integrity_check', { simple: true }) ?? '')
          .trim()
          .toLowerCase();

        if (integrity !== 'ok') {
          return false;
        }

        for (const tableName of REQUIRED_SQLITE_TABLES) {
          if (!getTableStmt.get(tableName)) {
            return false;
          }
        }

        return true;
      } catch {
        return false;
      }
    },
    async close() {
      if (db.open) {
        db.close();
      }
    },
    async validateDatabaseFile(filepath) {
      return ensureSqliteIntegrity({
        databasePath: filepath,
        requiredTables: REQUIRED_SQLITE_TABLES
      });
    }
  };
}
