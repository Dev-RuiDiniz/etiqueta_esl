import { recordLogicalVendorFailure, runWithRetry } from './eslRetryPolicy.js';
import { toVendorSearchPayload } from './eslMapper.js';
import { postWithPayloadVariants } from './payloadFallback.js';

export class EslLedService {
  constructor({ config, apiClient, auditLogService, deadLetterRepo }) {
    this.config = config;
    this.apiClient = apiClient;
    this.auditLogService = auditLogService;
    this.deadLetterRepo = deadLetterRepo;
  }

  async search(eslCodes) {
    const { result, payload } = await postWithPayloadVariants({
      apiClient: this.apiClient,
      path: '/esl/search',
      payloadVariants: [
        { name: 'json-string', payload: toVendorSearchPayload(eslCodes, true) },
        { name: 'raw-array', payload: toVendorSearchPayload(eslCodes, false) }
      ],
      context: {
        operation: 'esl.search',
        meta: { count: eslCodes.length }
      },
      config: this.config,
      deadLetterRepo: this.deadLetterRepo
    });

    await this.auditLogService.record({
      operation: 'esl.search',
      payload,
      request_id: result.request_id,
      success: result.success,
      error_code: result.error_code,
      error_msg: result.error_msg,
      response: result.data
    });

    if (!result.success) {
      await recordLogicalVendorFailure(
        result,
        {
          operation: 'esl.search',
          payload,
          meta: { count: eslCodes.length }
        },
        this.deadLetterRepo
      );
    }

    return result;
  }
}
