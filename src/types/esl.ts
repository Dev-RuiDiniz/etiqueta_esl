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
