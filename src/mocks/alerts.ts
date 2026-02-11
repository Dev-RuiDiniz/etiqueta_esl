import type { AlertItem, AlertPriority, AlertStatus, AlertType } from '../types/alerts';

const products = [
  { sku: 'SKU-1001', productName: 'Arroz Integral 1kg' },
  { sku: 'SKU-1002', productName: 'Feijão Carioca Premium 1kg' },
  { sku: 'SKU-1003', productName: 'Café Torrado 500g' },
  { sku: 'SKU-1004', productName: 'Azeite Extra Virgem 500ml' },
  { sku: 'SKU-1005', productName: 'Leite UHT Integral 1L' },
  { sku: 'SKU-1006', productName: 'Macarrão Espaguete 500g' },
  { sku: 'SKU-1007', productName: 'Molho de Tomate Tradicional 340g' },
  { sku: 'SKU-1008', productName: 'Sabonete Neutro 90g' },
  { sku: 'SKU-1009', productName: 'Detergente Líquido 500ml' },
  { sku: 'SKU-1010', productName: 'Papel Toalha 2 Rolos' },
  { sku: 'SKU-1011', productName: 'Água Mineral 1,5L' },
  { sku: 'SKU-1012', productName: 'Biscoito Recheado Chocolate 140g' }
];

const locations = [
  'Setor A > Corredor 1 > Gôndola 1',
  'Setor A > Corredor 3 > Gôndola 2',
  'Setor B > Corredor 4 > Gôndola 3',
  'Setor B > Corredor 6 > Ponta de gôndola',
  'Setor C > Corredor 2 > Refrigerados',
  'Setor C > Corredor 5 > Gôndola 4'
];

function createAlertDetail(type: AlertType, index: number) {
  if (type === 'LOW_BATTERY') {
    const batteryLevel = 8 + (index % 12);
    return `Bateria em ${batteryLevel}%`;
  }

  if (type === 'OFFLINE') {
    const elapsed = index % 2 === 0 ? `${15 + index * 2} min` : `${1 + (index % 5)} h`;
    return `Etiqueta offline há ${elapsed}`;
  }

  return `Falha no envio da atualização. requestId=req-${2200 + index} traceId=tr-${88000 + index}`;
}

function createCreatedAt(index: number) {
  const base = new Date();
  base.setMinutes(base.getMinutes() - index * 37);
  return base.toISOString();
}

function pickType(index: number): AlertType {
  const types: AlertType[] = ['LOW_BATTERY', 'OFFLINE', 'UPDATE_FAILED'];
  return types[index % types.length];
}

function pickPriority(index: number): AlertPriority {
  return index % 10 < 3 ? 'HIGH' : 'MEDIUM';
}

function pickStatus(index: number): AlertStatus {
  return index % 10 < 7 ? 'OPEN' : 'RESOLVED';
}

export const alertsMock: AlertItem[] = Array.from({ length: 36 }, (_, index) => {
  const product = products[index % products.length];
  const tagNumber = 1200 + index;
  const type = pickType(index);

  return {
    id: `ALT-${String(index + 1).padStart(4, '0')}`,
    createdAt: createCreatedAt(index),
    type,
    priority: pickPriority(index),
    status: pickStatus(index),
    tagId: `TAG-${tagNumber}`,
    sku: product.sku,
    productName: product.productName,
    location: locations[index % locations.length],
    details: createAlertDetail(type, index)
  };
});
