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

export async function eslRequest<TData>(path: string, init?: RequestInit): Promise<EslCommandResult<TData>> {
  // Cliente frontend -> BFF (nunca chama fornecedor direto no navegador).
  const response = await fetch(joinPath(path), {
    ...init,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(init?.headers ?? {})
    }
  });

  const parsed = await parseJson(response);

  if (!response.ok || !parsed) {
    throw new Error(`BFF request failed (${response.status})`);
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
