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
    jobsEnabled: (process.env.ESL_ENABLE_JOBS ?? 'true').toLowerCase() !== 'false',
    maxRetryAttempts: Number(process.env.ESL_MAX_RETRY_ATTEMPTS ?? 3),
    retryBaseDelayMs: Number(process.env.ESL_RETRY_BASE_DELAY_MS ?? 400)
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
