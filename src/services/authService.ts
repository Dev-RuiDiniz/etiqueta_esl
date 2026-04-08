import { clearSession, getRefreshToken, setSession } from '../lib/auth';
import type { AuthUser } from '../types/auth';

type AuthTokenPair = {
  access_token: string;
  refresh_token: string;
  token_type: 'Bearer';
  expires_in: string;
  user: AuthUser;
};

type AuthEnvelope<TData> = {
  success: boolean;
  error_code: number;
  error_msg: string;
  request_id: string;
  received_at: string;
  data: TData;
};

async function parseJson(response: Response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export async function login(email: string, password: string): Promise<AuthTokenPair> {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password })
  });

  const parsed = (await parseJson(response)) as AuthEnvelope<AuthTokenPair> | null;

  if (!response.ok || !parsed?.success || !parsed.data?.access_token) {
    throw new Error(parsed?.error_msg || 'Falha ao autenticar no BFF.');
  }

  setSession(parsed.data.access_token, parsed.data.refresh_token, parsed.data.user);
  return parsed.data;
}

export async function logout(): Promise<void> {
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    clearSession();
    return;
  }

  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ refresh_token: refreshToken })
    });
  } finally {
    clearSession();
  }
}
