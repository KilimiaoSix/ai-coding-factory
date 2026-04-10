export const INITIAL_ACF_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS acf_schema_migrations (
  version TEXT PRIMARY KEY,
  applied_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS acf_projects (
  id TEXT PRIMARY KEY,
  repo_root TEXT NOT NULL,
  status TEXT NOT NULL,
  payload TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS acf_project_context_summaries (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  payload TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS acf_readiness_checklists (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  status TEXT NOT NULL,
  payload TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS acf_requirement_drafts (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  status TEXT NOT NULL,
  payload TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS acf_requirements (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  draft_id TEXT NOT NULL,
  status TEXT NOT NULL,
  payload TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS acf_tasks (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  requirement_id TEXT NOT NULL,
  task_type TEXT NOT NULL,
  payload TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS acf_task_runs (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  task_id TEXT NOT NULL,
  requirement_id TEXT NOT NULL,
  status TEXT NOT NULL,
  session_id TEXT NOT NULL,
  git_sha TEXT NOT NULL,
  payload TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS acf_test_environment_configs (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  target TEXT NOT NULL,
  payload TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS acf_verification_runs (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  task_run_id TEXT NOT NULL,
  requirement_id TEXT NOT NULL,
  status TEXT NOT NULL,
  git_sha TEXT NOT NULL,
  payload TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS acf_evidence (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  task_run_id TEXT,
  verification_run_id TEXT,
  kind TEXT NOT NULL,
  payload TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS acf_gate_decisions (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  requirement_id TEXT NOT NULL,
  task_run_id TEXT,
  verification_run_id TEXT,
  status TEXT NOT NULL,
  git_sha TEXT NOT NULL,
  payload TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS acf_review_records (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  requirement_id TEXT NOT NULL,
  task_run_id TEXT,
  payload TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS acf_bugs (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  requirement_id TEXT NOT NULL,
  task_run_id TEXT,
  status TEXT NOT NULL,
  payload TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS acf_blockers (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  requirement_id TEXT NOT NULL,
  task_run_id TEXT,
  status TEXT NOT NULL,
  payload TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS acf_agent_profiles (
  id TEXT PRIMARY KEY,
  runtime_agent_type TEXT NOT NULL,
  source TEXT NOT NULL,
  payload TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_acf_projects_repo_root ON acf_projects(repo_root);
CREATE INDEX IF NOT EXISTS idx_acf_requirement_drafts_project ON acf_requirement_drafts(project_id);
CREATE INDEX IF NOT EXISTS idx_acf_requirements_project ON acf_requirements(project_id);
CREATE INDEX IF NOT EXISTS idx_acf_tasks_requirement ON acf_tasks(requirement_id);
CREATE INDEX IF NOT EXISTS idx_acf_task_runs_task ON acf_task_runs(task_id);
CREATE INDEX IF NOT EXISTS idx_acf_task_runs_requirement ON acf_task_runs(requirement_id);
CREATE INDEX IF NOT EXISTS idx_acf_verification_runs_task_run ON acf_verification_runs(task_run_id);
CREATE INDEX IF NOT EXISTS idx_acf_evidence_task_run ON acf_evidence(task_run_id);
CREATE INDEX IF NOT EXISTS idx_acf_evidence_verification_run ON acf_evidence(verification_run_id);
CREATE INDEX IF NOT EXISTS idx_acf_gate_decisions_requirement ON acf_gate_decisions(requirement_id);
CREATE INDEX IF NOT EXISTS idx_acf_agent_profiles_runtime_agent_type ON acf_agent_profiles(runtime_agent_type);
`
