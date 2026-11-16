-- Saif Tech Global LLC — AI-operated Company Service Infrastructure.
-- Working Mode engagements (chat → brief → design → AI price → payment → AI build/test → delivery / refund),
-- membership tokens (STG-M-…), Centralized 24/7 Helpline, observer Admin Panel.
-- Money is integer minor units (cents). Times are unix seconds.

CREATE TABLE customers (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  created_at INTEGER NOT NULL
);

CREATE TABLE auth_codes (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  used INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);
CREATE INDEX idx_auth_codes_email ON auth_codes(email, created_at);

CREATE TABLE sessions (
  token_hash TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL REFERENCES customers(id),
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX idx_sessions_customer ON sessions(customer_id);

CREATE TABLE rate_limits (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);

CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at INTEGER NOT NULL,
  updated_by TEXT NOT NULL
);

CREATE TABLE settings_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  updated_at INTEGER NOT NULL,
  updated_by TEXT NOT NULL
);

CREATE TABLE admin_users (
  email TEXT PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('owner','admin','support','viewer')),
  created_at INTEGER NOT NULL,
  created_by TEXT NOT NULL
);

-- ---------------- Working Mode engagements ----------------
CREATE TABLE engagements (
  id TEXT PRIMARY KEY,                       -- STG-2026-XXXXXX
  access_hash TEXT NOT NULL,                 -- SHA-256 of the browser's engagement key (anonymous access)
  customer_id TEXT REFERENCES customers(id), -- set when the client signs in (required to pay)
  title TEXT,
  stage TEXT NOT NULL CHECK (stage IN ('discovery','brief','design','quoted','awaiting_payment','building','delivered','refunded','cancelled')),
  brief_json TEXT,
  brief_md TEXT,
  buildable INTEGER,
  design_kind TEXT CHECK (design_kind IN ('ui_mockup','solution_outline')),
  design_html TEXT,
  design_md TEXT,
  design_version INTEGER NOT NULL DEFAULT 0,
  tests_json TEXT,                           -- frozen acceptance tests, written before any code
  price_cents INTEGER,
  currency TEXT,
  price_json TEXT,                           -- AI pricing rationale
  quote_expires_at INTEGER,
  build_attempts INTEGER NOT NULL DEFAULT 0,
  build_state TEXT,                          -- queued | running | passed | failed
  delivered_build_id TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX idx_engagements_customer ON engagements(customer_id, updated_at);
CREATE INDEX idx_engagements_stage ON engagements(stage, updated_at);

CREATE TABLE engagement_messages (
  id TEXT PRIMARY KEY,
  engagement_id TEXT NOT NULL REFERENCES engagements(id),
  role TEXT NOT NULL CHECK (role IN ('user','assistant','notice')),
  kind TEXT NOT NULL DEFAULT 'chat',          -- chat | brief | design | price | payment | build | delivery | refund
  content TEXT NOT NULL,
  model TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX idx_emsg ON engagement_messages(engagement_id, created_at);

CREATE TABLE payments (
  id TEXT PRIMARY KEY,
  engagement_id TEXT NOT NULL REFERENCES engagements(id),
  customer_id TEXT NOT NULL REFERENCES customers(id),
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('created','pending','succeeded','failed','cancelled','refund_pending','refunded','refund_failed')),
  provider TEXT NOT NULL,
  provider_session_id TEXT,
  provider_payment_id TEXT,
  checkout_url TEXT,
  refund_id TEXT,
  refund_reason TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX idx_payments_engagement ON payments(engagement_id);

CREATE TABLE webhook_events (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  type TEXT,
  received_at INTEGER NOT NULL,
  processed_at INTEGER,
  result TEXT
);

CREATE TABLE builds (
  id TEXT PRIMARY KEY,
  engagement_id TEXT NOT NULL REFERENCES engagements(id),
  attempt INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('running','passed','failed','error')),
  exit_code INTEGER,
  test_output TEXT,
  model TEXT,
  started_at INTEGER NOT NULL,
  finished_at INTEGER,
  UNIQUE (engagement_id, attempt)
);

CREATE TABLE build_files (
  build_id TEXT NOT NULL REFERENCES builds(id),
  path TEXT NOT NULL,
  content TEXT NOT NULL,
  PRIMARY KEY (build_id, path)
);

-- Lifetime membership: issued by the AI on first successful delivery.
CREATE TABLE members (
  token TEXT PRIMARY KEY,                    -- STG-M-XXXXXXXX
  customer_id TEXT NOT NULL UNIQUE REFERENCES customers(id),
  first_engagement_id TEXT REFERENCES engagements(id),
  issued_at INTEGER NOT NULL
);

-- ---------------- Centralized Helpline ----------------
CREATE TABLE helpline_sessions (
  id TEXT PRIMARY KEY,
  customer_id TEXT REFERENCES customers(id),
  platform TEXT NOT NULL,
  platform_verified INTEGER NOT NULL DEFAULT 0,
  platform_subject TEXT,
  member_token TEXT,
  created_at INTEGER NOT NULL
);

CREATE TABLE helpline_messages (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES helpline_sessions(id),
  role TEXT NOT NULL CHECK (role IN ('user','assistant')),
  content TEXT NOT NULL,
  model TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX idx_hmsg_session ON helpline_messages(session_id, created_at);

CREATE TABLE tickets (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL REFERENCES customers(id),
  platform TEXT NOT NULL,
  platform_verified INTEGER NOT NULL DEFAULT 0,
  engagement_id TEXT REFERENCES engagements(id),
  member INTEGER NOT NULL DEFAULT 0,
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','answered','escalated','resolved','closed')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low','normal','high','urgent')),
  session_id TEXT REFERENCES helpline_sessions(id),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX idx_tickets_customer ON tickets(customer_id, updated_at);
CREATE INDEX idx_tickets_status ON tickets(status, updated_at);

CREATE TABLE ticket_messages (
  id TEXT PRIMARY KEY,
  ticket_id TEXT NOT NULL REFERENCES tickets(id),
  author_type TEXT NOT NULL CHECK (author_type IN ('customer','ai','staff','system')),
  author TEXT NOT NULL,
  content TEXT NOT NULL,
  internal INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);
CREATE INDEX idx_tmsg_ticket ON ticket_messages(ticket_id, created_at);

-- ---------------- Knowledge, AI usage, audit ----------------
CREATE TABLE kb_docs (
  id TEXT PRIMARY KEY,
  scope TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  verified INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL,
  updated_by TEXT NOT NULL
);
CREATE INDEX idx_kb_scope ON kb_docs(scope, verified);

CREATE TABLE ai_usage (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task TEXT NOT NULL,
  model TEXT NOT NULL,
  ok INTEGER NOT NULL,
  latency_ms INTEGER NOT NULL,
  input_chars INTEGER,
  output_chars INTEGER,
  error TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX idx_ai_usage_time ON ai_usage(created_at);

CREATE TABLE audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  actor TEXT NOT NULL,
  action TEXT NOT NULL,
  target TEXT,
  detail TEXT,
  ip TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX idx_audit_time ON audit_log(created_at);
