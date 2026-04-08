// Store de autenticação baseado em localStorage + módulo singleton.
// Mantém o frontend desacoplado de qualquer gerenciador global de estado.

import type { AuthUser } from '../types/auth';

const ACCESS_KEY = 'esl_access_token';
const REFRESH_KEY = 'esl_refresh_token';
const USER_KEY = 'esl_current_user';

function decodeBase64Url(value: string): string | null {
  try {
    const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    return atob(padded);
  } catch {
    return null;
  }
}

function decodeAccessToken(accessToken: string): Partial<AuthUser> | null {
  const parts = String(accessToken).split('.');
  if (parts.length < 2) {
    return null;
  }

  const payloadRaw = decodeBase64Url(parts[1]);
  if (!payloadRaw) {
    return null;
  }

  try {
    const payload = JSON.parse(payloadRaw) as { sub?: string; email?: string; role?: AuthUser['role'] };
    if (!payload.sub || !payload.email || !payload.role) {
      return null;
    }

    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role
    };
  } catch {
    return null;
  }
}

export function getAccessToken(): string | null {
  try {
    return localStorage.getItem(ACCESS_KEY);
  } catch {
    return null;
  }
}

export function getRefreshToken(): string | null {
  try {
    return localStorage.getItem(REFRESH_KEY);
  } catch {
    return null;
  }
}

export function getCurrentUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) {
      return null;
    }

    return JSON.parse(raw) as AuthUser;
  } catch {
    // localStorage pode estar indisponível em contextos restritos.
    return null;
  }
}

export function getEffectiveUser(): AuthUser | null {
  const storedUser = getCurrentUser();
  if (storedUser) {
    return storedUser;
  }

  const accessToken = getAccessToken();
  if (!accessToken) {
    return null;
  }

  const decoded = decodeAccessToken(accessToken);
  if (!decoded?.id || !decoded?.email || !decoded?.role) {
    return null;
  }

  return {
    id: decoded.id,
    email: decoded.email,
    role: decoded.role,
    created_at: '',
    updated_at: ''
  };
}

export function setSession(accessToken: string, refreshToken: string, user?: AuthUser | null): void {
  try {
    localStorage.setItem(ACCESS_KEY, accessToken);
    localStorage.setItem(REFRESH_KEY, refreshToken);

    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  } catch {
    // localStorage pode estar indisponível em contextos restritos.
  }
}

export function clearSession(): void {
  try {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
  } catch {
    // ignore
  }
}

export function hasActiveSession(): boolean {
  return Boolean(getAccessToken());
}

export function canAccessAdmin(user: AuthUser | null = getEffectiveUser()): boolean {
  if (!user) {
    return true;
  }

  return user.role === 'administrador' || user.role === 'desenvolvedor';
}

export function redirectToLogin(returnTo?: string): void {
  clearSession();
  // Redireciona para a rota de login sem dependência de React Router.
  // Mantemos o destino original para facilitar o retorno após novo login.
  if (typeof window !== 'undefined') {
    const current = returnTo ?? `${window.location.pathname}${window.location.search}`;
    const safeReturnTo = current.startsWith('/login') ? '/dashboard' : current;
    window.location.href = `/login?next=${encodeURIComponent(safeReturnTo)}`;
  }
}
