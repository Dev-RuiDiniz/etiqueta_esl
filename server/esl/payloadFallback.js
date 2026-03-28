import { recordLogicalVendorFailure, runWithRetry } from './eslRetryPolicy.js';

function isPayloadShapeError(result) {
  const message = String(result?.error_msg ?? '').toLowerCase();

  return (
    message.includes('array') ||
    message.includes('string') ||
    message.includes('json') ||
    message.includes('format') ||
    message.includes('field')
  );
}

export async function postWithPayloadVariants({ apiClient, path, payloadVariants, context, config, deadLetterRepo }) {
  let lastResult = null;
  let lastPayload = null;
  let lastVariant = null;

  for (let index = 0; index < payloadVariants.length; index += 1) {
    const variant = payloadVariants[index];
    const isLast = index === payloadVariants.length - 1;

    const result = await runWithRetry(
      () => apiClient.post(path, variant.payload),
      {
        operation: context.operation,
        payload: variant.payload,
        meta: {
          ...(context.meta ?? {}),
          payload_variant: variant.name
        }
      },
      config,
      { deadLetterRepo: isLast ? deadLetterRepo : null }
    );

    lastResult = result;
    lastPayload = variant.payload;
    lastVariant = variant.name;

    if (result.success) {
      return { result, payload: variant.payload, variant: variant.name };
    }

    if (!isLast && isPayloadShapeError(result)) {
      continue;
    }

    if (!isLast) {
      break;
    }
  }

  if (lastResult?.success === false) {
    await recordLogicalVendorFailure(
      lastResult,
      {
        operation: context.operation,
        payload: lastPayload,
        meta: {
          ...(context.meta ?? {}),
          payload_variant: lastVariant
        }
      },
      deadLetterRepo
    );
  }

  return { result: lastResult, payload: lastPayload, variant: lastVariant };
}
