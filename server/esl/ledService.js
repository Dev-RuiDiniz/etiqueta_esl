import { runWithRetry } from './eslRetryPolicy.js';
import { toVendorSearchPayload } from './eslMapper.js';

export class EslLedService {
  constructor({ config, apiClient, auditLogService }) {
    this.config = config;
    this.apiClient = apiClient;
    this.auditLogService = auditLogService;
  }

  async search(eslCodes) {
    const payload = toVendorSearchPayload(eslCodes);

    const result = await runWithRetry(
      () => this.apiClient.post('/esl/search', payload),
      {
        operation: 'esl.search',
        payload,
        meta: { count: eslCodes.length }
      },
      this.config
    );

    this.auditLogService.record({
      operation: 'esl.search',
      payload,
      request_id: result.request_id,
      success: result.success,
      error_code: result.error_code,
      error_msg: result.error_msg,
      response: result.data
    });

    return result;
  }
}
