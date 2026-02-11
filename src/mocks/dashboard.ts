import type { DashboardSummary } from '../types/dashboard';

export const dashboardSummaryMock: DashboardSummary = {
  kpis: {
    totalTags: 1280,
    online: 1214,
    offline: 66,
    lowBattery: 38
  },
  offlineByCorridor: [
    { corridor: 'Corredor 1', offline: 7 },
    { corridor: 'Corredor 2', offline: 11 },
    { corridor: 'Corredor 3', offline: 9 },
    { corridor: 'Corredor 4', offline: 14 },
    { corridor: 'Corredor 5', offline: 10 },
    { corridor: 'Corredor 6', offline: 8 },
    { corridor: 'Corredor 7', offline: 4 },
    { corridor: 'Corredor 8', offline: 3 }
  ],
  lastUpdate: {
    timestamp: '2026-02-11T12:40:00.000Z',
    status: 'Online'
  }
};
