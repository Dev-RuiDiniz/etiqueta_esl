import { sendJson } from '../utils/http.js';

// Rate limiting em memória para o endpoint de login.
// Estrutura: ip → { count: number, resetAt: number }
const loginAttempts = new Map();
const LOGIN_MAX_ATTEMPTS = 10;
const LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15 minutos

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return String(forwarded).split(',')[0].trim();
  }
  return String(req.socket?.remoteAddress ?? 'unknown');
}

function checkRateLimit(ip) {
  const now = Date.now();
  const entry = loginAttempts.get(ip);

  if (!entry || now >= entry.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + LOGIN_WINDOW_MS });
    return { blocked: false };
  }

  if (entry.count >= LOGIN_MAX_ATTEMPTS) {
    const retryAfterSecs = Math.ceil((entry.resetAt - now) / 1000);
    return { blocked: true, retryAfterSecs };
  }

  entry.count += 1;
  return { blocked: false };
}

function commandResult(data) {
  return {
    success: true,
    error_code: 0,
    error_msg: '',
    request_id: `AUTH-${Date.now()}`,
    received_at: new Date().toISOString(),
    data
  };
}

export function createAuthRoutes({ authService }) {
  return async function authRoute(req, res, pathname, body) {
    if (req.method === 'POST' && pathname === '/api/auth/login') {
      const ip = getClientIp(req);
      const rateCheck = checkRateLimit(ip);

      if (rateCheck.blocked) {
        res.setHeader('Retry-After', String(rateCheck.retryAfterSecs));
        sendJson(res, 429, {
          success: false,
          error_code: 429,
          error_msg: `Muitas tentativas de login. Aguarde ${rateCheck.retryAfterSecs} segundos.`,
          request_id: `AUTH-${Date.now()}`,
          received_at: new Date().toISOString(),
          data: null
        });
        return true;
      }

      const email = String(body.email ?? '').trim().toLowerCase();
      const password = String(body.password ?? '');

      if (!email || !password) {
        sendJson(res, 400, {
          success: false,
          error_code: 400,
          error_msg: 'email e password são obrigatórios.',
          request_id: `AUTH-${Date.now()}`,
          received_at: new Date().toISOString(),
          data: null
        });
        return true;
      }

      const tokenPair = await authService.login({ email, password });
      sendJson(res, 200, commandResult(tokenPair));
      return true;
    }

    if (req.method === 'POST' && pathname === '/api/auth/refresh') {
      const refreshToken = String(body.refresh_token ?? '').trim();

      if (!refreshToken) {
        sendJson(res, 400, {
          success: false,
          error_code: 400,
          error_msg: 'refresh_token é obrigatório.',
          request_id: `AUTH-${Date.now()}`,
          received_at: new Date().toISOString(),
          data: null
        });
        return true;
      }

      const tokenPair = await authService.refresh({ refreshToken });
      sendJson(res, 200, commandResult(tokenPair));
      return true;
    }

    if (req.method === 'POST' && pathname === '/api/auth/logout') {
      const refreshToken = String(body.refresh_token ?? '').trim();

      if (!refreshToken) {
        sendJson(res, 400, {
          success: false,
          error_code: 400,
          error_msg: 'refresh_token é obrigatório.',
          request_id: `AUTH-${Date.now()}`,
          received_at: new Date().toISOString(),
          data: null
        });
        return true;
      }

      await authService.logout({ refreshToken });
      sendJson(res, 200, commandResult({ logged_out: true }));
      return true;
    }

    return false;
  };
}
