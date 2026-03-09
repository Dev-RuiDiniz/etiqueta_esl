import { extractBearerToken, isRoleAllowed, resolveRequiredRoles } from './rbac.js';

export async function authorizeRequest(req, pathname, config, authService) {
  if (!config.authEnabled) {
    return null;
  }

  if (!pathname.startsWith('/api/esl/')) {
    return null;
  }

  const token = extractBearerToken(req.headers.authorization);

  if (!token) {
    const error = new Error('Missing or invalid Authorization header.');
    error.code = 'AUTH_MISSING_TOKEN';
    error.statusCode = 401;
    throw error;
  }

  const user = await authService.authenticateAccessToken(token);
  const allowedRoles = resolveRequiredRoles(req.method, pathname);

  if (!isRoleAllowed(user.role, allowedRoles)) {
    const error = new Error('Forbidden for current user role.');
    error.code = 'AUTH_FORBIDDEN';
    error.statusCode = 403;
    throw error;
  }

  return user;
}
