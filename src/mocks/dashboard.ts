import type { DashboardSummary } from '../types/dashboard';

export const dashboardSummaryMock: DashboardSummary = {
  kpis: {
    totalTags: 1280,
    online: 1214,
    offline: 66,
    lowBattery: 38
  },
  offlineByCorridor: [
    { corridor: 'Corredor 01', offline: 7 },
    { corridor: 'Corredor 02', offline: 11 },
    { corridor: 'Corredor 03', offline: 9 },
    { corridor: 'Corredor 04', offline: 14 },
    { corridor: 'Corredor 05', offline: 10 },
    { corridor: 'Corredor 06', offline: 8 },
    { corridor: 'Corredor 07', offline: 7 }
  ],
  lastUpdate: {
    timestamp: '2026-02-11T12:40:00.000Z',
    status: 'Online'
  }
};
