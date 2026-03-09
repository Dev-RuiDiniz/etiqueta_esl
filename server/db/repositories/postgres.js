import { checkPostgresReadiness, createPostgresPool, withTransaction } from '../postgres/client.js';

function safeJson(value) {
  return value == null ? null : JSON.stringify(value);
}

export function createPostgresRepositories(databaseUrl) {
  const pool = createPostgresPool(databaseUrl);

  const bindingRepo = {
    async upsertBinding(binding) {
      const query = `
        INSERT INTO esl_bindings (esl_code, product_code, template_id, binding_status)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (esl_code)
        DO UPDATE SET
          product_code = EXCLUDED.product_code,
          template_id = EXCLUDED.template_id,
          binding_status = EXCLUDED.binding_status,
          updated_at = NOW()
        RETURNING esl_code, product_code, template_id, bound_at, updated_at, binding_status;
      `;

      const result = await pool.query(query, [binding.esl_code, binding.product_code, binding.template_id ?? null, binding.binding_status ?? 'BOUND']);
      return result.rows[0] ?? null;
    },

    async removeBinding(eslCode) {
      const query = `
        DELETE FROM esl_bindings
        WHERE esl_code = $1
        RETURNING esl_code, product_code, template_id, bound_at, updated_at, 'UNBOUND'::TEXT AS binding_status;
      `;

      const result = await pool.query(query, [eslCode]);
      return result.rows[0] ?? null;
    },

    async getBindingByEslCode(eslCode) {
      const query = `
        SELECT esl_code, product_code, template_id, bound_at, updated_at, binding_status
        FROM esl_bindings
        WHERE esl_code = $1;
      `;

      const result = await pool.query(query, [eslCode]);
      return result.rows[0] ?? null;
    },

    async listBindings() {
      const query = `
        SELECT esl_code, product_code, template_id, bound_at, updated_at, binding_status
        FROM esl_bindings
        ORDER BY updated_at DESC;
      `;

      const result = await pool.query(query);
      return result.rows;
    },

    async listBindingsByProductCode(productCode) {
      const query = `
        SELECT esl_code, product_code, template_id, bound_at, updated_at, binding_status
        FROM esl_bindings
        WHERE product_code = $1
        ORDER BY updated_at DESC;
      `;

      const result = await pool.query(query, [productCode]);
      return result.rows;
    },

    async countBindings() {
      const result = await pool.query('SELECT COUNT(*)::INT AS count FROM esl_bindings;');
      return result.rows[0]?.count ?? 0;
    }
  };

  const statusRepo = {
    async upsertStatusSnapshots(snapshots) {
      if (!Array.isArray(snapshots) || snapshots.length === 0) {
        return;
      }

      await withTransaction(pool, async (client) => {
        for (const item of snapshots) {
          if (!item.esl_code) {
            continue;
          }

          await client.query(
            `
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
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
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
                seen_at = NOW();
            `,
            [
              item.esl_code,
              item.esl_version ?? null,
              item.action ?? null,
              Number(item.online ?? 0),
              Number(item.esl_battery ?? 0),
              item.battery_percent == null ? null : Number(item.battery_percent),
              item.product_code ?? null,
              item.ap_code ?? null,
              item.esltype_code ?? null,
              item.created_at ?? null,
              item.updated_at ?? null
            ]
          );
        }
      });
    },

    async getStatusSnapshot(eslCode) {
      const query = `
        SELECT esl_code, esl_version, action, online, esl_battery, battery_percent, product_code, ap_code, esltype_code, created_at, updated_at, seen_at
        FROM esl_status_snapshots
        WHERE esl_code = $1;
      `;

      const result = await pool.query(query, [eslCode]);
      return result.rows[0] ?? null;
    },

    async listStatusSnapshots() {
      const query = `
        SELECT esl_code, esl_version, action, online, esl_battery, battery_percent, product_code, ap_code, esltype_code, created_at, updated_at, seen_at
        FROM esl_status_snapshots
        ORDER BY seen_at DESC;
      `;

      const result = await pool.query(query);
      return result.rows;
    },

    async getStatusSummary() {
      const result = await pool.query(`
        SELECT
          COUNT(*) FILTER (WHERE online = 1)::INT AS online_count,
          COUNT(*) FILTER (WHERE online <> 1)::INT AS offline_count,
          COUNT(*)::INT AS total_count
        FROM esl_status_snapshots;
      `);

      const row = result.rows[0] ?? { online_count: 0, offline_count: 0, total_count: 0 };

      return {
        online_count: row.online_count,
        offline_count: row.offline_count,
        total_count: row.total_count,
        updated_at: new Date().toISOString()
      };
    }
  };

  const commandLogRepo = {
    async addCommandLog(entry) {
      const query = `
        INSERT INTO esl_command_log (
          id,
          operation,
          request_id,
          success,
          error_code,
          error_msg,
          payload,
          response,
          meta
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb, $9::jsonb)
        RETURNING id, created_at, operation, request_id, success, error_code, error_msg, payload, response, meta;
      `;

      const id = entry.id ?? `CMD-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
      const result = await pool.query(query, [
        id,
        entry.operation,
        entry.request_id ?? null,
        Boolean(entry.success),
        entry.error_code ?? null,
        entry.error_msg ?? null,
        safeJson(entry.payload ?? null),
        safeJson(entry.response ?? null),
        safeJson(entry.meta ?? null)
      ]);

      return result.rows[0] ?? null;
    },

    async listCommandLogs(limit = 100) {
      const query = `
        SELECT id, created_at, operation, request_id, success, error_code, error_msg, payload, response, meta
        FROM esl_command_log
        ORDER BY created_at DESC
        LIMIT $1;
      `;

      const result = await pool.query(query, [Math.max(1, limit)]);
      return result.rows;
    },

    async findCommandByRequestId(requestId) {
      const query = `
        SELECT id, created_at, operation, request_id, success, error_code, error_msg, payload, response, meta
        FROM esl_command_log
        WHERE request_id = $1
        ORDER BY created_at DESC
        LIMIT 1;
      `;

      const result = await pool.query(query, [requestId]);
      return result.rows[0] ?? null;
    },

    async purgeOlderThan(beforeIsoDate) {
      const result = await pool.query('DELETE FROM esl_command_log WHERE created_at < $1', [beforeIsoDate]);
      return result.rowCount ?? 0;
    },

    async countLogs() {
      const result = await pool.query('SELECT COUNT(*)::INT AS count FROM esl_command_log');
      return result.rows[0]?.count ?? 0;
    }
  };

  const deadLetterRepo = {
    async addDeadLetter(entry) {
      const query = `
        INSERT INTO dead_letters (
          id,
          operation,
          payload,
          error,
          attempts,
          meta,
          status,
          last_error
        )
        VALUES ($1, $2, $3::jsonb, $4::jsonb, $5, $6::jsonb, $7, $8)
        RETURNING id, created_at, operation, payload, error, attempts, meta, status, last_error, processed_at;
      `;

      const id = entry.id ?? `DLQ-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
      const result = await pool.query(query, [
        id,
        entry.operation,
        safeJson(entry.payload ?? null),
        safeJson(entry.error ?? null),
        entry.attempts ?? 0,
        safeJson(entry.meta ?? null),
        entry.status ?? 'PENDING',
        entry.last_error ?? null
      ]);

      return result.rows[0] ?? null;
    },

    async listDeadLetters(limit = 100) {
      const query = `
        SELECT id, created_at, operation, payload, error, attempts, meta, status, last_error, processed_at
        FROM dead_letters
        ORDER BY created_at DESC
        LIMIT $1;
      `;

      const result = await pool.query(query, [Math.max(1, limit)]);
      return result.rows;
    },

    async removeDeadLetter(deadLetterId) {
      const result = await pool.query('DELETE FROM dead_letters WHERE id = $1 RETURNING id', [deadLetterId]);
      return result.rows[0] ?? null;
    },

    async markDeadLetterStatus(deadLetterId, status, lastError = null) {
      const query = `
        UPDATE dead_letters
        SET status = $2,
            last_error = $3,
            processed_at = CASE WHEN $2 = 'PROCESSED' THEN NOW() ELSE NULL END
        WHERE id = $1
        RETURNING id, created_at, operation, payload, error, attempts, meta, status, last_error, processed_at;
      `;

      const result = await pool.query(query, [deadLetterId, status, lastError]);
      return result.rows[0] ?? null;
    },

    async purgeOlderThan(beforeIsoDate) {
      const result = await pool.query('DELETE FROM dead_letters WHERE created_at < $1', [beforeIsoDate]);
      return result.rowCount ?? 0;
    },

    async countDeadLetters() {
      const result = await pool.query('SELECT COUNT(*)::INT AS count FROM dead_letters');
      return result.rows[0]?.count ?? 0;
    }
  };

  const userRepo = {
    async createUser(user) {
      const query = `
        INSERT INTO users (id, email, password_hash, role)
        VALUES ($1, $2, $3, $4)
        RETURNING id, email, password_hash, role, created_at, updated_at;
      `;

      const id = user.id ?? `USR-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
      const result = await pool.query(query, [id, user.email, user.password_hash, user.role]);
      return result.rows[0] ?? null;
    },

    async updateUser(userId, updates) {
      const query = `
        UPDATE users
        SET email = COALESCE($2, email),
            password_hash = COALESCE($3, password_hash),
            role = COALESCE($4, role),
            updated_at = NOW()
        WHERE id = $1
        RETURNING id, email, password_hash, role, created_at, updated_at;
      `;

      const result = await pool.query(query, [userId, updates.email ?? null, updates.password_hash ?? null, updates.role ?? null]);
      return result.rows[0] ?? null;
    },

    async findByEmail(email) {
      const result = await pool.query('SELECT id, email, password_hash, role, created_at, updated_at FROM users WHERE email = $1', [email]);
      return result.rows[0] ?? null;
    },

    async findById(userId) {
      const result = await pool.query('SELECT id, email, password_hash, role, created_at, updated_at FROM users WHERE id = $1', [userId]);
      return result.rows[0] ?? null;
    },

    async listUsers(limit = 100) {
      const result = await pool.query(
        'SELECT id, email, password_hash, role, created_at, updated_at FROM users ORDER BY created_at DESC LIMIT $1',
        [Math.max(1, limit)]
      );

      return result.rows;
    }
  };

  const refreshTokenRepo = {
    async createRefreshToken(entry) {
      const query = `
        INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at, revoked)
        VALUES ($1, $2, $3, $4, FALSE)
        RETURNING id, user_id, token_hash, expires_at, revoked, created_at, revoked_at;
      `;

      const id = entry.id ?? `RTK-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
      const result = await pool.query(query, [id, entry.user_id, entry.token_hash, entry.expires_at]);
      return result.rows[0] ?? null;
    },

    async findByTokenHash(tokenHash) {
      const result = await pool.query(
        'SELECT id, user_id, token_hash, expires_at, revoked, created_at, revoked_at FROM refresh_tokens WHERE token_hash = $1',
        [tokenHash]
      );

      return result.rows[0] ?? null;
    },

    async revokeToken(tokenHash) {
      const result = await pool.query(
        `
          UPDATE refresh_tokens
          SET revoked = TRUE,
              revoked_at = NOW()
          WHERE token_hash = $1
          RETURNING id, user_id, token_hash, expires_at, revoked, created_at, revoked_at;
        `,
        [tokenHash]
      );

      return result.rows[0] ?? null;
    },

    async revokeAllByUserId(userId) {
      const result = await pool.query(
        `
          UPDATE refresh_tokens
          SET revoked = TRUE,
              revoked_at = NOW()
          WHERE user_id = $1 AND revoked = FALSE;
        `,
        [userId]
      );

      return result.rowCount ?? 0;
    }
  };

  return {
    mode: 'postgres',
    pool,
    bindingRepo,
    statusRepo,
    commandLogRepo,
    deadLetterRepo,
    userRepo,
    refreshTokenRepo,
    async ready() {
      const alive = await checkPostgresReadiness(pool);
      if (!alive) {
        return false;
      }

      const requiredTables = ['esl_bindings', 'esl_status_snapshots', 'esl_command_log', 'dead_letters', 'users', 'refresh_tokens'];
      for (const tableName of requiredTables) {
        const result = await pool.query('SELECT to_regclass($1) AS table_ref', [tableName]);
        if (!result.rows[0]?.table_ref) {
          return false;
        }
      }

      return true;
    },
    async close() {
      await pool.end();
    }
  };
}
