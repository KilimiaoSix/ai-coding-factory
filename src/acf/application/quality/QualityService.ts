import type { GateEvaluator } from '../../domain/rules/gateRules.js'
import { evaluateGateDecision } from '../../domain/rules/gateRules.js'
import type { TaskRunRepository } from '../../storage/sqlite/repositories/ExecutionRepository.js'
import type {
  GateDecisionRepository,
} from '../../storage/sqlite/repositories/QualityRepository.js'
import type {
  EvidenceRepository,
  VerificationRunRepository,
} from '../../storage/sqlite/repositories/VerificationRepository.js'

export class DefaultGateEvaluator implements GateEvaluator {
  evaluate = evaluateGateDecision
}

export class QualityService {
  constructor(
    private readonly taskRuns: TaskRunRepository,
    private readonly verificationRuns: VerificationRunRepository,
    private readonly evidence: EvidenceRepository,
    private readonly gateDecisions: GateDecisionRepository,
    private readonly gateEvaluator: GateEvaluator = new DefaultGateEvaluator(),
  ) {}

  evaluateGate(input: {
    taskRunId: string
    verificationRunId?: string
  }) {
    const taskRun = this.taskRuns.getById(input.taskRunId)
    if (!taskRun) {
      throw new Error(`Task run not found: ${input.taskRunId}`)
    }
    const verificationRun = input.verificationRunId
      ? this.verificationRuns.getById(input.verificationRunId)
      : null
    const evidence = this.evidence.listByColumn('task_run_id', taskRun.id)
    const decision = this.gateEvaluator.evaluate({
      projectId: taskRun.projectId,
      requirementId: taskRun.requirementId,
      taskRun,
      verificationRun: verificationRun ?? undefined,
      evidence,
      codeAnchorRef: taskRun.codeAnchorRef,
    })
    return this.gateDecisions.save(decision)
  }
}
