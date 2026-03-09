import type { PriceUpdateItem, SingleUpdatePayload, SingleUpdateResponse, UpdatePollResponse } from '../types/updates';
import { API_MODE } from './api';
import { upsertProduct } from './esl/productService';
import { triggerRefresh } from './esl/refreshService';
import { querySpecificStatus } from './esl/statusService';
import { simulateNetwork } from './api';

type StatusProbabilities = {
  fastConfirm: number;
  slowConfirm: number;
  failed: number;
};

const statusProbabilities: StatusProbabilities = {
  fastConfirm: 0.7,
  slowConfirm: 0.2,
  failed: 0.1
};

const requestTagMap = new Map<string, string>();

function buildRequestId(prefix: string) {
  const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix}-${Date.now()}-${randomPart}`;
}

function getAckScenario(): 'FAST_CONFIRM' | 'SLOW_CONFIRM' | 'FAILED' {
  const draw = Math.random();

  if (draw < statusProbabilities.fastConfirm) {
    return 'FAST_CONFIRM';
  }

  if (draw < statusProbabilities.fastConfirm + statusProbabilities.slowConfirm) {
    return 'SLOW_CONFIRM';
  }

  return 'FAILED';
}

export async function sendSinglePriceUpdate(payload: SingleUpdatePayload): Promise<SingleUpdateResponse> {
  if (API_MODE !== 'mock') {
    // Fluxo real: sincroniza produto + aciona trigger de refresh para a etiqueta alvo.
    const upsertResult = await upsertProduct({
      product_code: payload.sku,
      product_name: payload.productName,
      price: payload.newPrice,
      origin_price: payload.previousPrice,
      promotion: payload.isPromotion ? payload.promotionLabel ?? 'PROMO' : undefined
    });

    if (!upsertResult.success) {
      throw new Error(upsertResult.error_msg || 'Falha ao sincronizar produto com ESL.');
    }

    const refreshResult = await triggerRefresh({ esl_codes: [payload.tagId] });

    if (!refreshResult.success) {
      throw new Error(refreshResult.error_msg || 'Falha ao disparar atualização da etiqueta ESL.');
    }

    const requestId = upsertResult.request_id || buildRequestId('UPD');
    requestTagMap.set(requestId, payload.tagId);

    return {
      requestId,
      status: 'SENT'
    };
  }

  void payload;

  return simulateNetwork(
    {
      requestId: buildRequestId('UPD'),
      status: 'SENT'
    },
    { minMs: 400, maxMs: 900, failRate: 0.04 }
  );
}

export async function pollUpdateStatus(requestId: string): Promise<UpdatePollResponse> {
  if (API_MODE !== 'mock') {
    // Consulta direcionada para confirmar se a etiqueta está online após o disparo.
    const tagId = requestTagMap.get(requestId);

    if (!tagId) {
      return { status: 'CONFIRMED' };
    }

    const statusResult = await querySpecificStatus([tagId], 1, 5);

    if (!statusResult.success) {
      return {
        status: 'FAILED',
        errorMessage: statusResult.error_msg || 'Falha ao consultar status da etiqueta ESL.'
      };
    }

    const snapshot = statusResult.data.find((item) => item.esl_code === tagId);

    if (!snapshot) {
      return {
        status: 'FAILED',
        errorMessage: 'Etiqueta não encontrada no retorno do status ESL.'
      };
    }

    return snapshot.online === 1
      ? { status: 'CONFIRMED' }
      : {
          status: 'FAILED',
          errorMessage: 'Etiqueta offline. Verifique AP/base station e tente novamente.'
        };
  }

  void requestId;
  const scenario = getAckScenario();

  if (scenario === 'SLOW_CONFIRM') {
    return simulateNetwork({ status: 'CONFIRMED' }, { minMs: 400, maxMs: 900, failRate: 0.03 });
  }

  if (scenario === 'FAILED') {
    return simulateNetwork(
      {
        status: 'FAILED',
        errorMessage: 'Falha ao confirmar atualização com a etiqueta. Tente reenviar.'
      },
      { minMs: 400, maxMs: 900, failRate: 0.03 }
    );
  }

  return simulateNetwork({ status: 'CONFIRMED' }, { minMs: 400, maxMs: 900, failRate: 0.03 });
}

export async function simulateBulkItemSend(item: PriceUpdateItem): Promise<PriceUpdateItem> {
  if (API_MODE !== 'mock') {
    // Reaproveita o mesmo pipeline real do fluxo individual.
    if (!item.tagId || !item.sku) {
      return {
        ...item,
        status: 'FAILED',
        errorMessage: 'Linha sem tagId/SKU para envio real ao ESL.'
      };
    }

    const sent = await sendSinglePriceUpdate({
      tagId: item.tagId,
      sku: item.sku,
      productName: item.productName ?? item.sku,
      newPrice: item.newPrice,
      isPromotion: false
    });

    return {
      ...item,
      status: 'SENT',
      requestId: sent.requestId
    };
  }

  return simulateNetwork(
    {
      ...item,
      status: 'SENT',
      requestId: buildRequestId('BULK')
    },
    { minMs: 400, maxMs: 900, failRate: 0.04 }
  );
}

export async function simulateBulkItemAck(item: PriceUpdateItem): Promise<PriceUpdateItem> {
  if (API_MODE !== 'mock') {
    const ack = await pollUpdateStatus(item.requestId ?? buildRequestId('BULK'));

    return {
      ...item,
      status: ack.status,
      errorMessage: ack.errorMessage
    };
  }

  const ack = await pollUpdateStatus(item.requestId ?? buildRequestId('BULK'));

  return {
    ...item,
    status: ack.status,
    errorMessage: ack.errorMessage
  };
}
