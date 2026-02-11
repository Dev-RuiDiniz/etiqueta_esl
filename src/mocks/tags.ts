import type { Tag } from '../types/tags';

export const tagsMock: Tag[] = [
  {
    tagId: 'TAG-0001',
    sku: 'SKU-10001',
    productName: 'Banana Prata 1kg',
    price: 6.99,
    status: 'ONLINE',
    battery: 84,
    category: 'Hortifruti',
    unitLabel: 'R$/kg',
    corridor: 'Corredor 1',
    location: 'Loja Centro > Corredor 1 > Gôndola A',
    lastUpdate: '2026-02-11T09:10:00.000Z'
  },
  { tagId: 'TAG-0002', sku: 'SKU-10002', productName: 'Maçã Gala 1kg', price: 9.49, promotion: { enabled: true, fromPrice: 11.99, label: 'OFERTA' }, status: 'ONLINE', battery: 67, category: 'Hortifruti', unitLabel: 'R$/kg', corridor: 'Corredor 1', location: 'Loja Norte > Corredor 1 > Gôndola C', lastUpdate: '2026-02-11T08:35:00.000Z' },
  { tagId: 'TAG-0003', sku: 'SKU-10003', productName: 'Tomate Italiano 1kg', price: 7.99, status: 'OFFLINE', battery: 14, category: 'Hortifruti', unitLabel: 'R$/kg', corridor: 'Corredor 2', location: 'Loja Sul > Corredor 2 > Gôndola B', lastUpdate: '2026-02-11T07:58:00.000Z' },
  { tagId: 'TAG-0004', sku: 'SKU-10004', productName: 'Batata Inglesa 1kg', price: 5.99, status: 'ONLINE', battery: 43, category: 'Hortifruti', unitLabel: 'R$/kg', corridor: 'Corredor 2', location: 'Loja Centro > Corredor 2 > Gôndola D', lastUpdate: '2026-02-11T09:14:00.000Z' },

  { tagId: 'TAG-0005', sku: 'SKU-20001', productName: 'Arroz Tipo 1 5kg', price: 24.9, promotion: { enabled: true, fromPrice: 27.9, label: 'OFERTA' }, status: 'ONLINE', battery: 55, category: 'Mercearia', unitLabel: 'R$/un', corridor: 'Corredor 3', location: 'Loja Norte > Corredor 3 > Gôndola A', lastUpdate: '2026-02-11T09:08:00.000Z' },
  { tagId: 'TAG-0006', sku: 'SKU-20002', productName: 'Feijão Carioca 1kg', price: 8.49, status: 'ONLINE', battery: 27, category: 'Mercearia', unitLabel: 'R$/un', corridor: 'Corredor 3', location: 'Loja Sul > Corredor 3 > Gôndola B', lastUpdate: '2026-02-11T08:48:00.000Z' },
  { tagId: 'TAG-0007', sku: 'SKU-20003', productName: 'Açúcar Refinado 1kg', price: 4.99, status: 'OFFLINE', battery: 12, category: 'Mercearia', unitLabel: 'R$/un', corridor: 'Corredor 4', location: 'Loja Centro > Corredor 4 > Gôndola C', lastUpdate: '2026-02-11T07:42:00.000Z' },
  { tagId: 'TAG-0008', sku: 'SKU-20004', productName: 'Macarrão Espaguete 500g', price: 5.79, status: 'ONLINE', battery: 72, category: 'Mercearia', unitLabel: 'R$/un', corridor: 'Corredor 4', location: 'Loja Norte > Corredor 4 > Gôndola D', lastUpdate: '2026-02-11T09:17:00.000Z' },

  { tagId: 'TAG-0009', sku: 'SKU-30001', productName: 'Refrigerante Cola 2L', price: 8.99, promotion: { enabled: true, fromPrice: 10.49, label: 'OFERTA' }, status: 'ONLINE', battery: 31, category: 'Bebidas', unitLabel: 'R$/L', corridor: 'Corredor 5', location: 'Loja Centro > Corredor 5 > Gôndola A', lastUpdate: '2026-02-11T08:54:00.000Z' },
  { tagId: 'TAG-0010', sku: 'SKU-30002', productName: 'Suco de Laranja 1L', price: 7.25, status: 'OFFLINE', battery: 19, category: 'Bebidas', unitLabel: 'R$/L', corridor: 'Corredor 5', location: 'Loja Sul > Corredor 5 > Gôndola B', lastUpdate: '2026-02-11T06:59:00.000Z' },
  { tagId: 'TAG-0011', sku: 'SKU-30003', productName: 'Água Mineral sem Gás 1,5L', price: 2.79, status: 'ONLINE', battery: 88, category: 'Bebidas', unitLabel: 'R$/L', corridor: 'Corredor 6', location: 'Loja Norte > Corredor 6 > Gôndola C', lastUpdate: '2026-02-11T09:21:00.000Z' },
  { tagId: 'TAG-0012', sku: 'SKU-30004', productName: 'Energético 269ml', price: 6.99, status: 'ONLINE', battery: 22, category: 'Bebidas', unitLabel: 'R$/L', corridor: 'Corredor 6', location: 'Loja Centro > Corredor 6 > Gôndola D', lastUpdate: '2026-02-11T08:13:00.000Z' },

  { tagId: 'TAG-0013', sku: 'SKU-40001', productName: 'Patinho Bovino 1kg', price: 39.9, status: 'ONLINE', battery: 77, category: 'Açougue', unitLabel: 'R$/kg', corridor: 'Corredor 7', location: 'Loja Centro > Corredor 7 > Gôndola A', lastUpdate: '2026-02-11T09:20:00.000Z' },
  { tagId: 'TAG-0014', sku: 'SKU-40002', productName: 'Frango Resfriado 1kg', price: 14.9, status: 'ONLINE', battery: 64, category: 'Açougue', unitLabel: 'R$/kg', corridor: 'Corredor 7', location: 'Loja Norte > Corredor 7 > Gôndola B', lastUpdate: '2026-02-11T08:44:00.000Z' },
  { tagId: 'TAG-0015', sku: 'SKU-40003', productName: 'Linguiça Toscana 1kg', price: 18.9, status: 'OFFLINE', battery: 11, category: 'Açougue', unitLabel: 'R$/kg', corridor: 'Corredor 8', location: 'Loja Sul > Corredor 8 > Gôndola C', lastUpdate: '2026-02-11T06:45:00.000Z' },
  { tagId: 'TAG-0016', sku: 'SKU-40004', productName: 'Bife Ancho 1kg', price: 59.9, promotion: { enabled: true, fromPrice: 64.9, label: 'IMPERDÍVEL' }, status: 'ONLINE', battery: 49, category: 'Açougue', unitLabel: 'R$/kg', corridor: 'Corredor 8', location: 'Loja Centro > Corredor 8 > Gôndola D', lastUpdate: '2026-02-11T09:09:00.000Z' },

  { tagId: 'TAG-0017', sku: 'SKU-50001', productName: 'Sabonete Neutro 90g', price: 2.29, status: 'ONLINE', battery: 58, category: 'Higiene', unitLabel: 'R$/un', corridor: 'Corredor 2', location: 'Loja Norte > Corredor 2 > Gôndola A', lastUpdate: '2026-02-11T08:31:00.000Z' },
  { tagId: 'TAG-0018', sku: 'SKU-50002', productName: 'Shampoo Nutritivo 350ml', price: 18.4, status: 'ONLINE', battery: 36, category: 'Higiene', unitLabel: 'R$/un', corridor: 'Corredor 2', location: 'Loja Sul > Corredor 2 > Gôndola C', lastUpdate: '2026-02-11T09:02:00.000Z' },
  { tagId: 'TAG-0019', sku: 'SKU-50003', productName: 'Creme Dental 90g', price: 5.49, status: 'OFFLINE', battery: 16, category: 'Higiene', unitLabel: 'R$/un', corridor: 'Corredor 1', location: 'Loja Centro > Corredor 1 > Gôndola D', lastUpdate: '2026-02-11T06:28:00.000Z' },
  { tagId: 'TAG-0020', sku: 'SKU-50004', productName: 'Papel Higiênico 12 rolos', price: 21.9, status: 'ONLINE', battery: 90, category: 'Higiene', unitLabel: 'R$/un', corridor: 'Corredor 1', location: 'Loja Norte > Corredor 1 > Gôndola B', lastUpdate: '2026-02-11T09:24:00.000Z' },

  { tagId: 'TAG-0021', sku: 'SKU-60001', productName: 'Óleo de Soja 900ml', price: 6.89, status: 'ONLINE', battery: 74, category: 'Mercearia', unitLabel: 'R$/un', corridor: 'Corredor 3', location: 'Loja Sul > Corredor 3 > Gôndola D', lastUpdate: '2026-02-11T08:25:00.000Z' },
  { tagId: 'TAG-0022', sku: 'SKU-60002', productName: 'Farinha de Trigo 1kg', price: 4.79, status: 'ONLINE', battery: 67, category: 'Mercearia', unitLabel: 'R$/un', corridor: 'Corredor 4', location: 'Loja Centro > Corredor 4 > Gôndola A', lastUpdate: '2026-02-11T09:12:00.000Z' },
  { tagId: 'TAG-0023', sku: 'SKU-60003', productName: 'Água de Coco 1L', price: 8.39, status: 'OFFLINE', battery: 18, category: 'Bebidas', unitLabel: 'R$/L', corridor: 'Corredor 6', location: 'Loja Norte > Corredor 6 > Gôndola B', lastUpdate: '2026-02-11T07:12:00.000Z' },
  { tagId: 'TAG-0024', sku: 'SKU-60004', productName: 'Coxa e Sobrecoxa 1kg', price: 13.99, status: 'ONLINE', battery: 29, category: 'Açougue', unitLabel: 'R$/kg', corridor: 'Corredor 7', location: 'Loja Sul > Corredor 7 > Gôndola D', lastUpdate: '2026-02-11T08:52:00.000Z' }
];

export const tagCategories = Array.from(new Set(tagsMock.map((tag) => tag.category))).sort();

export const tagCorridors = Array.from(new Set(tagsMock.map((tag) => tag.corridor))).sort();
