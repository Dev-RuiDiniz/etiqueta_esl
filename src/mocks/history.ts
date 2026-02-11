import { tagsMock } from './tags';
import type { HistoryItem, HistorySource, HistoryStatus } from '../types/history';

const STATUS_BUCKET: HistoryStatus[] = [
  'CONFIRMED',
  'CONFIRMED',
  'CONFIRMED',
  'CONFIRMED',
  'CONFIRMED',
  'CONFIRMED',
  'CONFIRMED',
  'CONFIRMED',
  'CONFIRMED',
  'CONFIRMED',
  'CONFIRMED',
  'SENT',
  'SENT',
  'SENT',
  'SENT',
  'SENT',
  'SENT',
  'SENT',
  'FAILED',
  'FAILED'
];

const SOURCE_BUCKET: HistorySource[] = ['MANUAL', 'BULK', 'SYSTEM', 'MANUAL', 'BULK', 'SYSTEM', 'MANUAL', 'BULK', 'SYSTEM', 'MANUAL'];

function roundToTwo(value: number) {
  return Math.round(value * 100) / 100;
}

function buildHistoryDate(index: number) {
  const now = new Date();
  const daysAgo = index % 30;
  const hoursAgo = (index * 3) % 24;
  const minutesAgo = (index * 11) % 60;
  const timestamp = now.getTime() - daysAgo * 24 * 60 * 60 * 1000 - hoursAgo * 60 * 60 * 1000 - minutesAgo * 60 * 1000;

  return new Date(timestamp).toISOString();
}

function buildPriceDelta(index: number) {
  const deltaPool = [-1.2, -0.9, -0.6, -0.3, 0.2, 0.45, 0.75, 1.1, 1.35];
  return deltaPool[index % deltaPool.length];
}

export const historyMock: HistoryItem[] = Array.from({ length: 72 }, (_, index) => {
  const tag = tagsMock[index % tagsMock.length];
  const basePrice = tag.price;
  const previousPrice = roundToTwo(Math.max(0.99, basePrice + buildPriceDelta(index)));
  const isResend = index % 14 === 0;
  const nextDelta = roundToTwo(((index % 5) - 2) * 0.35 + 0.25);
  const newPrice = isResend ? previousPrice : roundToTwo(Math.max(0.99, previousPrice + nextDelta));

  return {
    id: `HIST-${String(index + 1).padStart(4, '0')}`,
    createdAt: buildHistoryDate(index),
    tagId: tag.tagId,
    sku: tag.sku,
    productName: tag.productName,
    previousPrice,
    newPrice,
    status: STATUS_BUCKET[index % STATUS_BUCKET.length],
    source: SOURCE_BUCKET[index % SOURCE_BUCKET.length]
  };
}).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
