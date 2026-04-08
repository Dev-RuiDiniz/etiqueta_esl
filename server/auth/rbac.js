export const USER_ROLES = ['usuario', 'administrador', 'desenvolvedor'];

const ESL_READ_ROLES = USER_ROLES;
const ESL_WRITE_ROLES = USER_ROLES;
const USER_ADMIN_ROLES = ['administrador', 'desenvolvedor'];
const SUPER_ADMIN_ROLES = ['desenvolvedor'];

export function resolveRequiredRoles(method, pathname) {
  if (pathname.startsWith('/api/admin/')) {
    if (pathname === '/api/admin/dashboard' || pathname === '/api/admin/users') {
      return USER_ADMIN_ROLES;
    }

    if (
      /^\/api\/admin\/users\/[^/]+\/(reset-password|revoke-sessions)$/.test(pathname) ||
      /^\/api\/admin\/users\/[^/]+$/.test(pathname)
    ) {
      return USER_ADMIN_ROLES;
    }

    return SUPER_ADMIN_ROLES;
  }

  // Regras mínimas por endpoint crítico. O restante cai em GET=leitura / mutação=escrita.
  if (pathname === '/api/esl/jobs/run') {
    return SUPER_ADMIN_ROLES;
  }

  if (pathname === '/api/esl/dead-letters') {
    return SUPER_ADMIN_ROLES;
  }

  if (pathname === '/api/esl/audit') {
    return SUPER_ADMIN_ROLES;
  }

  if (method === 'GET') {
    return ESL_READ_ROLES;
  }

  return ESL_WRITE_ROLES;
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
