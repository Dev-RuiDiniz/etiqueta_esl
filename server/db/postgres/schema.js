export const REQUIRED_POSTGRES_TABLES = [
  'esl_catalog',
  'esl_bindings',
  'esl_status_snapshots',
  'esl_command_log',
  'dead_letters',
  'users',
  'refresh_tokens',
  'products'
];

export const POSTGRES_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS esl_catalog (
  esl_code TEXT PRIMARY KEY,
  display_name TEXT NULL,
  esltype_code TEXT NULL,
  ap_code TEXT NULL,
  expected_ap_code TEXT NULL,
  source TEXT NOT NULL DEFAULT 'MANUAL',
  registration_status TEXT NOT NULL DEFAULT 'REGISTERED',
  last_seen_at TEXT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_esl_catalog_source ON esl_catalog (source);
CREATE INDEX IF NOT EXISTS idx_esl_catalog_registration_status ON esl_catalog (registration_status);
CREATE INDEX IF NOT EXISTS idx_esl_catalog_expected_ap_code ON esl_catalog (expected_ap_code);

CREATE TABLE IF NOT EXISTS esl_bindings (
  esl_code TEXT PRIMARY KEY,
  product_code TEXT NOT NULL,
  template_id INTEGER NULL,
  bound_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  binding_status TEXT NOT NULL DEFAULT 'BOUND'
);

CREATE INDEX IF NOT EXISTS idx_esl_bindings_product_code ON esl_bindings (product_code);

CREATE TABLE IF NOT EXISTS esl_status_snapshots (
  esl_code TEXT PRIMARY KEY,
  esl_version TEXT NULL,
  action INTEGER NULL,
  online INTEGER NOT NULL DEFAULT 0,
  esl_battery INTEGER NOT NULL DEFAULT 0,
  battery_percent INTEGER NULL,
  product_code TEXT NULL,
  ap_code TEXT NULL,
  esltype_code TEXT NULL,
  created_at TEXT NULL,
  updated_at TEXT NULL,
  seen_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_esl_status_snapshots_updated_at ON esl_status_snapshots (updated_at DESC);

CREATE TABLE IF NOT EXISTS esl_command_log (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  operation TEXT NOT NULL,
  request_id TEXT NULL,
  success BOOLEAN NOT NULL,
  error_code INTEGER NULL,
  error_msg TEXT NULL,
  payload JSONB NULL,
  response JSONB NULL,
  meta JSONB NULL
);

CREATE INDEX IF NOT EXISTS idx_esl_command_log_created_at ON esl_command_log (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_esl_command_log_operation ON esl_command_log (operation);
CREATE INDEX IF NOT EXISTS idx_esl_command_log_request_id ON esl_command_log (request_id);

CREATE TABLE IF NOT EXISTS dead_letters (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  operation TEXT NOT NULL,
  payload JSONB NULL,
  error JSONB NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  meta JSONB NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  last_error TEXT NULL,
  processed_at TEXT NULL
);

CREATE INDEX IF NOT EXISTS idx_dead_letters_created_at ON dead_letters (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dead_letters_operation ON dead_letters (operation);
CREATE INDEX IF NOT EXISTS idx_dead_letters_status ON dead_letters (status);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  revoked BOOLEAN NOT NULL DEFAULT false,
  created_at TEXT NOT NULL,
  revoked_at TEXT NULL,
  CONSTRAINT fk_refresh_tokens_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens (user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_revoked_expires_at ON refresh_tokens (revoked, expires_at);

CREATE TABLE IF NOT EXISTS products (
  product_inner_code TEXT NULL,
  product_code TEXT PRIMARY KEY,
  product_name TEXT NOT NULL,
  spec TEXT NULL,
  grade TEXT NULL,
  price DOUBLE PRECISION NOT NULL,
  quantity INTEGER NULL,
  unit TEXT NULL,
  vip_price DOUBLE PRECISION NULL,
  origin_price DOUBLE PRECISION NULL,
  origin TEXT NULL,
  manufacturer TEXT NULL,
  promotion TEXT NULL,
  last_synced_at TEXT NOT NULL,
  sync_status TEXT NOT NULL DEFAULT 'PENDING'
);

CREATE INDEX IF NOT EXISTS idx_products_sync_status ON products (sync_status);
`;
