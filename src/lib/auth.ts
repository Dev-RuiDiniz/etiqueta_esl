// Store de autenticação baseado em localStorage + módulo singleton.
// Usado pelo apiClient para anexar Bearer token e fazer refresh automático.

const ACCESS_KEY = 'esl_access_token';
const REFRESH_KEY = 'esl_refresh_token';

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

export function setTokens(accessToken: string, refreshToken: string): void {
  try {
    localStorage.setItem(ACCESS_KEY, accessToken);
    localStorage.setItem(REFRESH_KEY, refreshToken);
  } catch {
    // localStorage pode estar indisponível em contextos restritos.
  }
}

export function clearTokens(): void {
  try {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  } catch {
    // ignore
  }
}

export function redirectToLogin(): void {
  clearTokens();
  // Redireciona para a rota de login sem dependência de React Router.
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
}
