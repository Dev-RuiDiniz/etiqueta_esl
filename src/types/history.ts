export type HistoryStatus = 'SENT' | 'CONFIRMED' | 'FAILED';

export type HistorySource = 'MANUAL' | 'BULK' | 'SYSTEM';

export type HistoryItem = {
  id: string;
  createdAt: string;
  tagId: string;
  sku: string;
  productName: string;
  previousPrice: number;
  newPrice: number;
  status: HistoryStatus;
  source: HistorySource;
};

export type HistoryFiltersValues = {
  startDate: string;
  endDate: string;
  sku: string;
  tagId: string;
  status: 'ALL' | 'SUCCESS' | 'FAILED' | 'SENT' | 'CONFIRMED';
};
