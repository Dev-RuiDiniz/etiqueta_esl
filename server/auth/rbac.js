const READ_ROLES = ['viewer', 'operador', 'admin'];
const WRITE_ROLES = ['operador', 'admin'];
const ADMIN_ROLES = ['admin'];

export function resolveRequiredRoles(method, pathname) {
  if (pathname === '/api/esl/jobs/run') {
    return ADMIN_ROLES;
  }

  if (pathname === '/api/esl/dead-letters') {
    return ADMIN_ROLES;
  }

  if (pathname === '/api/esl/audit') {
    return ['operador', 'admin'];
  }

  if (method === 'GET') {
    return READ_ROLES;
  }

  return WRITE_ROLES;
}

export function isRoleAllowed(role, allowedRoles) {
  if (!role) {
    return false;
  }

  return allowedRoles.includes(role);
}

export function extractBearerToken(authorizationHeader) {
  if (!authorizationHeader) {
    return null;
  }

  const [scheme, token] = String(authorizationHeader).split(' ');

  if (!scheme || !token || scheme.toLowerCase() !== 'bearer') {
    return null;
  }

  return token;
}
