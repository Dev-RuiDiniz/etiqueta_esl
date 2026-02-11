import type { PriceUpdateItem, SingleUpdatePayload, SingleUpdateResponse, UpdatePollResponse } from '../types/updates';

type DelayConfig = {
  min: number;
  max: number;
};

type StatusProbabilities = {
  fastConfirm: number;
  slowConfirm: number;
  failed: number;
};

const SEND_DELAY: DelayConfig = { min: 400, max: 1200 };
const ACK_FAST_DELAY: DelayConfig = { min: 1000, max: 2000 };
const ACK_SLOW_DELAY: DelayConfig = { min: 2200, max: 3000 };

const statusProbabilities: StatusProbabilities = {
  fastConfirm: 0.7,
  slowConfirm: 0.2,
  failed: 0.1
};

function wait(delayMs: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, delayMs);
  });
}

function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

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
  await wait(randomBetween(SEND_DELAY.min, SEND_DELAY.max));

  return {
    requestId: buildRequestId('UPD'),
    status: 'SENT'
  };
}

export async function pollUpdateStatus(requestId: string): Promise<UpdatePollResponse> {
  void requestId;
  const scenario = getAckScenario();

  if (scenario === 'SLOW_CONFIRM') {
    await wait(randomBetween(ACK_SLOW_DELAY.min, ACK_SLOW_DELAY.max));
    return { status: 'CONFIRMED' };
  }

  await wait(randomBetween(ACK_FAST_DELAY.min, ACK_FAST_DELAY.max));

  if (scenario === 'FAILED') {
    return {
      status: 'FAILED',
      errorMessage: 'Falha ao confirmar atualização com a etiqueta. Tente reenviar.'
    };
  }

  return { status: 'CONFIRMED' };
}

export async function simulateBulkItemSend(item: PriceUpdateItem): Promise<PriceUpdateItem> {
  await wait(randomBetween(SEND_DELAY.min, SEND_DELAY.max));
  return {
    ...item,
    status: 'SENT',
    requestId: buildRequestId('BULK')
  };
}

export async function simulateBulkItemAck(item: PriceUpdateItem): Promise<PriceUpdateItem> {
  const ack = await pollUpdateStatus(item.requestId ?? buildRequestId('BULK'));

  return {
    ...item,
    status: ack.status,
    errorMessage: ack.errorMessage
  };
}
