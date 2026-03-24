import type {
  BindCatalogEslInput,
  CreateEslCatalogInput,
  EslCatalogItem,
  EslCommandResult,
  EslStationsOverviewResponse,
  UpdateEslCatalogInput
} from '../../types/esl';
import { eslGet, eslPatch, eslPost } from './apiClient';

export function listCatalog(): Promise<EslCommandResult<EslCatalogItem[]>> {
  return eslGet('/catalog');
}

export function getStationsOverview(): Promise<EslCommandResult<EslStationsOverviewResponse>> {
  return eslGet('/stations/overview');
}

export function createCatalogItem(input: CreateEslCatalogInput): Promise<EslCommandResult<EslCatalogItem>> {
  return eslPost('/catalog', input);
}

export function importCatalogFromVendor(page_size = 100): Promise<EslCommandResult<{ imported_count: number; total_count: number }>> {
  return eslPost('/catalog/import', { page_size });
}

export function updateCatalogItem(eslCode: string, input: UpdateEslCatalogInput): Promise<EslCommandResult<EslCatalogItem>> {
  return eslPatch(`/catalog/${encodeURIComponent(eslCode)}`, input);
}

export function bindCatalogItem(eslCode: string, input: BindCatalogEslInput): Promise<EslCommandResult<unknown>> {
  return eslPost(`/catalog/${encodeURIComponent(eslCode)}/bind`, input);
}

export function unbindCatalogItem(eslCode: string): Promise<EslCommandResult<unknown>> {
  return eslPost(`/catalog/${encodeURIComponent(eslCode)}/unbind`, {});
}

export function searchCatalogItem(eslCode: string): Promise<EslCommandResult<unknown>> {
  return eslPost(`/catalog/${encodeURIComponent(eslCode)}/search`, {});
}
