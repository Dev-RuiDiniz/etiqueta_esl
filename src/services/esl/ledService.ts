// Serviço de busca física por LED (flash da etiqueta).
import type { EslCommandResult, EslLedSearchInput } from '../../types/esl';
import { eslPost } from './apiClient';

export function searchEslLed(input: EslLedSearchInput): Promise<EslCommandResult<unknown>> {
  return eslPost('/led/search', input);
}
