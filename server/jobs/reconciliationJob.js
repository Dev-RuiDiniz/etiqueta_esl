// Job de reconciliação para corrigir divergências entre vínculo interno e estado remoto.
export function startReconciliationJob({ statusService, bindingService, bindingRepo, refreshService, intervalMs, logger = console, metrics = null }) {
  let running = false;

  const timer = setInterval(async () => {
    if (running) {
      return;
    }

    running = true;

    try {
      const bindings = await bindingRepo.listBindings();
      if (bindings.length === 0) {
        metrics?.trackJobRun?.('reconciliation', 'success');
        return;
      }

      const codes = bindings.map((item) => item.esl_code);
      const statusResult = await statusService.querySpecificStatus({ esl_codes: codes, page: 1, size: codes.length });

      if (!statusResult.success) {
        logger.error({ result: statusResult }, '[job:reconciliation] status query failed');
        metrics?.trackJobRun?.('reconciliation', 'failed');
        return;
      }

      const statusByCode = new Map(statusResult.data.map((item) => [item.esl_code, item]));

      for (const binding of bindings) {
        const status = statusByCode.get(binding.esl_code);

        if (!status) {
          continue;
        }

        const expectedProductCode = String(binding.product_code ?? '');
        const actualProductCode = String(status.product_code ?? '');

        if (expectedProductCode && actualProductCode && expectedProductCode !== actualProductCode) {
          logger.warn({
            esl_code: binding.esl_code,
            expected_product_code: expectedProductCode,
            actual_product_code: actualProductCode
          }, '[job:reconciliation] binding mismatch');

          await bindingService.unbind(binding.esl_code);
          await bindingService.bind(binding);
          await refreshService.triggerRefresh();
        }
      }
      metrics?.trackJobRun?.('reconciliation', 'success');
    } catch (error) {
      logger.error({ err: error }, '[job:reconciliation] crashed');
      metrics?.trackJobRun?.('reconciliation', 'failed');
    } finally {
      running = false;
    }
  }, intervalMs);

  return () => {
    clearInterval(timer);
  };
}
