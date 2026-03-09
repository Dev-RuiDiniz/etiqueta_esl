// Adaptador de resposta do BFF para o modelo de tag usado pela interface.
import type { Tag } from '../../types/tags';
import type { EslStatusSnapshot } from '../../types/esl';

function normalizeBattery(value: number | null) {
  if (value === null) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(value)));
}

export function mapStatusSnapshotToTag(snapshot: EslStatusSnapshot): Tag {
  const productCode = snapshot.product_code ?? 'UNBOUND';
  const apCode = snapshot.ap_code ?? 'N/A';
  const tagStatus = snapshot.online === 1 ? 'ONLINE' : 'OFFLINE';

  return {
    tagId: snapshot.esl_code,
    sku: productCode,
    productName: productCode === 'UNBOUND' ? 'Etiqueta sem produto vinculado' : `Produto ${productCode}`,
    price: 0,
    unitLabel: 'R$/un',
    status: tagStatus,
    battery: normalizeBattery(snapshot.battery_percent),
    category: snapshot.esltype_code ?? 'ESL',
    corridor: apCode,
    location: `AP ${apCode}`,
    lastUpdate: snapshot.updated_at ?? new Date().toISOString()
  };
}
