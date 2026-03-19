function asBoolean(value, defaultValue = false) {
  if (typeof value === 'undefined') {
    return defaultValue;
  }

  const normalized = String(value).trim().toLowerCase();
  return normalized === 'true' || normalized === '1' || normalized === 'yes';
}

function asPositiveInt(value, fallback) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.floor(parsed);
}

export function loadConfig() {
  // Centraliza variáveis da integração ESL/BFF.
  // Todos os módulos dependem deste objeto para evitar configuração espalhada.
  return {
    port: Number(process.env.BFF_PORT ?? 8787),
    eslHost: (process.env.ESL_HOST ?? '').trim(),
    clientId: (process.env.ESL_CLIENT_ID ?? '').trim(),
    sign: (process.env.ESL_SIGN ?? '').trim(),
    storeCode: (process.env.ESL_STORE_CODE ?? '001').trim(),
    isBase64: (process.env.ESL_IS_BASE64 ?? '0').trim(),
    requestTimeoutMs: Number(process.env.ESL_HTTP_TIMEOUT_MS ?? 15000),
    templateCacheTtlMs: Number(process.env.ESL_TEMPLATE_CACHE_TTL_MS ?? 300000),
    refreshTriggerIntervalMs: Number(process.env.ESL_REFRESH_TRIGGER_INTERVAL_MS ?? 20000),
    statusPollingIntervalMs: Number(process.env.ESL_STATUS_POLL_INTERVAL_MS ?? 60000),
    productSyncIntervalMs: Number(process.env.ESL_PRODUCT_SYNC_INTERVAL_MS ?? 10000),
    reconciliationIntervalMs: Number(process.env.ESL_RECONCILIATION_INTERVAL_MS ?? 3600000),
    deadLetterIntervalMs: Number(process.env.ESL_DEAD_LETTER_INTERVAL_MS ?? 60000),
    retentionIntervalMs: Number(process.env.ESL_RETENTION_INTERVAL_MS ?? 43200000),
    jobsEnabled: (process.env.ESL_ENABLE_JOBS ?? 'true').toLowerCase() !== 'false',
    maxRetryAttempts: Number(process.env.ESL_MAX_RETRY_ATTEMPTS ?? 3),
    retryBaseDelayMs: Number(process.env.ESL_RETRY_BASE_DELAY_MS ?? 400),

    persistenceMode: (process.env.BFF_PERSISTENCE_MODE ?? 'sqlite').trim().toLowerCase(),
    dataDir: (process.env.BFF_DATA_DIR ?? '').trim(),
    backupEnabled: asBoolean(process.env.BFF_BACKUP_ENABLED, true),
    backupIntervalMs: asPositiveInt(process.env.BFF_BACKUP_INTERVAL_MS, 24 * 60 * 60 * 1000),
    backupRetentionCount: asPositiveInt(process.env.BFF_BACKUP_RETENTION_COUNT, 7),

    authEnabled: asBoolean(process.env.BFF_AUTH_ENABLED, false),
    jwtAccessSecret: (process.env.JWT_ACCESS_SECRET ?? '').trim(),
    jwtRefreshSecret: (process.env.JWT_REFRESH_SECRET ?? '').trim(),
    jwtAccessTtl: (process.env.JWT_ACCESS_TTL ?? '15m').trim(),
    jwtRefreshTtl: (process.env.JWT_REFRESH_TTL ?? '7d').trim(),
    authDefaultAdminEmail: (process.env.BFF_DEFAULT_ADMIN_EMAIL ?? 'admin@etiqueta.local').trim(),
    authDefaultAdminPassword: (process.env.BFF_DEFAULT_ADMIN_PASSWORD ?? 'Admin@123').trim(),

    allowedOrigins: (process.env.ALLOWED_ORIGINS ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),

    metricsEnabled: asBoolean(process.env.METRICS_ENABLED, true),
    logLevel: (process.env.LOG_LEVEL ?? 'info').trim().toLowerCase(),

    commandLogRetentionDays: Number(process.env.ESL_COMMAND_LOG_RETENTION_DAYS ?? 30),
    deadLetterRetentionDays: Number(process.env.ESL_DEAD_LETTER_RETENTION_DAYS ?? 30)
  };
}

export function getMissingEslConfig(config) {
  const missing = [];

  if (!config.eslHost) missing.push('ESL_HOST');
  if (!config.clientId) missing.push('ESL_CLIENT_ID');
  if (!config.sign) missing.push('ESL_SIGN');
  if (!config.storeCode) missing.push('ESL_STORE_CODE');

  return missing;
}

export function assertEslConfig(config) {
  // Valida credenciais mínimas antes de chamar a API do fornecedor.
  const missing = getMissingEslConfig(config);

  if (missing.length > 0) {
    const message = `Missing ESL config: ${missing.join(', ')}`;
    const error = new Error(message);
    error.code = 'ESL_CONFIG_MISSING';
    error.missing = missing;
    throw error;
  }
}

export function assertAuthConfig(config) {
  if (!config.authEnabled) {
    return;
  }

  const missing = [];

  if (!config.jwtAccessSecret) {
    missing.push('JWT_ACCESS_SECRET');
  }

  if (!config.jwtRefreshSecret) {
    missing.push('JWT_REFRESH_SECRET');
  }

  if (missing.length === 0) {
    return;
  }

  const error = new Error(`Missing auth config: ${missing.join(', ')}`);
  error.code = 'AUTH_CONFIG_MISSING';
  error.missing = missing;
  throw error;
}

export function assertPersistenceConfig(config) {
  if (config.persistenceMode !== 'sqlite' && config.persistenceMode !== 'memory') {
    const error = new Error(`Unsupported persistence mode: ${config.persistenceMode}`);
    error.code = 'PERSISTENCE_MODE_UNSUPPORTED';
    throw error;
  }

  if (config.backupIntervalMs <= 0) {
    const error = new Error('BFF_BACKUP_INTERVAL_MS must be greater than zero.');
    error.code = 'BACKUP_CONFIG_INVALID';
    throw error;
  }

  if (config.backupRetentionCount <= 0) {
    const error = new Error('BFF_BACKUP_RETENTION_COUNT must be greater than zero.');
    error.code = 'BACKUP_CONFIG_INVALID';
    throw error;
  }

  if (config.persistenceMode === 'memory' && (process.env.NODE_ENV ?? '').trim().toLowerCase() === 'production') {
    const error = new Error('Memory persistence mode is restricted to development and tests.');
    error.code = 'PERSISTENCE_MODE_RESTRICTED';
    throw error;
  }
}
