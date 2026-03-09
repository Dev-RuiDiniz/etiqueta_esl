function buildId(prefix) {
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix}-${Date.now()}-${random}`;
}

export function createMemoryRepositories() {
  const bindingsByEslCode = new Map();
  const snapshotsByEslCode = new Map();
  const commandLogs = [];
  const deadLetters = [];
  const usersById = new Map();
  const usersByEmail = new Map();
  const refreshTokensByHash = new Map();

  const bindingRepo = {
    async upsertBinding(binding) {
      const now = new Date().toISOString();
      const existing = bindingsByEslCode.get(binding.esl_code);

      const record = {
        esl_code: binding.esl_code,
        product_code: binding.product_code,
        template_id: binding.template_id ?? existing?.template_id ?? null,
        bound_at: existing?.bound_at ?? now,
        updated_at: now,
        binding_status: binding.binding_status ?? 'BOUND'
      };

      bindingsByEslCode.set(record.esl_code, record);
      return record;
    },

    async removeBinding(eslCode) {
      const existing = bindingsByEslCode.get(eslCode);
      if (!existing) {
        return null;
      }

      bindingsByEslCode.delete(eslCode);
      return {
        ...existing,
        binding_status: 'UNBOUND',
        updated_at: new Date().toISOString()
      };
    },

    async getBindingByEslCode(eslCode) {
      return bindingsByEslCode.get(eslCode) ?? null;
    },

    async listBindings() {
      return Array.from(bindingsByEslCode.values());
    },

    async listBindingsByProductCode(productCode) {
      return Array.from(bindingsByEslCode.values()).filter((item) => item.product_code === productCode);
    },

    async countBindings() {
      return bindingsByEslCode.size;
    }
  };

  const statusRepo = {
    async upsertStatusSnapshots(snapshots) {
      const now = new Date().toISOString();

      for (const item of snapshots) {
        if (!item.esl_code) {
          continue;
        }

        snapshotsByEslCode.set(item.esl_code, {
          ...item,
          updated_at: item.updated_at ?? now,
          seen_at: now
        });
      }
    },

    async getStatusSnapshot(eslCode) {
      return snapshotsByEslCode.get(eslCode) ?? null;
    },

    async listStatusSnapshots() {
      return Array.from(snapshotsByEslCode.values());
    },

    async getStatusSummary() {
      let online_count = 0;
      let offline_count = 0;

      for (const snapshot of snapshotsByEslCode.values()) {
        if (snapshot.online === 1 || snapshot.online === true) {
          online_count += 1;
        } else {
          offline_count += 1;
        }
      }

      return {
        online_count,
        offline_count,
        total_count: online_count + offline_count,
        updated_at: new Date().toISOString()
      };
    }
  };

  const commandLogRepo = {
    async addCommandLog(entry) {
      const record = {
        id: buildId('CMD'),
        created_at: new Date().toISOString(),
        ...entry
      };

      commandLogs.unshift(record);
      if (commandLogs.length > 10000) {
        commandLogs.length = 10000;
      }

      return record;
    },

    async listCommandLogs(limit = 100) {
      return commandLogs.slice(0, Math.max(1, limit));
    },

    async findCommandByRequestId(requestId) {
      return commandLogs.find((item) => item.request_id === requestId) ?? null;
    },

    async purgeOlderThan(beforeIsoDate) {
      const before = new Date(beforeIsoDate).getTime();
      const kept = commandLogs.filter((item) => new Date(item.created_at).getTime() >= before);
      const removed = commandLogs.length - kept.length;
      commandLogs.length = 0;
      commandLogs.push(...kept);
      return removed;
    },

    async countLogs() {
      return commandLogs.length;
    }
  };

  const deadLetterRepo = {
    async addDeadLetter(entry) {
      const record = {
        id: buildId('DLQ'),
        created_at: new Date().toISOString(),
        attempts: entry.attempts ?? 0,
        status: entry.status ?? 'PENDING',
        ...entry
      };

      deadLetters.unshift(record);
      if (deadLetters.length > 5000) {
        deadLetters.length = 5000;
      }

      return record;
    },

    async listDeadLetters(limit = 100) {
      return deadLetters.slice(0, Math.max(1, limit));
    },

    async removeDeadLetter(deadLetterId) {
      const index = deadLetters.findIndex((item) => item.id === deadLetterId);
      if (index === -1) {
        return null;
      }

      const [removed] = deadLetters.splice(index, 1);
      return removed;
    },

    async markDeadLetterStatus(deadLetterId, status, lastError = null) {
      const item = deadLetters.find((entry) => entry.id === deadLetterId);
      if (!item) {
        return null;
      }

      item.status = status;
      item.last_error = lastError;
      item.processed_at = status === 'PROCESSED' ? new Date().toISOString() : null;
      return item;
    },

    async purgeOlderThan(beforeIsoDate) {
      const before = new Date(beforeIsoDate).getTime();
      const kept = deadLetters.filter((item) => new Date(item.created_at).getTime() >= before);
      const removed = deadLetters.length - kept.length;
      deadLetters.length = 0;
      deadLetters.push(...kept);
      return removed;
    },

    async countDeadLetters() {
      return deadLetters.length;
    }
  };

  const userRepo = {
    async createUser(user) {
      if (usersByEmail.has(user.email)) {
        const error = new Error('User email already exists.');
        error.code = 'USER_DUPLICATE_EMAIL';
        throw error;
      }

      const now = new Date().toISOString();
      const record = {
        id: user.id ?? buildId('USR'),
        email: user.email,
        password_hash: user.password_hash,
        role: user.role,
        created_at: now,
        updated_at: now
      };

      usersById.set(record.id, record);
      usersByEmail.set(record.email, record.id);
      return record;
    },

    async updateUser(userId, updates) {
      const existing = usersById.get(userId);
      if (!existing) {
        return null;
      }

      const next = {
        ...existing,
        ...updates,
        updated_at: new Date().toISOString()
      };

      usersById.set(userId, next);
      usersByEmail.set(next.email, userId);
      return next;
    },

    async findByEmail(email) {
      const userId = usersByEmail.get(email);
      if (!userId) {
        return null;
      }

      return usersById.get(userId) ?? null;
    },

    async findById(userId) {
      return usersById.get(userId) ?? null;
    },

    async listUsers(limit = 100) {
      return Array.from(usersById.values()).slice(0, Math.max(1, limit));
    }
  };

  const refreshTokenRepo = {
    async createRefreshToken(entry) {
      const now = new Date().toISOString();
      const record = {
        id: entry.id ?? buildId('RTK'),
        user_id: entry.user_id,
        token_hash: entry.token_hash,
        expires_at: entry.expires_at,
        revoked: false,
        created_at: now,
        revoked_at: null
      };

      refreshTokensByHash.set(record.token_hash, record);
      return record;
    },

    async findByTokenHash(tokenHash) {
      return refreshTokensByHash.get(tokenHash) ?? null;
    },

    async revokeToken(tokenHash) {
      const existing = refreshTokensByHash.get(tokenHash);
      if (!existing) {
        return null;
      }

      const next = {
        ...existing,
        revoked: true,
        revoked_at: new Date().toISOString()
      };

      refreshTokensByHash.set(tokenHash, next);
      return next;
    },

    async revokeAllByUserId(userId) {
      let count = 0;
      const now = new Date().toISOString();

      for (const [hash, token] of refreshTokensByHash.entries()) {
        if (token.user_id === userId && token.revoked !== true) {
          refreshTokensByHash.set(hash, {
            ...token,
            revoked: true,
            revoked_at: now
          });
          count += 1;
        }
      }

      return count;
    }
  };

  return {
    mode: 'memory',
    bindingRepo,
    statusRepo,
    commandLogRepo,
    deadLetterRepo,
    userRepo,
    refreshTokenRepo,
    async ready() {
      return true;
    },
    async close() {
      return undefined;
    }
  };
}
