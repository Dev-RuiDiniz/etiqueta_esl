import { getBindingByEslCode, removeBinding, upsertBinding } from '../db/eslBindingRepo.js';
import { runWithRetry } from './eslRetryPolicy.js';
import { toVendorBindMultiplePayload, toVendorBindPayload } from './eslMapper.js';

export class EslBindingService {
  constructor({ config, apiClient, refreshService, auditLogService }) {
    this.config = config;
    this.apiClient = apiClient;
    this.refreshService = refreshService;
    this.auditLogService = auditLogService;
  }

  async bind(binding) {
    const payload = toVendorBindPayload(binding);

    const result = await runWithRetry(
      () => this.apiClient.post('/esl/bind', payload),
      {
        operation: 'esl.bind',
        payload,
        meta: { esl_code: payload.f1, product_code: payload.f2 }
      },
      this.config
    );

    this.auditLogService.record({
      operation: 'esl.bind',
      payload,
      request_id: result.request_id,
      success: result.success,
      error_code: result.error_code,
      error_msg: result.error_msg,
      response: result.data
    });

    if (result.success) {
      // Persistimos vínculo localmente para reconciliação e monitoramento.
      upsertBinding({
        esl_code: binding.esl_code,
        product_code: binding.product_code,
        template_id: binding.template_id
      });
      this.refreshService.enqueueRefresh([binding.esl_code]);
    }

    return result;
  }

  async bindMany(bindings) {
    const payload = toVendorBindMultiplePayload(bindings);

    const result = await runWithRetry(
      () => this.apiClient.post('/esl/bind_multiple', payload),
      {
        operation: 'esl.bind_multiple',
        payload,
        meta: { count: bindings.length }
      },
      this.config
    );

    this.auditLogService.record({
      operation: 'esl.bind_multiple',
      payload,
      request_id: result.request_id,
      success: result.success,
      error_code: result.error_code,
      error_msg: result.error_msg,
      response: result.data
    });

    if (result.success) {
      for (const binding of bindings) {
        upsertBinding(binding);
      }

      this.refreshService.enqueueRefresh(bindings.map((item) => item.esl_code));
    }

    return result;
  }

  async unbind(eslCode) {
    const payload = {
      f1: eslCode
    };

    const result = await runWithRetry(
      () => this.apiClient.post('/esl/unbind', payload),
      {
        operation: 'esl.unbind',
        payload,
        meta: { esl_code: eslCode }
      },
      this.config
    );

    this.auditLogService.record({
      operation: 'esl.unbind',
      payload,
      request_id: result.request_id,
      success: result.success,
      error_code: result.error_code,
      error_msg: result.error_msg,
      response: result.data
    });

    if (result.success) {
      // Remove vínculo local e agenda atualização para refletir no display.
      removeBinding(eslCode);
      this.refreshService.enqueueRefresh([eslCode]);
    }

    return result;
  }

  getBinding(eslCode) {
    return getBindingByEslCode(eslCode);
  }
}
