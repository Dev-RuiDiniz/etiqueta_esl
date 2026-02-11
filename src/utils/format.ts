const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL'
});

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false
});

export function formatCurrencyBRL(value: number) {
  return currencyFormatter.format(value);
}

export function formatPrice(value: number) {
  return formatCurrencyBRL(value);
}

export function truncateText(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}

export function formatDateTimeBR(iso: string) {
  return dateFormatter.format(new Date(iso));
}

export function formatShortCode(value: string, visibleChars = 6) {
  const normalized = value.trim();

  if (normalized.length <= visibleChars) {
    return normalized;
  }

  return `…${normalized.slice(-visibleChars)}`;
}
