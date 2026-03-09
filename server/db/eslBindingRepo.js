// Repositório em memória de vínculos entre etiqueta e produto.
const bindingsByEslCode = new Map();

export function upsertBinding(binding) {
  const now = new Date().toISOString();
  const existing = bindingsByEslCode.get(binding.esl_code);

  const record = {
    esl_code: binding.esl_code,
    product_code: binding.product_code,
    template_id: binding.template_id ?? existing?.template_id ?? null,
    bound_at: existing?.bound_at ?? now,
    updated_at: now,
    binding_status: 'BOUND'
  };

  bindingsByEslCode.set(record.esl_code, record);
  return record;
}

export function removeBinding(eslCode) {
  const existing = bindingsByEslCode.get(eslCode);

  if (!existing) {
    return null;
  }

  bindingsByEslCode.delete(eslCode);

  return {
    ...existing,
    binding_status: 'UNBOUND',
    updated_at: new Date().toISOString()
  };
}

export function getBindingByEslCode(eslCode) {
  return bindingsByEslCode.get(eslCode) ?? null;
}

export function listBindings() {
  return Array.from(bindingsByEslCode.values());
}

export function listBindingsByProductCode(productCode) {
  return Array.from(bindingsByEslCode.values()).filter((item) => item.product_code === productCode);
}
