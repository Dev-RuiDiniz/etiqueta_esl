// Tipos centrais do domínio ESL compartilhados no frontend.
export type EslCommandResult<TData = unknown> = {
  success: boolean;
  error_code: number;
  error_msg: string;
  request_id: string;
  received_at: string;
  data: TData;
};

export type EslProductUpsertInput = {
  product_code: string;
  product_name: string;
  price: number;
  quantity?: number;
  product_inner_code?: string;
  unit?: string;
  vip_price?: number;
  origin_price?: number;
  promotion?: string;
  extend?: Record<string, string | number | boolean>;
};

export type EslBindingInput = {
  esl_code: string;
  product_code: string;
  template_id?: number;
};

export type EslCatalogSource = 'MANUAL' | 'VENDOR_DISCOVERY';
export type EslCatalogRegistrationStatus = 'PENDING_DISCOVERY' | 'REGISTERED' | 'BOUND' | 'ARCHIVED';

export type EslCatalogItem = {
  esl_code: string;
  display_name: string | null;
  esltype_code: string | null;
  ap_code: string | null;
  expected_ap_code: string | null;
  source: EslCatalogSource;
  registration_status: EslCatalogRegistrationStatus;
  created_at: string;
  updated_at: string;
  last_seen_at: string | null;
  binding: {
    esl_code: string;
    product_code: string;
    template_id?: number | null;
    bound_at: string;
    updated_at: string;
    binding_status: string;
  } | null;
  snapshot: EslStatusSnapshot | null;
};

export type CreateEslCatalogInput = {
  esl_code: string;
  display_name?: string;
  expected_ap_code?: string;
};

export type UpdateEslCatalogInput = {
  display_name?: string | null;
  esltype_code?: string | null;
  ap_code?: string | null;
  expected_ap_code?: string | null;
};

export type BindCatalogEslInput = {
  product_code: string;
  template_id?: number | null;
};

export type EslProductListItem = {
  product_code: string;
  product_name: string;
  price: number;
  quantity: number | null;
  last_synced_at: string;
  sync_status: string;
};

export type EslProductsListResponse = {
  products: EslProductListItem[];
  total: number;
  page: number;
  size: number;
};

export type EslRefreshCommand = {
  esl_codes?: string[];
};

export type EslStatusSnapshot = {
  esl_code: string;
  esl_version: string | null;
  action: number | null;
  online: number;
  esl_battery: number;
  battery_percent: number | null;
  product_code: string | null;
  ap_code: string | null;
  esltype_code: string | null;
  created_at: string | null;
  updated_at: string | null;
  seen_at?: string | null;
};

export type EslStatusSummary = {
  online_count: number;
  offline_count: number;
  total_count: number;
  updated_at: string;
};

export type EslTemplateSummary = {
  id: number;
  esltype_code: string | null;
  esltemplate_name: string | null;
  esltemplate_default: number;
};

export type EslTagOperationalStatus = 'ONLINE' | 'OFFLINE' | 'UNKNOWN';

export type EslStationTagOverview = {
  esl_code: string;
  display_name: string | null;
  ap_code: string | null;
  expected_ap_code: string | null;
  station_code: string;
  esltype_code: string | null;
  status: EslTagOperationalStatus;
  battery: number | null;
  compatibility_known: boolean;
  registration_status: EslCatalogRegistrationStatus;
  binding: EslCatalogItem['binding'];
  snapshot: EslStatusSnapshot | null;
  compatible_templates: EslTemplateSummary[];
};

export type EslStationOverview = {
  station_code: string;
  ap_code: string | null;
  total_tags: number;
  online_tags: number;
  offline_tags: number;
  tags: EslStationTagOverview[];
};

export type EslStationsOverviewResponse = {
  stations: EslStationOverview[];
  totals: {
    stations: number;
    tags: number;
    online: number;
    offline: number;
  };
};

export type EslLedSearchInput = {
  esl_codes: string[];
};

export type EslDirectUpdateInput = {
  esl_code: string;
  template_id?: number;
  product: EslProductUpsertInput;
  led?: {
    r: number;
    g: number;
    b: number;
    time_on: number;
    time: number;
  };
};

export type EslAuditLogEntry = {
  id: string;
  created_at: string;
  operation: string;
  request_id: string;
  success: boolean;
  error_code?: number;
  error_msg?: string;
};
