import { clearTokens, getAccessToken, getRefreshToken, redirectToLogin, setTokens } from '../../lib/auth';
import type { EslCommandResult } from '../../types/esl';

const ESL_BFF_BASE = import.meta.env.VITE_ESL_BFF_BASE ?? '/api/esl';

function joinPath(path: string) {
  const base = ESL_BFF_BASE.endsWith('/') ? ESL_BFF_BASE.slice(0, -1) : ESL_BFF_BASE;
  const suffix = path.startsWith('/') ? path : `/${path}`;
  return `${base}${suffix}`;
}

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

function buildAuthHeaders(): HeadersInit {
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function tryRefreshToken(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  try {
    const res = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken })
    });

    if (!res.ok) return false;

    const parsed = await parseJson(res);
    if (!parsed?.data?.access_token) return false;

    setTokens(parsed.data.access_token, parsed.data.refresh_token ?? refreshToken);
    return true;
  } catch {
    return false;
  }
}

export async function eslRequest<TData>(path: string, init?: RequestInit): Promise<EslCommandResult<TData>> {
  // Cliente frontend → BFF (nunca chama fornecedor direto no navegador).
  // Inclui Bearer token se disponível; faz refresh automático em 401.
  const requestId = crypto.randomUUID?.() ?? Math.random().toString(36).slice(2);

  const doFetch = (extraHeaders: HeadersInit = {}) =>
    fetch(joinPath(path), {
      ...init,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-Request-ID': requestId,
        ...buildAuthHeaders(),
        ...(init?.headers ?? {}),
        ...extraHeaders
      }
    });

  let response = await doFetch();

  if (response.status === 401) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      response = await doFetch();
    } else {
      clearTokens();
      redirectToLogin();
      throw new Error('Sessão expirada. Faça login novamente.');
    }
  }

  const parsed = await parseJson(response);

  if (!response.ok) {
    // Classificação de erro por status HTTP e código de erro do BFF.
    if (response.status === 401) {
      throw new Error('Sessão expirada. Faça login novamente.');
    }

    if (response.status === 403) {
      throw new Error('Sem permissão para executar esta operação.');
    }

    if (response.status === 413) {
      throw new Error('Arquivo ou dados muito grandes. Reduza o tamanho e tente novamente.');
    }

    if (response.status === 422) {
      const field = parsed?.data?.field ? ` (campo: ${String(parsed.data.field)})` : '';
      throw new Error(`Dados inválidos${field}: ${parsed?.error_msg ?? 'verifique os campos e tente novamente.'}`);
    }

    if (response.status === 429) {
      throw new Error('Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.');
    }

    if (response.status >= 500) {
      throw new Error('Erro no servidor. Aguarde e tente novamente.');
    }

    // Erro lógico do fornecedor (success=false mas HTTP 200).
    if (parsed?.error_msg) {
      throw new Error(parsed.error_msg);
    }

    throw new Error(`Erro ${response.status}. Tente novamente.`);
  }

  if (!parsed) {
    throw new Error('Resposta inválida do servidor.');
  }

  // Erro lógico do fornecedor (HTTP 200 mas success=false).
  if (parsed.success === false && parsed.error_msg) {
    throw new Error(parsed.error_msg);
  }

  return parsed as EslCommandResult<TData>;
}

export async function eslGet<TData>(path: string): Promise<EslCommandResult<TData>> {
  return eslRequest<TData>(path, {
    method: 'GET'
  });
}

export async function eslPost<TData, TBody>(path: string, body: TBody): Promise<EslCommandResult<TData>> {
  return eslRequest<TData>(path, {
    method: 'POST',
    body: JSON.stringify(body)
  });
}
