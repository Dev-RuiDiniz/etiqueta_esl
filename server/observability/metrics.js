import { Counter, Gauge, Histogram, Registry, collectDefaultMetrics } from 'prom-client';

function normalizePath(pathname) {
  if (!pathname) {
    return 'unknown';
  }

  return pathname
    .replace(/\/[0-9]+/g, '/:id')
    .replace(/\/[A-Fa-f0-9]{8,}/g, '/:token');
}

export function createMetrics(config, { refreshService, deadLetterRepo } = {}) {
  const enabled = config.metricsEnabled;
  const registry = new Registry();

  if (!enabled) {
    return {
      enabled,
      registry,
      startHttpTimer() {
        return () => {};
      },
      trackVendorRequest() {},
      trackError() {},
      trackJobRun() {},
      trackBusinessEvent() {},
      async render() {
        return '';
      }
    };
  }

  collectDefaultMetrics({ register: registry, prefix: 'esl_bff_' });

  const httpDuration = new Histogram({
    name: 'esl_bff_http_request_duration_seconds',
    help: 'Duracao das requisicoes HTTP do BFF',
    labelNames: ['method', 'path', 'status_code'],
    buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5],
    registers: [registry]
  });

  const httpRequests = new Counter({
    name: 'esl_bff_http_requests_total',
    help: 'Total de requisicoes HTTP do BFF',
    labelNames: ['method', 'path', 'status_code'],
    registers: [registry]
  });

  const errorTotal = new Counter({
    name: 'esl_bff_errors_total',
    help: 'Total de erros do BFF por categoria',
    labelNames: ['category'],
    registers: [registry]
  });

  const vendorDuration = new Histogram({
    name: 'esl_bff_vendor_request_duration_seconds',
    help: 'Duracao de chamadas para API do fornecedor',
    labelNames: ['endpoint', 'status_bucket'],
    buckets: [0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10],
    registers: [registry]
  });

  const vendorErrors = new Counter({
    name: 'esl_bff_vendor_errors_total',
    help: 'Total de erros em chamadas para API do fornecedor',
    labelNames: ['endpoint', 'error_type'],
    registers: [registry]
  });

  const jobRuns = new Counter({
    name: 'esl_bff_job_runs_total',
    help: 'Total de execucoes de jobs por resultado',
    labelNames: ['job_name', 'result'],
    registers: [registry]
  });

  // Contadores de eventos de negócio para observabilidade de domínio.
  const productsSynced = new Counter({
    name: 'esl_bff_products_synced_total',
    help: 'Total de produtos sincronizados com o fornecedor ESL',
    labelNames: ['result'],
    registers: [registry]
  });

  const tagsBound = new Counter({
    name: 'esl_bff_tags_bound_total',
    help: 'Total de etiquetas vinculadas a produtos',
    labelNames: ['result'],
    registers: [registry]
  });

  const refreshesTriggered = new Counter({
    name: 'esl_bff_refreshes_triggered_total',
    help: 'Total de ciclos de refresh disparados',
    labelNames: ['result'],
    registers: [registry]
  });

  const refreshQueueGauge = new Gauge({
    name: 'esl_bff_refresh_queue_size',
    help: 'Quantidade de etiquetas na fila de refresh',
    registers: [registry]
  });

  const deadLetterGauge = new Gauge({
    name: 'esl_bff_dead_letter_size',
    help: 'Quantidade de itens na dead-letter queue',
    registers: [registry]
  });

  if (refreshService && typeof refreshService.getQueuedRefreshCount === 'function') {
    refreshQueueGauge.collect = () => {
      refreshQueueGauge.set(refreshService.getQueuedRefreshCount());
    };
  }

  if (deadLetterRepo && typeof deadLetterRepo.countDeadLetters === 'function') {
    deadLetterGauge.collect = async () => {
      const count = await deadLetterRepo.countDeadLetters();
      deadLetterGauge.set(count);
    };
  }

  function startHttpTimer(method, pathname) {
    const stop = httpDuration.startTimer();
    const path = normalizePath(pathname);

    return (statusCode) => {
      const status = String(statusCode ?? 500);
      stop({ method, path, status_code: status });
      httpRequests.inc({ method, path, status_code: status });
    };
  }

  function trackVendorRequest(endpoint, durationSeconds, statusCode, errorType = null) {
    const statusBucket = statusCode >= 500 ? '5xx' : statusCode >= 400 ? '4xx' : '2xx';
    vendorDuration.observe({ endpoint, status_bucket: statusBucket }, durationSeconds);

    if (errorType) {
      vendorErrors.inc({ endpoint, error_type: errorType });
    }
  }

  function trackError(category) {
    errorTotal.inc({ category });
  }

  function trackJobRun(jobName, result) {
    jobRuns.inc({ job_name: jobName, result });
  }

  function trackBusinessEvent(event, result) {
    if (event === 'product_synced') productsSynced.inc({ result });
    else if (event === 'tag_bound') tagsBound.inc({ result });
    else if (event === 'refresh_triggered') refreshesTriggered.inc({ result });
  }

  async function render() {
    return registry.metrics();
  }

  return {
    enabled,
    registry,
    startHttpTimer,
    trackVendorRequest,
    trackError,
    trackJobRun,
    trackBusinessEvent,
    render
  };
}
