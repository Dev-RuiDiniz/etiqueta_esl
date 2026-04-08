import type { AuthUser } from './auth';
import type { DashboardSummary } from './dashboard';

export type AdminUser = AuthUser;

export type StationOverviewItem = {
  station_code: string;
  ap_code: string | null;
  total_tags: number;
  online_tags: number;
  offline_tags: number;
};

export type AdminRecentAlert = {
  id: string;
  operation: string;
  status: string;
  created_at: string;
  last_error: string;
  attempts: number;
};

export type AdminDashboardSummary = {
  users: {
    total: number;
    active: number;
    by_role: Record<string, number>;
    recent: AdminUser[];
  };
  esl: DashboardSummary;
  stations: {
    totals: {
      stations: number;
      tags: number;
      online: number;
      offline: number;
    };
    recent: StationOverviewItem[];
  };
  templates: {
    total: number;
    by_type: Record<string, number>;
  };
  alerts: {
    pending_dead_letters: number;
    recent: AdminRecentAlert[];
  };
};
