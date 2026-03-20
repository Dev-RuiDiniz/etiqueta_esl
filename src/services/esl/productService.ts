// Serviços de produto no frontend: encaminham operações para o BFF ESL.
import type { EslCommandResult, EslProductUpsertInput, EslProductsListResponse } from '../../types/esl';
import { eslGet, eslPost } from './apiClient';

export function upsertProduct(product: EslProductUpsertInput): Promise<EslCommandResult<unknown>> {
  return eslPost('/products/upsert', product);
}

export function upsertProducts(items: EslProductUpsertInput[]): Promise<EslCommandResult<unknown>> {
  return eslPost('/products/upsert-bulk', { items });
}

export function listProducts(page = 1, size = 100): Promise<EslCommandResult<EslProductsListResponse>> {
  return eslGet(`/products?page=${encodeURIComponent(String(page))}&size=${encodeURIComponent(String(size))}`);
}
