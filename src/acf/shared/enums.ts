export const PROJECT_STATUSES = ['draft', 'active', 'archived'] as const
export type ProjectStatus = (typeof PROJECT_STATUSES)[number]

export const READINESS_STATUSES = ['draft', 'ready', 'blocked'] as const
export type ReadinessStatus = (typeof READINESS_STATUSES)[number]

export const REQUIREMENT_DRAFT_STATUSES = [
  'draft',
  'ready_for_start',
  'archived',
] as const
export type RequirementDraftStatus = (typeof REQUIREMENT_DRAFT_STATUSES)[number]

export const REQUIREMENT_STATUSES = [
  'draft',
  'started',
  'in_progress',
  'completed',
  'blocked',
] as const
export type RequirementStatus = (typeof REQUIREMENT_STATUSES)[number]

export const TASK_TYPES = ['implementation', 'verification', 'review'] as const
export type TaskType = (typeof TASK_TYPES)[number]

export const TASK_RUN_STATUSES = [
  'pending',
  'queued',
  'running',
  'completed',
  'failed',
  'cancelled',
] as const
export type TaskRunStatus = (typeof TASK_RUN_STATUSES)[number]

export const VERIFICATION_TARGETS = ['backend', 'web', 'generic'] as const
export type VerificationTarget = (typeof VERIFICATION_TARGETS)[number]

export const VERIFICATION_RUN_STATUSES = [
  'pending',
  'running',
  'passed',
  'failed',
] as const
export type VerificationRunStatus =
  (typeof VERIFICATION_RUN_STATUSES)[number]

export const EVIDENCE_KINDS = [
  'runtime_event',
  'transcript',
  'artifact',
  'verification',
  'review',
] as const
export type EvidenceKind = (typeof EVIDENCE_KINDS)[number]

export const GATE_DECISION_STATUSES = [
  'pending',
  'passed',
  'rejected',
] as const
export type GateDecisionStatus = (typeof GATE_DECISION_STATUSES)[number]

export const QUALITY_ITEM_STATUSES = ['open', 'resolved'] as const
export type QualityItemStatus = (typeof QUALITY_ITEM_STATUSES)[number]

export const AGENT_PROFILE_SOURCES = [
  'built-in',
  'userSettings',
  'projectSettings',
  'policySettings',
  'flagSettings',
  'plugin',
  'unknown',
] as const
export type AgentProfileSource = (typeof AGENT_PROFILE_SOURCES)[number]

export const RUNTIME_ADAPTER_KINDS = [
  'native_cli',
  'claude_code_proxy',
  'codex_proxy',
] as const
export type RuntimeAdapterKind = (typeof RUNTIME_ADAPTER_KINDS)[number]
