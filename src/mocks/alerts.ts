import { tagsMock } from './tags';
import type { AlertItem, AlertPriority, AlertStatus, AlertType } from '../types/alerts';

function buildCreatedAt(index: number) {
  const base = new Date('2026-02-11T12:00:00.000Z');
  base.setMinutes(base.getMinutes() - index * 28);
  return base.toISOString();
}

function pickType(index: number): AlertType {
  const types: AlertType[] = ['LOW_BATTERY', 'OFFLINE', 'UPDATE_FAILED'];
  return types[index % types.length];
}

function pickPriority(type: AlertType, battery: number): AlertPriority {
  if (type === 'OFFLINE' || battery <= 15) {
    return 'HIGH';
  }

  return 'MEDIUM';
}

function pickStatus(index: number): AlertStatus {
  return index % 4 === 0 ? 'RESOLVED' : 'OPEN';
}

function createAlertDetail(type: AlertType, index: number, battery: number) {
  if (type === 'LOW_BATTERY') {
    return `Bateria em ${Math.max(8, battery)}%.`;
  }

  if (type === 'OFFLINE') {
    const elapsed = index % 2 === 0 ? `${20 + index} min` : `${1 + (index % 4)} h`;
    return `Etiqueta sem comunicação há ${elapsed}.`;
  }

  return 'Falha no envio da atualização de preço.';
}

export const alertsMock: AlertItem[] = Array.from({ length: 24 }, (_, index) => {
  const tag = tagsMock[index % tagsMock.length];
  const type = pickType(index);

  return {
    id: `ALT-${String(index + 1).padStart(4, '0')}`,
    createdAt: buildCreatedAt(index),
    type,
    priority: pickPriority(type, tag.battery),
    status: pickStatus(index),
    tagId: tag.tagId,
    sku: tag.sku,
    productName: tag.productName,
    location: tag.location,
    details: createAlertDetail(type, index, tag.battery)
  };
});
