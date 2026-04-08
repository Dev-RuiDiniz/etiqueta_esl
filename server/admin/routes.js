import { USER_ROLES } from '../auth/rbac.js';
import { sendJson } from '../utils/http.js';
import { requireString } from '../utils/validate.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function commandResult(data, requestId = `ADMIN-${Date.now()}`) {
  return {
    success: true,
    error_code: 0,
    error_msg: '',
    request_id: requestId,
    received_at: new Date().toISOString(),
    data
  };
}

function normalizeLimit(raw, fallback = 100, max = 500) {
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.min(Math.floor(parsed), max);
}

function normalizeRole(value) {
  if (typeof value === 'undefined' || value == null || value === '') {
    return null;
  }

  const role = String(value).trim().toLowerCase();

  if (!USER_ROLES.includes(role)) {
    const error = new Error("O campo 'role' tem formato inválido.");
    error.code = 'VALIDATION_ERROR';
    error.field = 'role';
    error.statusCode = 422;
    throw error;
  }

  return role;
}

export function createAdminRoutes({ adminService }) {
  return async function adminRoute(req, res, url, body) {
    const { pathname, searchParams } = url;

    if (req.method === 'GET' && pathname === '/api/admin/dashboard') {
      const summary = await adminService.getDashboardSummary();
      sendJson(res, 200, commandResult(summary, 'ADMIN-DASH'));
      return true;
    }

    if (req.method === 'GET' && pathname === '/api/admin/users') {
      const limit = normalizeLimit(searchParams.get('limit'), 100, 500);
      const search = String(searchParams.get('search') ?? '').trim();
      const role = normalizeRole(searchParams.get('role'));
      const users = await adminService.listUsers({ limit, search, role });
      sendJson(res, 200, commandResult(users, 'ADMIN-USERS-LIST'));
      return true;
    }

    if (req.method === 'POST' && pathname === '/api/admin/users') {
      const email = requireString(body.email, 'email', { maxLen: 160, pattern: EMAIL_PATTERN }).toLowerCase();
      const password = requireString(body.password, 'password', { minLen: 8, maxLen: 128 });
      const role = normalizeRole(body.role);
      const created = await adminService.createUser({
        actor: req.user,
        email,
        password,
        role
      });
      sendJson(res, 200, commandResult(created, 'ADMIN-USERS-CREATE'));
      return true;
    }

    const userMatch = pathname.match(/^\/api\/admin\/users\/([^/]+)$/);
    if (req.method === 'PATCH' && userMatch) {
      const userId = decodeURIComponent(userMatch[1]);
      const updates = {};

      if (typeof body.email !== 'undefined') {
        updates.email = requireString(body.email, 'email', { maxLen: 160, pattern: EMAIL_PATTERN }).toLowerCase();
      }

      if (typeof body.role !== 'undefined') {
        updates.role = normalizeRole(body.role);
      }

      const updated = await adminService.updateUser({
        actor: req.user,
        userId,
        ...updates
      });
      sendJson(res, 200, commandResult(updated, 'ADMIN-USERS-UPDATE'));
      return true;
    }

    const resetPasswordMatch = pathname.match(/^\/api\/admin\/users\/([^/]+)\/reset-password$/);
    if (req.method === 'POST' && resetPasswordMatch) {
      const userId = decodeURIComponent(resetPasswordMatch[1]);
      const password = requireString(body.password, 'password', { minLen: 8, maxLen: 128 });
      const result = await adminService.resetPassword({
        actor: req.user,
        userId,
        password
      });
      sendJson(res, 200, commandResult(result, 'ADMIN-USERS-RESET'));
      return true;
    }

    const revokeSessionsMatch = pathname.match(/^\/api\/admin\/users\/([^/]+)\/revoke-sessions$/);
    if (req.method === 'POST' && revokeSessionsMatch) {
      const userId = decodeURIComponent(revokeSessionsMatch[1]);
      const result = await adminService.revokeSessions({
        actor: req.user,
        userId
      });
      sendJson(res, 200, commandResult(result, 'ADMIN-USERS-REVOKE'));
      return true;
    }

    return false;
  };
}
