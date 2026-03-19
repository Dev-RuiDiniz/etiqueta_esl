export const REQUIRED_SQLITE_TABLES = [
  'esl_bindings',
  'esl_status_snapshots',
  'esl_command_log',
  'dead_letters',
  'users',
  'refresh_tokens',
  'products'
];

export const SQLITE_SCHEMA_SQL = `
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
  success INTEGER NOT NULL,
  error_code INTEGER NULL,
  error_msg TEXT NULL,
  payload TEXT NULL,
  response TEXT NULL,
  meta TEXT NULL
);

CREATE INDEX IF NOT EXISTS idx_esl_command_log_created_at ON esl_command_log (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_esl_command_log_operation ON esl_command_log (operation);
CREATE INDEX IF NOT EXISTS idx_esl_command_log_request_id ON esl_command_log (request_id);

CREATE TABLE IF NOT EXISTS dead_letters (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  operation TEXT NOT NULL,
  payload TEXT NULL,
  error TEXT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  meta TEXT NULL,
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
  revoked INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  revoked_at TEXT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens (user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_revoked_expires_at ON refresh_tokens (revoked, expires_at);

CREATE TABLE IF NOT EXISTS products (
  product_code TEXT PRIMARY KEY,
  product_name TEXT NOT NULL,
  price REAL NOT NULL,
  quantity INTEGER NULL,
  unit TEXT NULL,
  vip_price REAL NULL,
  origin_price REAL NULL,
  promotion TEXT NULL,
  last_synced_at TEXT NOT NULL,
  sync_status TEXT NOT NULL DEFAULT 'PENDING'
);

CREATE INDEX IF NOT EXISTS idx_products_sync_status ON products (sync_status);
`;
