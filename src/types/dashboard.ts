export type DashboardKpis = {
  totalTags: number;
  online: number;
  offline: number;
  lowBattery: number;
};

export type OfflineCorridorPoint = {
  corridor: string;
  offline: number;
};

export type LastUpdateStatus = 'Online' | 'Offline' | 'Atenção';

export type DashboardLastUpdate = {
  timestamp: string;
  status: LastUpdateStatus;
};

export type DashboardSummary = {
  kpis: DashboardKpis;
  offlineByCorridor: OfflineCorridorPoint[];
  lastUpdate: DashboardLastUpdate;
};
