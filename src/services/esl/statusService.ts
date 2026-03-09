// Serviços de monitoramento de status ESL consumidos pela UI.
import type { EslCommandResult, EslStatusSnapshot, EslStatusSummary } from '../../types/esl';
import { eslGet, eslPost } from './apiClient';

export function getStatusSummary(): Promise<EslCommandResult<EslStatusSummary>> {
  return eslGet('/status/summary');
}

export function syncStatus(): Promise<EslCommandResult<unknown>> {
  return eslPost('/status/sync', {});
}

export function queryEslStatus(page = 1, size = 100): Promise<EslCommandResult<EslStatusSnapshot[]>> {
  return eslGet(`/status?page=${encodeURIComponent(String(page))}&size=${encodeURIComponent(String(size))}`);
}

export function querySpecificStatus(esl_codes: string[], page = 1, size = 100): Promise<EslCommandResult<EslStatusSnapshot[]>> {
  return eslPost('/status/query', { esl_codes, page, size });
}
