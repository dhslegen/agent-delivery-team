-- digital-delivery-team 度量数据库 DDL（严格照父设计文档 §6.2）

CREATE TABLE IF NOT EXISTS projects (
  project_id   TEXT PRIMARY KEY,
  name         TEXT NOT NULL,
  created_at   TEXT NOT NULL,
  baseline_json TEXT
);

CREATE TABLE IF NOT EXISTS sessions (
  session_id   TEXT PRIMARY KEY,
  project_id   TEXT,
  started_at   TEXT,
  ended_at     TEXT,
  duration_ms  INTEGER,
  total_input_tokens  INTEGER,
  total_output_tokens INTEGER
);

CREATE TABLE IF NOT EXISTS tool_calls (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id    TEXT,
  project_id    TEXT,
  tool_name     TEXT,
  started_at    TEXT,
  ended_at      TEXT,
  duration_ms   INTEGER,
  success       INTEGER,
  file_path     TEXT,
  bash_head     TEXT
);

CREATE TABLE IF NOT EXISTS subagent_runs (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id     TEXT,
  project_id     TEXT,
  subagent_name  TEXT,
  started_at     TEXT,
  ended_at       TEXT,
  duration_ms    INTEGER,
  input_tokens   INTEGER,
  output_tokens  INTEGER,
  success        INTEGER
);

CREATE TABLE IF NOT EXISTS quality_metrics (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id    TEXT,
  captured_at   TEXT,
  defects_critical INTEGER DEFAULT 0,
  defects_major    INTEGER DEFAULT 0,
  defects_minor    INTEGER DEFAULT 0,
  coverage_pct     REAL,
  rework_count     INTEGER DEFAULT 0,
  acceptance_pass_pct REAL
);

CREATE INDEX IF NOT EXISTS idx_tool_calls_project ON tool_calls(project_id);
CREATE INDEX IF NOT EXISTS idx_subagent_runs_project ON subagent_runs(project_id);
