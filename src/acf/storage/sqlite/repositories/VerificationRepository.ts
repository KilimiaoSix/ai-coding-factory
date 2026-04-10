import type { Database } from 'bun:sqlite'
import {
  EvidenceSchema,
} from '../../../domain/verification/Evidence.js'
import {
  TestEnvironmentConfigSchema,
} from '../../../domain/verification/TestEnvironmentConfig.js'
import {
  VerificationRunSchema,
} from '../../../domain/verification/VerificationRun.js'
import { JsonEntityRepository } from './BaseRepository.js'

export class TestEnvironmentConfigRepository extends JsonEntityRepository<
  ReturnType<typeof TestEnvironmentConfigSchema.parse>
> {
  constructor(db: Database) {
    super(db, 'acf_test_environment_configs', TestEnvironmentConfigSchema, [
      'project_id',
      'target',
    ])
  }

  save(config: ReturnType<typeof TestEnvironmentConfigSchema.parse>) {
    return this.upsert(config, {
      project_id: config.projectId,
      target: config.target,
    })
  }
}

export class VerificationRunRepository extends JsonEntityRepository<
  ReturnType<typeof VerificationRunSchema.parse>
> {
  constructor(db: Database) {
    super(db, 'acf_verification_runs', VerificationRunSchema, [
      'project_id',
      'task_run_id',
      'requirement_id',
      'status',
      'git_sha',
    ])
  }

  save(run: ReturnType<typeof VerificationRunSchema.parse>) {
    return this.upsert(run, {
      project_id: run.projectId,
      task_run_id: run.taskRunId,
      requirement_id: run.requirementId,
      status: run.status,
      git_sha: run.codeAnchorRef.gitSha,
    })
  }
}

export class EvidenceRepository extends JsonEntityRepository<
  ReturnType<typeof EvidenceSchema.parse>
> {
  constructor(db: Database) {
    super(db, 'acf_evidence', EvidenceSchema, [
      'project_id',
      'task_run_id',
      'verification_run_id',
      'kind',
    ])
  }

  save(evidence: ReturnType<typeof EvidenceSchema.parse>) {
    return this.upsert(evidence, {
      project_id: evidence.projectId,
      task_run_id: evidence.taskRunId ?? null,
      verification_run_id: evidence.verificationRunId ?? null,
      kind: evidence.kind,
    })
  }
}
