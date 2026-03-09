const JSON_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8'
};

// Helpers HTTP reaproveitáveis para reduzir boilerplate nas rotas.
export function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
}

export function sendJson(res, statusCode, body) {
  res.writeHead(statusCode, JSON_HEADERS);
  res.end(JSON.stringify(body));
}

export function sendNoContent(res) {
  res.writeHead(204);
  res.end();
}

export async function readJsonBody(req) {
  const chunks = [];

  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
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
