export type AlertType = 'LOW_BATTERY' | 'OFFLINE' | 'UPDATE_FAILED';

export type AlertPriority = 'HIGH' | 'MEDIUM';

export type AlertStatus = 'OPEN' | 'RESOLVED';

export interface AlertItem {
  id: string;
  createdAt: string;
  type: AlertType;
  priority: AlertPriority;
  status: AlertStatus;
  tagId: string;
  sku: string;
  productName: string;
  location: string;
  details?: string;
}

export type AlertTypeFilter = AlertType | 'ALL';
export type AlertPriorityFilter = AlertPriority | 'ALL';
export type AlertStatusFilter = 'OPEN' | 'RESOLVED' | 'ALL';

export interface AlertsFiltersValues {
  type: AlertTypeFilter;
  priority: AlertPriorityFilter;
  status: AlertStatusFilter;
  query: string;
}
