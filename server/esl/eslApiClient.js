import { assertEslConfig } from '../config.js';
import { withSignedPayload, withSignedQuery } from './signer.js';

function buildRequestId() {
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `ESL-${Date.now()}-${random}`;
}

function safeParseJson(raw) {
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function normalizeResult(parsedBody, statusCode, requestId) {
  if (Array.isArray(parsedBody)) {
    return {
      success: true,
      error_code: 0,
      error_msg: '',
      request_id: requestId,
      status_code: statusCode,
      received_at: new Date().toISOString(),
      data: parsedBody
    };
  }

  if (parsedBody && typeof parsedBody === 'object') {
    const hasVendorError = typeof parsedBody.error_code !== 'undefined';
    const errorCode = hasVendorError ? Number(parsedBody.error_code) : 0;
    const success = statusCode >= 200 && statusCode < 300 && (!hasVendorError || errorCode === 0);

    return {
      success,
      error_code: hasVendorError ? errorCode : success ? 0 : statusCode,
      error_msg: parsedBody.error_msg ?? (success ? '' : `HTTP ${statusCode}`),
      request_id: requestId,
      status_code: statusCode,
      received_at: new Date().toISOString(),
      data: parsedBody
    };
  }

  const success = statusCode >= 200 && statusCode < 300;

  return {
    success,
    error_code: success ? 0 : statusCode,
    error_msg: success ? '' : `HTTP ${statusCode}`,
    request_id: requestId,
    status_code: statusCode,
    received_at: new Date().toISOString(),
    data: parsedBody
  };
}

export class EslApiClient {
  constructor(config, { metrics = null, logger = console } = {}) {
    // Cliente HTTP único para API ESL, garantindo assinatura, timeout,
    // observabilidade e um contrato de resposta estável para o restante do BFF.
    this.config = config;
    this.metrics = metrics;
    this.logger = logger;
  }

  async get(path, query = {}, options = {}) {
    return this.request('GET', path, query, null, options);
  }

  async post(path, body = {}, options = {}) {
    return this.request('POST', path, null, body, options);
  }

  async request(method, path, query, body, options = {}) {
    assertEslConfig(this.config);

    const includeStoreCode = options.includeStoreCode ?? true;
    const requestId = buildRequestId();
    const startedAt = Date.now();
    const controller = new AbortController();
    const requestTimeoutMs =
      Number.isFinite(Number(options.requestTimeoutMs)) && Number(options.requestTimeoutMs) > 0
        ? Number(options.requestTimeoutMs)
        : this.config.requestTimeoutMs;
    const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);

    // A API do fornecedor exige o formato /api/{i_client_id}/...
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const baseUrl = this.config.eslHost.endsWith('/') ? this.config.eslHost.slice(0, -1) : this.config.eslHost;
    const url = new URL(`${baseUrl}/api/${this.config.clientId}${normalizedPath}`);

    if (query && typeof query === 'object') {
      // Inclui assinatura também em query string para endpoints GET.
      const signedQuery = withSignedQuery(query, this.config, { includeStoreCode });

      for (const [key, value] of Object.entries(signedQuery)) {
        if (value === undefined || value === null || value === '') {
          continue;
        }

        url.searchParams.set(key, String(value));
      }
    }

    const init = {
      method,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      }
    };

    if (body && method !== 'GET') {
      // Inclui store_code, is_base64 e sign no corpo dos endpoints POST.
      const signedBody = withSignedPayload(body, this.config, { includeStoreCode });
      init.body = JSON.stringify(signedBody);
    }

    try {
      const response = await fetch(url, init);
      const rawText = await response.text();
      const parsedBody = safeParseJson(rawText) ?? rawText;

      const durationSeconds = (Date.now() - startedAt) / 1000;
      const endpointLabel = `${method} ${normalizedPath}`;
      this.metrics?.trackVendorRequest?.(endpointLabel, durationSeconds, response.status, response.status >= 400 ? 'vendor_http_error' : null);

      // 5xx do fornecedor é tratado como falha de infraestrutura/upstream;
      // respostas 2xx/4xx seguem para normalização e lógica de domínio.
      if (response.status >= 500) {
        const error = new Error(`ESL upstream HTTP ${response.status}`);
        error.code = 'ESL_UPSTREAM_5XX';
        error.statusCode = response.status;
        error.payload = parsedBody;
        throw error;
      }

      return normalizeResult(parsedBody, response.status, requestId);
    } catch (error) {
      const durationSeconds = (Date.now() - startedAt) / 1000;
      const endpointLabel = `${method} ${normalizedPath}`;
      this.metrics?.trackVendorRequest?.(endpointLabel, durationSeconds, Number(error?.statusCode ?? 500), error?.code ?? 'vendor_runtime_error');
      this.logger.error({ err: error, endpoint: endpointLabel, request_id: requestId }, 'Vendor request failed');
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }
}
