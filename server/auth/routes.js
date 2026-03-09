import { sendJson } from '../utils/http.js';

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
      const email = String(body.email ?? '').trim().toLowerCase();
      const password = String(body.password ?? '');

      if (!email || !password) {
        sendJson(res, 400, {
          success: false,
          error_code: 400,
          error_msg: 'email e password sao obrigatorios.',
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
          error_msg: 'refresh_token e obrigatorio.',
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
          error_msg: 'refresh_token e obrigatorio.',
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
