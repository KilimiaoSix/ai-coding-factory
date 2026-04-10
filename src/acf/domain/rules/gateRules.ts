import type { CodeAnchorRef } from '../../shared/codeAnchor.js'
import {
  createGateDecisionId,
  nowIsoTimestamp,
} from '../../shared/ids.js'
import type { Evidence } from '../verification/Evidence.js'
import type { VerificationRun } from '../verification/VerificationRun.js'
import type { GateDecision } from '../quality/GateDecision.js'
import type { TaskRun } from '../execution/TaskRun.js'

export type GateEvaluationInput = {
  projectId: string
  requirementId: string
  taskRun: TaskRun
  verificationRun?: VerificationRun
  evidence: Evidence[]
  codeAnchorRef: CodeAnchorRef
}

export type GateEvaluator = {
  evaluate(input: GateEvaluationInput): GateDecision
}

export function evaluateGateDecision(
  input: GateEvaluationInput,
): GateDecision {
  const reasons: string[] = []
  const requiredEvidenceIds = input.evidence.map(item => item.id)

  if (!input.codeAnchorRef.gitSha) {
    reasons.push('Missing code anchor git SHA')
  }
  if (!input.verificationRun) {
    reasons.push('Missing verification run')
  } else if (input.verificationRun.status !== 'passed') {
    reasons.push(
      `Verification run did not pass (status=${input.verificationRun.status})`,
    )
  }
  if (input.evidence.length === 0) {
    reasons.push('At least one evidence record is required')
  }

  return {
    id: createGateDecisionId(),
    projectId: input.projectId,
    requirementId: input.requirementId,
    taskRunId: input.taskRun.id,
    verificationRunId: input.verificationRun?.id,
    status: reasons.length === 0 ? 'passed' : 'rejected',
    reasons,
    requiredEvidenceIds,
    codeAnchorRef: input.codeAnchorRef,
    createdAt: nowIsoTimestamp(),
  }
}
