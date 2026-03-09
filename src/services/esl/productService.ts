// Serviços de produto no frontend: encaminham operações para o BFF ESL.
import type { EslCommandResult, EslProductUpsertInput } from '../../types/esl';
import { eslPost } from './apiClient';

export function upsertProduct(product: EslProductUpsertInput): Promise<EslCommandResult<unknown>> {
  return eslPost('/products/upsert', product);
}

export function upsertProducts(items: EslProductUpsertInput[]): Promise<EslCommandResult<unknown>> {
  return eslPost('/products/upsert-bulk', { items });
}
