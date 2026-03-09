// Serviços de templates (consulta/caching no BFF).
import type { EslCommandResult, EslTemplateSummary } from '../../types/esl';
import { eslGet } from './apiClient';

export function queryTemplates(page = 1, size = 100, forceRefresh = false): Promise<EslCommandResult<EslTemplateSummary[]>> {
  const query = `page=${encodeURIComponent(String(page))}&size=${encodeURIComponent(String(size))}&forceRefresh=${String(forceRefresh)}`;
  return eslGet(`/templates?${query}`);
}
