// Mapeamentos entre contratos internos e formato exigido pela API do fornecedor.
function asOptionalString(value) {
  if (value === undefined || value === null) {
    return undefined;
  }

  return String(value);
}

function cleanObject(input) {
  return Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined && value !== null && value !== ''));
}

export function toVendorProduct(product) {
  return cleanObject({
    pi: asOptionalString(product.product_inner_code),
    pc: asOptionalString(product.product_code ?? product.sku),
    pn: asOptionalString(product.product_name),
    ps: asOptionalString(product.spec),
    pg: asOptionalString(product.grade),
    pu: asOptionalString(product.unit),
    pp: asOptionalString(product.price),
    vp: asOptionalString(product.vip_price),
    pop: asOptionalString(product.origin_price),
    po: asOptionalString(product.origin),
    pm: asOptionalString(product.manufacturer),
    promotion: asOptionalString(product.promotion),
    pim: asOptionalString(product.image),
    pqr: asOptionalString(product.qrcode),
    qty: asOptionalString(product.quantity),
    f1: asOptionalString(product.f1),
    f2: asOptionalString(product.f2),
    f3: asOptionalString(product.f3),
    f4: asOptionalString(product.f4),
    f5: asOptionalString(product.f5),
    f6: asOptionalString(product.f6),
    f7: asOptionalString(product.f7),
    f8: asOptionalString(product.f8),
    f9: asOptionalString(product.f9),
    f10: asOptionalString(product.f10),
    f11: asOptionalString(product.f11),
    f12: asOptionalString(product.f12),
    f13: asOptionalString(product.f13),
    f14: asOptionalString(product.f14),
    f15: asOptionalString(product.f15),
    f16: asOptionalString(product.f16),
    extend: product.extend ? JSON.stringify(product.extend) : undefined
  });
}

export function toVendorProductsArray(products) {
  return products.map((item) => toVendorProduct(item));
}

export function toVendorBindPayload(binding) {
  return cleanObject({
    f1: asOptionalString(binding.esl_code),
    f2: asOptionalString(binding.product_code),
    f3: asOptionalString(binding.template_id)
  });
}

export function toVendorBindMultiplePayload(bindings) {
  const mapped = bindings.map((item) => ({
    esl_code: asOptionalString(item.esl_code),
    product_code: asOptionalString(item.product_code),
    template_id: item.template_id ?? undefined
  }));

  return {
    f1: JSON.stringify(mapped)
  };
}

export function toVendorQueryStatusPayload(params) {
  return cleanObject({
    f1: asOptionalString(params.page),
    f2: asOptionalString(params.size),
    f3: JSON.stringify(params.esl_codes ?? [])
  });
}

export function toVendorSearchPayload(eslCodes) {
  return {
    f1: JSON.stringify(eslCodes)
  };
}

export function toVendorDirectPayload(items) {
  const mapped = items.map((item) => ({
    esl_code: asOptionalString(item.esl_code),
    template_id: item.template_id,
    product: toVendorProduct(item.product ?? {}),
    led: item.led ?? undefined
  }));

  return {
    f1: JSON.stringify(mapped)
  };
}

export function normalizeBattery(rawBattery) {
  const value = Number(rawBattery);

  if (!Number.isFinite(value)) {
    return null;
  }

  if (value <= 100) {
    return Math.max(0, Math.min(100, Math.round(value)));
  }

  const minMv = 2500;
  const maxMv = 3300;
  const percent = ((value - minMv) / (maxMv - minMv)) * 100;
  return Math.max(0, Math.min(100, Math.round(percent)));
}

export function fromVendorStatusRecord(record) {
  return {
    esl_code: record.esl_code,
    esl_version: record.esl_version ?? null,
    action: record.action ?? null,
    online: Number(record.online ?? 0),
    esl_battery: Number(record.esl_battery ?? 0),
    battery_percent: normalizeBattery(record.esl_battery),
    product_code: record.product_code ?? null,
    ap_code: record.ap_code ?? null,
    esltype_code: record.esltype_code ?? null,
    created_at: record.created_at ?? null,
    updated_at: record.updated_at ?? null
  };
}

export function fromVendorTemplateRecord(record) {
  return {
    id: record.id,
    esltype_code: record.esltype_code ?? null,
    esltemplate_name: record.esltemplate_name ?? record.esltemplate_name_ ?? null,
    esltemplate_default: Number(record.esltemplate_default ?? 0)
  };
}
