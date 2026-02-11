import type { PriceUpdateItem, SingleUpdatePayload, SingleUpdateResponse, UpdatePollResponse } from '../types/updates';
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
  const ack = await pollUpdateStatus(item.requestId ?? buildRequestId('BULK'));

  return {
    ...item,
    status: ack.status,
    errorMessage: ack.errorMessage
  };
}
