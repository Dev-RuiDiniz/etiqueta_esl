export type TagStatus = 'ONLINE' | 'OFFLINE';

export type TagPromotion = {
  enabled: boolean;
  fromPrice?: number;
  label?: string;
};

export type Tag = {
  tagId: string;
  sku: string;
  productName: string;
  price: number;
  unitLabel: string;
  promotion?: TagPromotion;
  status: TagStatus;
  battery: number;
  category: string;
  corridor: string;
  location: string;
  lastUpdate: string;
};

export type TagFiltersValues = {
  status: 'ALL' | TagStatus;
  category: string;
  corridor: string;
  query: string;
};
