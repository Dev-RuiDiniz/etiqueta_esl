export type TagStatus = 'ONLINE' | 'OFFLINE';

export type Tag = {
  tagId: string;
  sku: string;
  productName: string;
  price: number;
  unitLabel: string;
  promotion?: {
    enabled: boolean;
    fromPrice?: number;
    label?: string;
  };
  status: TagStatus;
  battery: number;
  category: string;
  corridor: string;
  location: string;
  lastUpdate: string;
};

export const tagsMock: Tag[] = [
  {
    tagId: 'TAG-0001',
    sku: 'SKU-10001',
    productName: 'Arroz Tipo 1 5kg',
    price: 24.9,
    promotion: {
      enabled: true,
      fromPrice: 27.9,
      label: 'OFERTA'
    },
    status: 'ONLINE',
    battery: 83,
    category: 'Mercearia',
    unitLabel: 'R$/un',
    corridor: 'Corredor 1',
    location: 'Setor A > Corredor 1 > Gôndola 2',
    lastUpdate: '2026-02-11T09:10:00.000Z'
  },
  {
    tagId: 'TAG-0002',
    sku: 'SKU-10002',
    productName: 'Feijão Carioca 1kg',
    price: 8.49,
    status: 'ONLINE',
    battery: 62,
    category: 'Mercearia',
    unitLabel: 'R$/un',
    corridor: 'Corredor 1',
    location: 'Setor A > Corredor 1 > Gôndola 4',
    lastUpdate: '2026-02-11T08:35:00.000Z'
  },
  {
    tagId: 'TAG-0003',
    sku: 'SKU-10003',
    productName: 'Açúcar Refinado 1kg',
    price: 4.99,
    status: 'OFFLINE',
    battery: 14,
    category: 'Mercearia',
    unitLabel: 'R$/un',
    corridor: 'Corredor 2',
    location: 'Setor A > Corredor 2 > Gôndola 1',
    lastUpdate: '2026-02-11T07:58:00.000Z'
  },
  {
    tagId: 'TAG-0004',
    sku: 'SKU-10004',
    productName: 'Macarrão Espaguete 500g',
    price: 5.79,
    status: 'ONLINE',
    battery: 40,
    category: 'Mercearia',
    unitLabel: 'R$/un',
    corridor: 'Corredor 2',
    location: 'Setor A > Corredor 2 > Gôndola 3',
    lastUpdate: '2026-02-11T09:14:00.000Z'
  },
  {
    tagId: 'TAG-0005',
    sku: 'SKU-20001',
    productName: 'Leite Integral 1L',
    price: 4.39,
    promotion: {
      enabled: true,
      fromPrice: 5.19,
      label: 'CLUBE'
    },
    status: 'ONLINE',
    battery: 55,
    category: 'Laticínios',
    unitLabel: 'R$/un',
    corridor: 'Corredor 5',
    location: 'Setor B > Corredor 5 > Gôndola 2',
    lastUpdate: '2026-02-11T09:08:00.000Z'
  },
  {
    tagId: 'TAG-0006',
    sku: 'SKU-20002',
    productName: 'Iogurte Natural 170g',
    price: 2.99,
    status: 'ONLINE',
    battery: 27,
    category: 'Laticínios',
    unitLabel: 'R$/un',
    corridor: 'Corredor 5',
    location: 'Setor B > Corredor 5 > Gôndola 3',
    lastUpdate: '2026-02-11T08:48:00.000Z'
  },
  {
    tagId: 'TAG-0007',
    sku: 'SKU-20003',
    productName: 'Queijo Mussarela Fatiado 150g',
    price: 9.89,
    status: 'OFFLINE',
    battery: 12,
    category: 'Laticínios',
    unitLabel: 'R$/un',
    corridor: 'Corredor 6',
    location: 'Setor B > Corredor 6 > Gôndola 1',
    lastUpdate: '2026-02-11T07:42:00.000Z'
  },
  {
    tagId: 'TAG-0008',
    sku: 'SKU-20004',
    productName: 'Manteiga com Sal 200g',
    price: 10.5,
    status: 'ONLINE',
    battery: 72,
    category: 'Laticínios',
    unitLabel: 'R$/un',
    corridor: 'Corredor 6',
    location: 'Setor B > Corredor 6 > Gôndola 2',
    lastUpdate: '2026-02-11T09:17:00.000Z'
  },
  {
    tagId: 'TAG-0009',
    sku: 'SKU-30001',
    productName: 'Refrigerante Cola 2L',
    price: 8.99,
    promotion: {
      enabled: true,
      fromPrice: 10.49,
      label: 'OFERTA'
    },
    status: 'ONLINE',
    battery: 31,
    category: 'Bebidas',
    unitLabel: 'R$/L',
    corridor: 'Corredor 8',
    location: 'Setor C > Corredor 8 > Gôndola 1',
    lastUpdate: '2026-02-11T08:54:00.000Z'
  },
  {
    tagId: 'TAG-0010',
    sku: 'SKU-30002',
    productName: 'Suco de Laranja 1L',
    price: 7.25,
    status: 'OFFLINE',
    battery: 19,
    category: 'Bebidas',
    unitLabel: 'R$/L',
    corridor: 'Corredor 8',
    location: 'Setor C > Corredor 8 > Gôndola 3',
    lastUpdate: '2026-02-11T06:59:00.000Z'
  },
  {
    tagId: 'TAG-0011',
    sku: 'SKU-30003',
    productName: 'Água Mineral sem Gás 1,5L',
    price: 2.79,
    status: 'ONLINE',
    battery: 88,
    category: 'Bebidas',
    unitLabel: 'R$/L',
    corridor: 'Corredor 9',
    location: 'Setor C > Corredor 9 > Gôndola 1',
    lastUpdate: '2026-02-11T09:21:00.000Z'
  },
  {
    tagId: 'TAG-0012',
    sku: 'SKU-30004',
    productName: 'Energético 269ml',
    price: 6.99,
    status: 'ONLINE',
    battery: 22,
    category: 'Bebidas',
    unitLabel: 'R$/L',
    corridor: 'Corredor 9',
    location: 'Setor C > Corredor 9 > Gôndola 4',
    lastUpdate: '2026-02-11T08:13:00.000Z'
  },
  {
    tagId: 'TAG-0013',
    sku: 'SKU-40001',
    productName: 'Sabonete Neutro 90g',
    price: 2.29,
    status: 'ONLINE',
    battery: 77,
    category: 'Higiene',
    unitLabel: 'R$/un',
    corridor: 'Corredor 11',
    location: 'Setor D > Corredor 11 > Gôndola 2',
    lastUpdate: '2026-02-11T09:20:00.000Z'
  },
  {
    tagId: 'TAG-0014',
    sku: 'SKU-40002',
    productName: 'Shampoo Nutritivo 350ml',
    price: 18.4,
    status: 'ONLINE',
    battery: 64,
    category: 'Higiene',
    unitLabel: 'R$/un',
    corridor: 'Corredor 11',
    location: 'Setor D > Corredor 11 > Gôndola 3',
    lastUpdate: '2026-02-11T08:44:00.000Z'
  },
  {
    tagId: 'TAG-0015',
    sku: 'SKU-40003',
    productName: 'Creme Dental 90g',
    price: 5.49,
    status: 'OFFLINE',
    battery: 11,
    category: 'Higiene',
    unitLabel: 'R$/un',
    corridor: 'Corredor 12',
    location: 'Setor D > Corredor 12 > Gôndola 1',
    lastUpdate: '2026-02-11T06:45:00.000Z'
  },
  {
    tagId: 'TAG-0016',
    sku: 'SKU-40004',
    productName: 'Papel Higiênico 12 rolos',
    price: 21.9,
    promotion: {
      enabled: true,
      fromPrice: 24.9,
      label: 'IMPERDÍVEL'
    },
    status: 'ONLINE',
    battery: 49,
    category: 'Higiene',
    unitLabel: 'R$/un',
    corridor: 'Corredor 12',
    location: 'Setor D > Corredor 12 > Gôndola 4',
    lastUpdate: '2026-02-11T09:09:00.000Z'
  },
  {
    tagId: 'TAG-0017',
    sku: 'SKU-50001',
    productName: 'Detergente Líquido 500ml',
    price: 3.19,
    status: 'ONLINE',
    battery: 58,
    category: 'Limpeza',
    unitLabel: 'R$/un',
    corridor: 'Corredor 14',
    location: 'Setor E > Corredor 14 > Gôndola 2',
    lastUpdate: '2026-02-11T08:31:00.000Z'
  },
  {
    tagId: 'TAG-0018',
    sku: 'SKU-50002',
    productName: 'Água Sanitária 2L',
    price: 7.79,
    status: 'ONLINE',
    battery: 36,
    category: 'Limpeza',
    unitLabel: 'R$/un',
    corridor: 'Corredor 14',
    location: 'Setor E > Corredor 14 > Gôndola 3',
    lastUpdate: '2026-02-11T09:02:00.000Z'
  },
  {
    tagId: 'TAG-0019',
    sku: 'SKU-50003',
    productName: 'Desinfetante Lavanda 1L',
    price: 6.29,
    status: 'OFFLINE',
    battery: 16,
    category: 'Limpeza',
    unitLabel: 'R$/un',
    corridor: 'Corredor 15',
    location: 'Setor E > Corredor 15 > Gôndola 1',
    lastUpdate: '2026-02-11T06:28:00.000Z'
  },
  {
    tagId: 'TAG-0020',
    sku: 'SKU-50004',
    productName: 'Esponja Multiuso 3un',
    price: 4.15,
    status: 'ONLINE',
    battery: 90,
    category: 'Limpeza',
    unitLabel: 'R$/un',
    corridor: 'Corredor 15',
    location: 'Setor E > Corredor 15 > Gôndola 2',
    lastUpdate: '2026-02-11T09:24:00.000Z'
  },
  {
    tagId: 'TAG-0021',
    sku: 'SKU-60001',
    productName: 'Banana Prata 1kg',
    price: 6.99,
    status: 'ONLINE',
    battery: 74,
    category: 'Hortifruti',
    unitLabel: 'R$/kg',
    corridor: 'Corredor 17',
    location: 'Setor F > Corredor 17 > Banca 1',
    lastUpdate: '2026-02-11T08:25:00.000Z'
  },
  {
    tagId: 'TAG-0022',
    sku: 'SKU-60002',
    productName: 'Maçã Gala 1kg',
    price: 9.49,
    promotion: {
      enabled: true,
      fromPrice: 11.99,
      label: 'OFERTA'
    },
    status: 'ONLINE',
    battery: 67,
    category: 'Hortifruti',
    unitLabel: 'R$/kg',
    corridor: 'Corredor 17',
    location: 'Setor F > Corredor 17 > Banca 2',
    lastUpdate: '2026-02-11T09:12:00.000Z'
  },
  {
    tagId: 'TAG-0023',
    sku: 'SKU-60003',
    productName: 'Tomate Italiano 1kg',
    price: 7.99,
    status: 'OFFLINE',
    battery: 18,
    category: 'Hortifruti',
    unitLabel: 'R$/kg',
    corridor: 'Corredor 18',
    location: 'Setor F > Corredor 18 > Banca 1',
    lastUpdate: '2026-02-11T07:12:00.000Z'
  },
  {
    tagId: 'TAG-0024',
    sku: 'SKU-60004',
    productName: 'Batata Inglesa 1kg',
    price: 5.99,
    status: 'ONLINE',
    battery: 29,
    category: 'Hortifruti',
    unitLabel: 'R$/kg',
    corridor: 'Corredor 18',
    location: 'Setor F > Corredor 18 > Banca 3',
    lastUpdate: '2026-02-11T08:52:00.000Z'
  }
];

export const tagCategories = Array.from(new Set(tagsMock.map((tag) => tag.category))).sort();

export const tagCorridors = Array.from(new Set(tagsMock.map((tag) => tag.corridor))).sort();
