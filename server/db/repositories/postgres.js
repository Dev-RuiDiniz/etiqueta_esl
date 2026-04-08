import { Pool } from 'pg';
import { POSTGRES_SCHEMA_SQL, REQUIRED_POSTGRES_TABLES } from '../postgres/schema.js';

function buildId(prefix) {
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix}-${Date.now()}-${random}`;
}

function nowIso() {
  return new Date().toISOString();
}

function toSafeInteger(value, fallback = 0) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.trunc(parsed);
}

function detectSsl(databaseUrl) {
  if (!databaseUrl) {
    return false;
  }

  if (process.env.PGSSLMODE?.toLowerCase() === 'disable') {
    return false;
  }

  const localHosts = ['localhost', '127.0.0.1'];
  const isLocal = localHosts.some((host) => databaseUrl.includes(host));
  return isLocal ? false : { rejectUnauthorized: false };
}

function buildDuplicateUserError() {
  const error = new Error('User email already exists.');
  error.code = 'USER_DUPLICATE_EMAIL';
  return error;
}

const poolRegistry = globalThis.__eslPostgresPools ?? new Map();
globalThis.__eslPostgresPools = poolRegistry;

async function ensureSchema(pool) {
  await pool.query(POSTGRES_SCHEMA_SQL);
}

function parseCommandLogRow(row) {
  if (!row) {
    return null;
  }

  return {
    ...row,
    success: Boolean(row.success),
    error_code: row.error_code != null ? Number(row.error_code) : null
  };
}

function parseDeadLetterRow(row) {
  if (!row) {
    return null;
  }

  return {
    ...row,
    attempts: Number(row.attempts ?? 0)
  };
}

function parseRefreshTokenRow(row) {
  if (!row) {
    return null;
  }

  return {
    ...row,
    revoked: Boolean(row.revoked)
  };
}

export async function createPostgresRepositories({ databaseUrl }) {
  let pool = poolRegistry.get(databaseUrl);

  if (!pool) {
    pool = new Pool({
      connectionString: databaseUrl,
      ssl: detectSsl(databaseUrl)
    });
    poolRegistry.set(databaseUrl, pool);
  }

  await ensureSchema(pool);

  const eslCatalogRepo = {
    async createCatalogItem(input) {
      const now = nowIso();

      const result = await pool.query(
        `
        INSERT INTO esl_catalog (
          esl_code, display_name, esltype_code, ap_code, expected_ap_code,
          source, registration_status, last_seen_at, created_at, updated_at
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
        RETURNING *;
        `,
        [
          String(input.esl_code),
          input.display_name ?? null,
          input.esltype_code ?? null,
          input.ap_code ?? null,
          input.expected_ap_code ?? null,
          input.source ?? 'MANUAL',
          input.registration_status ?? 'REGISTERED',
          input.last_seen_at ?? null,
          now,
          now
        ]
      );

      return result.rows[0] ?? null;
    },

    async upsertCatalogItem(input) {
      const now = nowIso();
      const result = await pool.query(
        `
        INSERT INTO esl_catalog (
          esl_code, display_name, esltype_code, ap_code, expected_ap_code,
          source, registration_status, last_seen_at, created_at, updated_at
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
          updated_at = EXCLUDED.updated_at
        RETURNING *;
        `,
        [
          String(input.esl_code),
          input.display_name ?? null,
          input.esltype_code ?? null,
          input.ap_code ?? null,
          input.expected_ap_code ?? null,
          input.source ?? 'MANUAL',
          input.registration_status ?? 'REGISTERED',
          input.last_seen_at ?? null,
          now,
          now
        ]
      );

      return result.rows[0] ?? null;
    },

    async updateCatalogItem(eslCode, updates) {
      const result = await pool.query(
        `
        UPDATE esl_catalog
        SET
          display_name = COALESCE($2, display_name),
          esltype_code = COALESCE($3, esltype_code),
          ap_code = COALESCE($4, ap_code),
          expected_ap_code = COALESCE($5, expected_ap_code),
          source = COALESCE($6, source),
          registration_status = COALESCE($7, registration_status),
          last_seen_at = COALESCE($8, last_seen_at),
          updated_at = $9
        WHERE esl_code = $1
        RETURNING *;
        `,
        [
          eslCode,
          updates.display_name ?? null,
          updates.esltype_code ?? null,
          updates.ap_code ?? null,
          updates.expected_ap_code ?? null,
          updates.source ?? null,
          updates.registration_status ?? null,
          updates.last_seen_at ?? null,
          nowIso()
        ]
      );

      return result.rows[0] ?? null;
    },

    async getCatalogItem(eslCode) {
      const result = await pool.query('SELECT * FROM esl_catalog WHERE esl_code = $1 LIMIT 1;', [eslCode]);
      return result.rows[0] ?? null;
    },

    async listCatalogItems() {
      const result = await pool.query('SELECT * FROM esl_catalog ORDER BY updated_at DESC;');
      return result.rows;
    },

    async countCatalogItems() {
      const result = await pool.query('SELECT COUNT(*) AS count FROM esl_catalog;');
      return toSafeInteger(result.rows[0]?.count, 0);
    }
  };

  const bindingRepo = {
    async upsertBinding(binding) {
      const now = nowIso();
      const result = await pool.query(
        `
        INSERT INTO esl_bindings (esl_code, product_code, template_id, bound_at, updated_at, binding_status)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (esl_code)
        DO UPDATE SET
          product_code = EXCLUDED.product_code,
          template_id = EXCLUDED.template_id,
          updated_at = EXCLUDED.updated_at,
          binding_status = EXCLUDED.binding_status
        RETURNING *;
        `,
        [
          binding.esl_code,
          binding.product_code,
          binding.template_id ?? null,
          binding.bound_at ?? now,
          now,
          binding.binding_status ?? 'BOUND'
        ]
      );

      return result.rows[0] ?? null;
    },

    async removeBinding(eslCode) {
      const result = await pool.query('DELETE FROM esl_bindings WHERE esl_code = $1 RETURNING *;', [eslCode]);
      if (result.rows.length === 0) {
        return null;
      }

      return {
        ...result.rows[0],
        binding_status: 'UNBOUND',
        updated_at: nowIso()
      };
    },

    async getBindingByEslCode(eslCode) {
      const result = await pool.query('SELECT * FROM esl_bindings WHERE esl_code = $1 LIMIT 1;', [eslCode]);
      return result.rows[0] ?? null;
    },

    async listBindings() {
      const result = await pool.query('SELECT * FROM esl_bindings ORDER BY updated_at DESC;');
      return result.rows;
    },

    async listBindingsByProductCode(productCode) {
      const result = await pool.query('SELECT * FROM esl_bindings WHERE product_code = $1 ORDER BY updated_at DESC;', [productCode]);
      return result.rows;
    },

    async countBindings() {
      const result = await pool.query('SELECT COUNT(*) AS count FROM esl_bindings;');
      return toSafeInteger(result.rows[0]?.count, 0);
    }
  };

  const statusRepo = {
    async upsertStatusSnapshots(snapshots) {
      if (!Array.isArray(snapshots) || snapshots.length === 0) {
        return;
      }

      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        for (const item of snapshots) {
          if (!item?.esl_code) {
            continue;
          }

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
              item.esl_code,
              item.esl_version ?? null,
              item.action ?? null,
              item.online === 1 || item.online === true ? 1 : 0,
              toSafeInteger(item.esl_battery, 0),
              item.battery_percent != null ? toSafeInteger(item.battery_percent, null) : null,
              item.product_code ?? null,
              item.ap_code ?? null,
              item.esltype_code ?? null,
              item.created_at ?? null,
              item.updated_at ?? null,
              nowIso()
            ]
          );
        }

        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    },

    async getStatusSnapshot(eslCode) {
      const result = await pool.query('SELECT * FROM esl_status_snapshots WHERE esl_code = $1 LIMIT 1;', [eslCode]);
      return result.rows[0] ?? null;
    },

    async listStatusSnapshots() {
      const result = await pool.query('SELECT * FROM esl_status_snapshots ORDER BY COALESCE(updated_at, seen_at) DESC;');
      return result.rows;
    },

    async getStatusSummary() {
      const result = await pool.query(
        `
        SELECT
          COALESCE(SUM(CASE WHEN online = 1 THEN 1 ELSE 0 END), 0) AS online_count,
          COALESCE(SUM(CASE WHEN online = 1 THEN 0 ELSE 1 END), 0) AS offline_count,
          COUNT(*) AS total_count
        FROM esl_status_snapshots;
        `
      );

      return {
        online_count: toSafeInteger(result.rows[0]?.online_count, 0),
        offline_count: toSafeInteger(result.rows[0]?.offline_count, 0),
        total_count: toSafeInteger(result.rows[0]?.total_count, 0),
        updated_at: nowIso()
      };
    }
  };

  const commandLogRepo = {
    async addCommandLog(entry) {
      const id = entry.id ?? buildId('CMD');
      const createdAt = nowIso();

      const result = await pool.query(
        `
        INSERT INTO esl_command_log (
          id, created_at, operation, request_id, success, error_code, error_msg, payload, response, meta
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
        RETURNING *;
        `,
        [
          id,
          createdAt,
          entry.operation,
          entry.request_id ?? null,
          Boolean(entry.success),
          entry.error_code ?? null,
          entry.error_msg ?? null,
          entry.payload ?? null,
          entry.response ?? null,
          entry.meta ?? null
        ]
      );

      return parseCommandLogRow(result.rows[0]);
    },

    async listCommandLogs(limit = 100) {
      const result = await pool.query(
        'SELECT * FROM esl_command_log ORDER BY created_at DESC LIMIT $1;',
        [Math.max(1, toSafeInteger(limit, 100))]
      );
      return result.rows.map((row) => parseCommandLogRow(row));
    },

    async findCommandByRequestId(requestId) {
      const result = await pool.query(
        'SELECT * FROM esl_command_log WHERE request_id = $1 ORDER BY created_at DESC LIMIT 1;',
        [requestId]
      );
      return parseCommandLogRow(result.rows[0] ?? null);
    },

    async purgeOlderThan(beforeIsoDate) {
      const result = await pool.query('DELETE FROM esl_command_log WHERE created_at < $1;', [beforeIsoDate]);
      return toSafeInteger(result.rowCount, 0);
    },

    async countLogs() {
      const result = await pool.query('SELECT COUNT(*) AS count FROM esl_command_log;');
      return toSafeInteger(result.rows[0]?.count, 0);
    }
  };

  const deadLetterRepo = {
    async addDeadLetter(entry) {
      const id = entry.id ?? buildId('DLQ');
      const createdAt = nowIso();
      const result = await pool.query(
        `
        INSERT INTO dead_letters (
          id, created_at, operation, payload, error, attempts, meta, status, last_error, processed_at
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
        RETURNING *;
        `,
        [
          id,
          createdAt,
          entry.operation,
          entry.payload ?? null,
          entry.error ?? null,
          toSafeInteger(entry.attempts, 0),
          entry.meta ?? null,
          entry.status ?? 'PENDING',
          entry.last_error ?? null,
          entry.processed_at ?? null
        ]
      );

      return parseDeadLetterRow(result.rows[0]);
    },

    async listDeadLetters(limit = 100) {
      const result = await pool.query('SELECT * FROM dead_letters ORDER BY created_at DESC LIMIT $1;', [
        Math.max(1, toSafeInteger(limit, 100))
      ]);
      return result.rows.map((row) => parseDeadLetterRow(row));
    },

    async removeDeadLetter(deadLetterId) {
      const result = await pool.query('DELETE FROM dead_letters WHERE id = $1 RETURNING *;', [deadLetterId]);
      return parseDeadLetterRow(result.rows[0] ?? null);
    },

    async markDeadLetterStatus(deadLetterId, status, lastError = null) {
      const processedAt = status === 'PROCESSED' ? nowIso() : null;
      const result = await pool.query(
        `
        UPDATE dead_letters
        SET status = $2, last_error = $3, processed_at = $4
        WHERE id = $1
        RETURNING *;
        `,
        [deadLetterId, status, lastError, processedAt]
      );
      return parseDeadLetterRow(result.rows[0] ?? null);
    },

    async purgeOlderThan(beforeIsoDate) {
      const result = await pool.query('DELETE FROM dead_letters WHERE created_at < $1;', [beforeIsoDate]);
      return toSafeInteger(result.rowCount, 0);
    },

    async countDeadLetters() {
      const result = await pool.query('SELECT COUNT(*) AS count FROM dead_letters;');
      return toSafeInteger(result.rows[0]?.count, 0);
    }
  };

  const userRepo = {
    async createUser(user) {
      const now = nowIso();
      const id = user.id ?? buildId('USR');

      try {
        const result = await pool.query(
          `
          INSERT INTO users (id, email, password_hash, role, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING *;
          `,
          [id, user.email, user.password_hash, user.role, now, now]
        );
        return result.rows[0] ?? null;
      } catch (error) {
        if (error?.code === '23505') {
          throw buildDuplicateUserError();
        }
        throw error;
      }
    },

    async updateUser(userId, updates) {
      try {
        const result = await pool.query(
          `
          UPDATE users
          SET
            email = COALESCE($2, email),
            password_hash = COALESCE($3, password_hash),
            role = COALESCE($4, role),
            updated_at = $5
          WHERE id = $1
          RETURNING *;
          `,
          [userId, updates.email ?? null, updates.password_hash ?? null, updates.role ?? null, nowIso()]
        );

        return result.rows[0] ?? null;
      } catch (error) {
        if (error?.code === '23505') {
          throw buildDuplicateUserError();
        }
        throw error;
      }
    },

    async findByEmail(email) {
      const result = await pool.query('SELECT * FROM users WHERE email = $1 LIMIT 1;', [email]);
      return result.rows[0] ?? null;
    },

    async findById(userId) {
      const result = await pool.query('SELECT * FROM users WHERE id = $1 LIMIT 1;', [userId]);
      return result.rows[0] ?? null;
    },

    async listUsers(limit = 100) {
      const result = await pool.query('SELECT * FROM users ORDER BY created_at DESC LIMIT $1;', [
        Math.max(1, toSafeInteger(limit, 100))
      ]);
      return result.rows;
    }
  };

  const refreshTokenRepo = {
    async createRefreshToken(entry) {
      const id = entry.id ?? buildId('RTK');
      const now = nowIso();
      const result = await pool.query(
        `
        INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at, revoked, created_at, revoked_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7)
        RETURNING *;
        `,
        [id, entry.user_id, entry.token_hash, entry.expires_at, false, now, null]
      );
      return parseRefreshTokenRow(result.rows[0] ?? null);
    },

    async findByTokenHash(tokenHash) {
      const result = await pool.query('SELECT * FROM refresh_tokens WHERE token_hash = $1 LIMIT 1;', [tokenHash]);
      return parseRefreshTokenRow(result.rows[0] ?? null);
    },

    async revokeToken(tokenHash) {
      const result = await pool.query(
        `
        UPDATE refresh_tokens
        SET revoked = true, revoked_at = $2
        WHERE token_hash = $1
        RETURNING *;
        `,
        [tokenHash, nowIso()]
      );
      return parseRefreshTokenRow(result.rows[0] ?? null);
    },

    async revokeAllByUserId(userId) {
      const result = await pool.query(
        `
        UPDATE refresh_tokens
        SET revoked = true, revoked_at = $2
        WHERE user_id = $1 AND revoked = false;
        `,
        [userId, nowIso()]
      );
      return toSafeInteger(result.rowCount, 0);
    },

    async listActiveUserIds(referenceDate = new Date()) {
      const result = await pool.query(
        `
        SELECT DISTINCT user_id
        FROM refresh_tokens
        WHERE revoked = false AND expires_at > $1;
        `,
        [referenceDate.toISOString()]
      );
      return new Set(result.rows.map((row) => row.user_id));
    }
  };

  const productRepo = {
    async upsertProduct(product) {
      const result = await pool.query(
        `
        INSERT INTO products (
          product_inner_code, product_code, product_name, spec, grade, price, quantity,
          unit, vip_price, origin_price, origin, manufacturer, promotion, last_synced_at, sync_status
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
          sync_status = EXCLUDED.sync_status
        RETURNING *;
        `,
        [
          product.product_inner_code ?? null,
          String(product.product_code),
          String(product.product_name ?? ''),
          product.spec ?? null,
          product.grade ?? null,
          Number(product.price ?? 0),
          product.quantity != null ? toSafeInteger(product.quantity, 0) : null,
          product.unit ?? null,
          product.vip_price != null ? Number(product.vip_price) : null,
          product.origin_price != null ? Number(product.origin_price) : null,
          product.origin ?? null,
          product.manufacturer ?? null,
          product.promotion ?? null,
          nowIso(),
          product.sync_status ?? 'SYNCED'
        ]
      );

      return result.rows[0] ?? null;
    },

    async getProduct(productCode) {
      const result = await pool.query('SELECT * FROM products WHERE product_code = $1 LIMIT 1;', [String(productCode)]);
      return result.rows[0] ?? null;
    },

    async listProducts(limit = 100, offset = 0) {
      const result = await pool.query(
        'SELECT * FROM products ORDER BY last_synced_at DESC LIMIT $1 OFFSET $2;',
        [Math.max(1, toSafeInteger(limit, 100)), Math.max(0, toSafeInteger(offset, 0))]
      );
      return result.rows;
    },

    async countProducts() {
      const result = await pool.query('SELECT COUNT(*) AS count FROM products;');
      return toSafeInteger(result.rows[0]?.count, 0);
    },

    async deleteProduct(productCode) {
      const result = await pool.query('DELETE FROM products WHERE product_code = $1 RETURNING *;', [String(productCode)]);
      return result.rows[0] ?? null;
    }
  };

  return {
    mode: 'postgres',
    eslCatalogRepo,
    bindingRepo,
    statusRepo,
    commandLogRepo,
    deadLetterRepo,
    userRepo,
    refreshTokenRepo,
    productRepo,
    async ready() {
      try {
        await pool.query('SELECT 1;');
        const result = await pool.query(
          `
          SELECT table_name
          FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = ANY($1::text[]);
          `,
          [REQUIRED_POSTGRES_TABLES]
        );

        return result.rows.length === REQUIRED_POSTGRES_TABLES.length;
      } catch {
        return false;
      }
    },
    async close() {
      await pool.end();
      poolRegistry.delete(databaseUrl);
    }
  };
}
