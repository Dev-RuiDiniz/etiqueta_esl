CREATE TABLE IF NOT EXISTS esl_bindings (
  esl_code TEXT PRIMARY KEY,
  product_code TEXT NOT NULL,
  template_id INTEGER NULL,
  bound_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
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
  created_at TIMESTAMPTZ NULL,
  updated_at TIMESTAMPTZ NULL,
  seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_esl_status_snapshots_updated_at ON esl_status_snapshots (updated_at DESC);

CREATE TABLE IF NOT EXISTS esl_command_log (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
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
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  operation TEXT NOT NULL,
  payload JSONB NULL,
  error JSONB NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  meta JSONB NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  last_error TEXT NULL,
  processed_at TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS idx_dead_letters_created_at ON dead_letters (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dead_letters_operation ON dead_letters (operation);
CREATE INDEX IF NOT EXISTS idx_dead_letters_status ON dead_letters (status);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens (user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_revoked_expires_at ON refresh_tokens (revoked, expires_at);
