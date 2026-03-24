import { clearTokens, getRefreshToken, setTokens } from '../lib/auth';

type AuthUser = {
  id: string;
  email: string;
  role: 'admin' | 'operador' | 'viewer';
  created_at: string;
  updated_at: string;
};

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

  setTokens(parsed.data.access_token, parsed.data.refresh_token);
  return parsed.data;
}

export async function logout(): Promise<void> {
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    clearTokens();
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
    clearTokens();
  }
}
