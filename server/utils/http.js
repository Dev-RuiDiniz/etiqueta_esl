const JSON_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8'
};

// Helpers HTTP reaproveitáveis para reduzir boilerplate nas rotas.
export function setCorsHeaders(res, req, allowedOrigins = []) {
  const origin = req?.headers?.origin ?? '';

  // Em dev (lista vazia) ou quando a origem está na lista: echoar o header.
  // Em produção sem correspondência: omitir — o browser bloqueia automaticamente.
  const allowed =
    allowedOrigins.length === 0 ||
    allowedOrigins.includes(origin) ||
    allowedOrigins.includes('*');

  if (allowed && origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  } else if (allowedOrigins.length === 0) {
    // Fallback de desenvolvimento sem ALLOWED_ORIGINS configurado.
    res.setHeader('Access-Control-Allow-Origin', '*');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Request-ID');
}

export function sendJson(res, statusCode, body) {
  res.writeHead(statusCode, JSON_HEADERS);
  res.end(JSON.stringify(body));
}

export function sendNoContent(res) {
  res.writeHead(204);
  res.end();
}

export async function readJsonBody(req, maxBytes = 1024 * 1024) {
  const chunks = [];
  let totalBytes = 0;

  for await (const chunk of req) {
    const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    totalBytes += buf.byteLength;

    if (totalBytes > maxBytes) {
      req.socket?.destroy();
      const error = new Error(`Payload excede o limite de ${Math.round(maxBytes / 1024)} KB.`);
      error.code = 'PAYLOAD_TOO_LARGE';
      error.statusCode = 413;
      throw error;
    }

    chunks.push(buf);
  }

  if (chunks.length === 0) {
    return {};
  }

  const raw = Buffer.concat(chunks).toString('utf8').trim();

  if (!raw) {
    return {};
  }

  try {
    return JSON.parse(raw);
  } catch {
    const error = new Error('Invalid JSON body');
    error.code = 'INVALID_JSON';
    throw error;
  }
}

export function pickNumber(raw, fallback) {
  const value = Number(raw);
  return Number.isFinite(value) ? value : fallback;
}
