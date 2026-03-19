// Utilitários de validação de input para as rotas BFF.
// Lança erros tipados com code 'VALIDATION_ERROR' para tratamento central.

function validationError(field, message) {
  const error = new Error(message);
  error.code = 'VALIDATION_ERROR';
  error.field = field;
  error.statusCode = 422;
  return error;
}

/**
 * Valida que o valor é uma string não vazia dentro dos limites de tamanho.
 * @param {unknown} value
 * @param {string} field
 * @param {{ minLen?: number, maxLen?: number, pattern?: RegExp }} [opts]
 */
export function requireString(value, field, { minLen = 1, maxLen = 256, pattern } = {}) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw validationError(field, `O campo '${field}' é obrigatório e deve ser uma string não vazia.`);
  }

  const trimmed = value.trim();

  if (trimmed.length < minLen) {
    throw validationError(field, `O campo '${field}' deve ter pelo menos ${minLen} caractere(s).`);
  }

  if (trimmed.length > maxLen) {
    throw validationError(field, `O campo '${field}' deve ter no máximo ${maxLen} caractere(s).`);
  }

  if (pattern && !pattern.test(trimmed)) {
    throw validationError(field, `O campo '${field}' tem formato inválido.`);
  }

  return trimmed;
}

/**
 * Valida que o valor é um inteiro positivo finito.
 * @param {unknown} value
 * @param {string} field
 * @param {{ allowNull?: boolean }} [opts]
 */
export function requirePositiveInt(value, field, { allowNull = false } = {}) {
  if (allowNull && (value == null || value === '')) {
    return null;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0 || !Number.isInteger(parsed)) {
    throw validationError(field, `O campo '${field}' deve ser um número inteiro positivo.`);
  }

  return parsed;
}

/**
 * Valida um número positivo finito (preço, etc.).
 * @param {unknown} value
 * @param {string} field
 */
export function requirePositiveNumber(value, field) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw validationError(field, `O campo '${field}' deve ser um número positivo.`);
  }

  return parsed;
}

/**
 * Valida que o valor é um array de strings com tamanho máximo.
 * @param {unknown} value
 * @param {string} field
 * @param {{ maxItems?: number, itemMaxLen?: number }} [opts]
 */
export function requireStringArray(value, field, { maxItems = 500, itemMaxLen = 64 } = {}) {
  if (!Array.isArray(value)) {
    throw validationError(field, `O campo '${field}' deve ser um array.`);
  }

  if (value.length === 0) {
    throw validationError(field, `O campo '${field}' não pode ser um array vazio.`);
  }

  if (value.length > maxItems) {
    throw validationError(field, `O campo '${field}' pode conter no máximo ${maxItems} item(s).`);
  }

  return value.map((item, idx) => {
    if (typeof item !== 'string' || item.trim().length === 0) {
      throw validationError(field, `Item ${idx} do campo '${field}' é inválido.`);
    }

    if (item.trim().length > itemMaxLen) {
      throw validationError(field, `Item ${idx} do campo '${field}' excede ${itemMaxLen} caracteres.`);
    }

    return item.trim();
  });
}
