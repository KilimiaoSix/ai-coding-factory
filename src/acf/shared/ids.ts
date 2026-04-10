import { randomUUID } from 'crypto'

export type ProjectId = string
export type ProjectContextSummaryId = string
export type ReadinessChecklistId = string
export type RequirementDraftId = string
export type RequirementId = string
export type ChangeRequestId = string
export type TaskId = string
export type TaskRunId = string
export type TestEnvironmentConfigId = string
export type VerificationRunId = string
export type EvidenceId = string
export type ReviewRecordId = string
export type BugId = string
export type BlockerId = string
export type GateDecisionId = string
export type AgentProfileId = string

function createEntityId(prefix: string): string {
  return `${prefix}_${randomUUID()}`
}

export function nowIsoTimestamp(): string {
  return new Date().toISOString()
}

export function createProjectId(): ProjectId {
  return createEntityId('acf_project')
}

export function createProjectContextSummaryId(): ProjectContextSummaryId {
  return createEntityId('acf_project_context')
}

export function createReadinessChecklistId(): ReadinessChecklistId {
  return createEntityId('acf_readiness')
}

export function createRequirementDraftId(): RequirementDraftId {
  return createEntityId('acf_requirement_draft')
}

export function createRequirementId(): RequirementId {
  return createEntityId('acf_requirement')
}

export function createChangeRequestId(): ChangeRequestId {
  return createEntityId('acf_change_request')
}

export function createTaskId(): TaskId {
  return createEntityId('acf_task')
}

export function createTaskRunId(): TaskRunId {
  return createEntityId('acf_task_run')
}

export function createTestEnvironmentConfigId(): TestEnvironmentConfigId {
  return createEntityId('acf_test_env')
}

export function createVerificationRunId(): VerificationRunId {
  return createEntityId('acf_verification_run')
}

export function createEvidenceId(): EvidenceId {
  return createEntityId('acf_evidence')
}

export function createReviewRecordId(): ReviewRecordId {
  return createEntityId('acf_review')
}

export function createBugId(): BugId {
  return createEntityId('acf_bug')
}

export function createBlockerId(): BlockerId {
  return createEntityId('acf_blocker')
}

export function createGateDecisionId(): GateDecisionId {
  return createEntityId('acf_gate')
}

export function createAgentProfileId(): AgentProfileId {
  return createEntityId('acf_agent_profile')
}
