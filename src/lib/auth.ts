// Store de autenticação baseado em localStorage + módulo singleton.
// Mantém o frontend desacoplado de qualquer gerenciador global de estado.

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

export function hasActiveSession(): boolean {
  return Boolean(getAccessToken());
}

export function redirectToLogin(returnTo?: string): void {
  clearTokens();
  // Redireciona para a rota de login sem dependência de React Router.
  // Mantemos o destino original para facilitar o retorno após novo login.
  if (typeof window !== 'undefined') {
    const current = returnTo ?? `${window.location.pathname}${window.location.search}`;
    const safeReturnTo = current.startsWith('/login') ? '/dashboard' : current;
    window.location.href = `/login?next=${encodeURIComponent(safeReturnTo)}`;
  }
}
