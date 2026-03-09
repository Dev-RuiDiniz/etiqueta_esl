export function categorizeError(error) {
  if (!error) {
    return 'unknown';
  }

  const code = String(error.code ?? '');

  if (code.startsWith('AUTH_')) {
    return 'auth';
  }

  if (code.startsWith('VALIDATION_') || code === 'INVALID_JSON') {
    return 'validation';
  }

  if (code.startsWith('ESL_UPSTREAM') || code === 'ENOTFOUND' || code === 'ECONNRESET' || code === 'ECONNREFUSED') {
    return 'upstream_vendor';
  }

  if (code.includes('DATABASE') || code.includes('PERSISTENCE') || code === '23505' || /^(?=.*\d)[0-9A-Z]{5}$/.test(code)) {
    return 'database';
  }

  if (code.startsWith('JOB_')) {
    return 'job_runtime';
  }

  return 'runtime';
}

export function toHttpErrorPayload(error, requestId = null) {
  const statusCode = Number(error?.statusCode ?? 500);
  return {
    success: false,
    error_code: statusCode,
    error_msg: error?.message ?? 'Internal server error',
    request_id: requestId ?? `REQ-${Date.now()}`,
    received_at: new Date().toISOString(),
    data: {
      code: error?.code ?? 'INTERNAL_ERROR'
    }
  };
}
