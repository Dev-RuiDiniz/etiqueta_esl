// Serviços de vínculo etiqueta-produto no frontend.
import type { EslBindingInput, EslCommandResult } from '../../types/esl';
import { eslPost } from './apiClient';

export function bindEsl(input: EslBindingInput): Promise<EslCommandResult<unknown>> {
  return eslPost('/bind', input);
}

export function bindManyEsls(items: EslBindingInput[]): Promise<EslCommandResult<unknown>> {
  return eslPost('/bind/bulk', { items });
}

export function unbindEsl(esl_code: string): Promise<EslCommandResult<unknown>> {
  return eslPost('/unbind', { esl_code });
}
