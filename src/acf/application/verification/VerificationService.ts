import {
  EvidenceSchema,
  type Evidence,
} from '../../domain/verification/Evidence.js'
import {
  TestEnvironmentConfigSchema,
  type TestEnvironmentConfig,
} from '../../domain/verification/TestEnvironmentConfig.js'
import {
  VerificationRunSchema,
  type VerificationRun,
} from '../../domain/verification/VerificationRun.js'
import {
  createTestEnvironmentConfigId,
  createVerificationRunId,
  nowIsoTimestamp,
} from '../../shared/ids.js'
import type { TaskRunRepository } from '../../storage/sqlite/repositories/ExecutionRepository.js'
import type {
  EvidenceRepository,
  TestEnvironmentConfigRepository,
  VerificationRunRepository,
} from '../../storage/sqlite/repositories/VerificationRepository.js'
import { EvidenceIndex } from '../../storage/artifacts/EvidenceIndex.js'

export class VerificationService {
  constructor(
    private readonly taskRuns: TaskRunRepository,
    private readonly testEnvironmentConfigs: TestEnvironmentConfigRepository,
    private readonly verificationRuns: VerificationRunRepository,
    private readonly evidence: EvidenceRepository,
    private readonly evidenceIndex: EvidenceIndex,
  ) {}

  createTestEnvironmentConfig(input: {
    projectId: string
    target: 'backend' | 'web' | 'generic'
    command: string
    cwd?: string
    env?: Record<string, string>
  }): TestEnvironmentConfig {
    const timestamp = nowIsoTimestamp()
    const config = TestEnvironmentConfigSchema.parse({
      id: createTestEnvironmentConfigId(),
      projectId: input.projectId,
      target: input.target,
      command: input.command,
      cwd: input.cwd,
      env: input.env ?? {},
      createdAt: timestamp,
      updatedAt: timestamp,
    })
    return this.testEnvironmentConfigs.save(config)
  }

  startVerificationRun(input: {
    taskRunId: string
    testEnvironmentConfigId?: string
    summary?: string
  }): VerificationRun {
    const taskRun = this.taskRuns.getById(input.taskRunId)
    if (!taskRun) {
      throw new Error(`Task run not found: ${input.taskRunId}`)
    }

    const timestamp = nowIsoTimestamp()
    const run = VerificationRunSchema.parse({
      id: createVerificationRunId(),
      projectId: taskRun.projectId,
      requirementId: taskRun.requirementId,
      taskRunId: taskRun.id,
      testEnvironmentConfigId: input.testEnvironmentConfigId,
      status: 'running',
      summary: input.summary,
      codeAnchorRef: taskRun.codeAnchorRef,
      evidenceIds: [],
      startedAt: timestamp,
      createdAt: timestamp,
      updatedAt: timestamp,
    })
    return this.verificationRuns.save(run)
  }

  async saveEvidence(evidence: Evidence): Promise<Evidence> {
    const persisted = this.evidence.save(EvidenceSchema.parse(evidence))
    await this.evidenceIndex.write(persisted)
    return persisted
  }

  completeVerificationRun(input: {
    verificationRunId: string
    status: 'passed' | 'failed'
    summary?: string
    evidenceIds: string[]
  }): VerificationRun {
    const current = this.verificationRuns.getById(input.verificationRunId)
    if (!current) {
      throw new Error(`Verification run not found: ${input.verificationRunId}`)
    }
    const completed = VerificationRunSchema.parse({
      ...current,
      status: input.status,
      summary: input.summary ?? current.summary,
      evidenceIds: input.evidenceIds,
      completedAt: nowIsoTimestamp(),
      updatedAt: nowIsoTimestamp(),
    })
    return this.verificationRuns.save(completed)
  }
}
