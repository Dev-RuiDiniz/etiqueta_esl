import { recordLogicalVendorFailure, runWithRetry } from './eslRetryPolicy.js';
import { toVendorBindMultiplePayload, toVendorBindPayload } from './eslMapper.js';

export class EslBindingService {
  constructor({ config, apiClient, refreshService, auditLogService, bindingRepo, deadLetterRepo, metrics, eslCatalogRepo }) {
    this.config = config;
    this.apiClient = apiClient;
    this.refreshService = refreshService;
    this.auditLogService = auditLogService;
    this.bindingRepo = bindingRepo;
    this.deadLetterRepo = deadLetterRepo;
    this.metrics = metrics ?? { trackBusinessEvent() {} };
    this.eslCatalogRepo = eslCatalogRepo;
  }

  async bind(binding) {
    // Bind tem efeito local e remoto: fornecedor recebe o vínculo, o repositório
    // guarda o estado operacional e a fila de refresh garante propagação ao display.
    const payload = toVendorBindPayload(binding);

    const result = await runWithRetry(
      () => this.apiClient.post('/esl/bind', payload),
      {
        operation: 'esl.bind',
        payload,
        meta: { esl_code: payload.f1, product_code: payload.f2 }
      },
      this.config,
      { deadLetterRepo: this.deadLetterRepo }
    );

    await this.auditLogService.record({
      operation: 'esl.bind',
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
          operation: 'esl.bind',
          payload,
          meta: { esl_code: payload.f1, product_code: payload.f2 }
        },
        this.deadLetterRepo
      );
    }

    if (result.success) {
      // Persistimos vínculo localmente para reconciliação e monitoramento.
      await this.bindingRepo.upsertBinding({
        esl_code: binding.esl_code,
        product_code: binding.product_code,
        template_id: binding.template_id
      });
      await this.eslCatalogRepo?.upsertCatalogItem?.({
        esl_code: binding.esl_code,
        source: 'MANUAL',
        registration_status: 'BOUND'
      });
      this.refreshService.enqueueRefresh([binding.esl_code]);
    }

    this.metrics.trackBusinessEvent('tag_bound', result.success ? 'success' : 'failure');

    return result;
  }

  async bindMany(bindings) {
    // O fluxo em lote compartilha a mesma semântica do bind unitário,
    // mas preserva auditoria e reconciliação por item após sucesso.
    const payload = toVendorBindMultiplePayload(bindings);

    const result = await runWithRetry(
      () => this.apiClient.post('/esl/bind_multiple', payload),
      {
        operation: 'esl.bind_multiple',
        payload,
        meta: { count: bindings.length }
      },
      this.config,
      { deadLetterRepo: this.deadLetterRepo }
    );

    await this.auditLogService.record({
      operation: 'esl.bind_multiple',
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
          operation: 'esl.bind_multiple',
          payload,
          meta: { count: bindings.length }
        },
        this.deadLetterRepo
      );
    }

    if (result.success) {
      for (const binding of bindings) {
        await this.bindingRepo.upsertBinding(binding);
        await this.eslCatalogRepo?.upsertCatalogItem?.({
          esl_code: binding.esl_code,
          source: 'MANUAL',
          registration_status: 'BOUND'
        });
      }

      this.refreshService.enqueueRefresh(bindings.map((item) => item.esl_code));
    }

    return result;
  }

  async unbind(eslCode) {
    // Unbind remove o relacionamento lógico, mas ainda agenda refresh para que
    // o estado físico da etiqueta seja atualizado no ciclo seguinte.
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
      this.config,
      { deadLetterRepo: this.deadLetterRepo }
    );

    await this.auditLogService.record({
      operation: 'esl.unbind',
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
          operation: 'esl.unbind',
          payload,
          meta: { esl_code: eslCode }
        },
        this.deadLetterRepo
      );
    }

    if (result.success) {
      // Remove vínculo local e agenda atualização para refletir no display.
      await this.bindingRepo.removeBinding(eslCode);
      await this.eslCatalogRepo?.upsertCatalogItem?.({
        esl_code: eslCode,
        source: 'MANUAL',
        registration_status: 'REGISTERED'
      });
      this.refreshService.enqueueRefresh([eslCode]);
    }

    return result;
  }

  getBinding(eslCode) {
    return this.bindingRepo.getBindingByEslCode(eslCode);
  }
}
