export type UpdateStatus = 'SENT' | 'CONFIRMED' | 'FAILED';

export type SingleUpdatePayload = {
  tagId: string;
  sku: string;
  productName: string;
  newPrice: number;
  isPromotion: boolean;
  previousPrice?: number;
  promotionLabel?: string;
};

export type PriceUpdateItem = {
  id: string;
  tagId?: string;
  sku?: string;
  productName?: string;
  newPrice: number;
  status: UpdateStatus;
  requestId?: string;
  errorMessage?: string;
};

export type SingleUpdateResponse = {
  requestId: string;
  status: 'SENT';
};

export type UpdatePollResponse = {
  status: 'CONFIRMED' | 'FAILED';
  errorMessage?: string;
};
