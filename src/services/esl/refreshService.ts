// Serviços de refresh e atualização direta via BFF.
import type { EslCommandResult, EslDirectUpdateInput, EslRefreshCommand } from '../../types/esl';
import { eslPost } from './apiClient';

export function triggerRefresh(command: EslRefreshCommand = {}): Promise<EslCommandResult<unknown>> {
  return eslPost('/refresh/trigger', command);
}

export function directUpdate(items: EslDirectUpdateInput[]): Promise<EslCommandResult<unknown>> {
  return eslPost('/direct', { items });
}
