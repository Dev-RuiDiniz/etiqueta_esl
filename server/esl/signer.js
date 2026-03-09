// Injeta assinatura e campos obrigatórios em todos os requests do fornecedor.
export function withSignedPayload(payload, config, options = {}) {
  const includeStoreCode = options.includeStoreCode ?? true;

  return {
    ...(includeStoreCode ? { store_code: options.store_code ?? config.storeCode } : {}),
    ...payload,
    is_base64: options.is_base64 ?? config.isBase64,
    sign: options.sign ?? config.sign
  };
}

export function withSignedQuery(query, config, options = {}) {
  const includeStoreCode = options.includeStoreCode ?? true;

  return {
    ...(includeStoreCode ? { store_code: options.store_code ?? config.storeCode } : {}),
    ...query,
    is_base64: options.is_base64 ?? config.isBase64,
    sign: options.sign ?? config.sign
  };
}
