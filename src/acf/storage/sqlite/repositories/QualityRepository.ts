import type { Database } from 'bun:sqlite'
import { BlockerSchema } from '../../../domain/quality/Blocker.js'
import { BugSchema } from '../../../domain/quality/Bug.js'
import { GateDecisionSchema } from '../../../domain/quality/GateDecision.js'
import { ReviewRecordSchema } from '../../../domain/quality/ReviewRecord.js'
import { JsonEntityRepository } from './BaseRepository.js'

export class GateDecisionRepository extends JsonEntityRepository<
  ReturnType<typeof GateDecisionSchema.parse>
> {
  constructor(db: Database) {
    super(db, 'acf_gate_decisions', GateDecisionSchema, [
      'project_id',
      'requirement_id',
      'task_run_id',
      'verification_run_id',
      'status',
      'git_sha',
    ])
  }

  save(decision: ReturnType<typeof GateDecisionSchema.parse>) {
    return this.upsert(decision, {
      project_id: decision.projectId,
      requirement_id: decision.requirementId,
      task_run_id: decision.taskRunId ?? null,
      verification_run_id: decision.verificationRunId ?? null,
      status: decision.status,
      git_sha: decision.codeAnchorRef.gitSha,
    })
  }
}

export class ReviewRecordRepository extends JsonEntityRepository<
  ReturnType<typeof ReviewRecordSchema.parse>
> {
  constructor(db: Database) {
    super(db, 'acf_review_records', ReviewRecordSchema, [
      'project_id',
      'requirement_id',
      'task_run_id',
    ])
  }

  save(record: ReturnType<typeof ReviewRecordSchema.parse>) {
    return this.upsert(record, {
      project_id: record.projectId,
      requirement_id: record.requirementId,
      task_run_id: record.taskRunId ?? null,
    })
  }
}

export class BugRepository extends JsonEntityRepository<
  ReturnType<typeof BugSchema.parse>
> {
  constructor(db: Database) {
    super(db, 'acf_bugs', BugSchema, [
      'project_id',
      'requirement_id',
      'task_run_id',
      'status',
    ])
  }

  save(bug: ReturnType<typeof BugSchema.parse>) {
    return this.upsert(bug, {
      project_id: bug.projectId,
      requirement_id: bug.requirementId,
      task_run_id: bug.taskRunId ?? null,
      status: bug.status,
    })
  }
}

export class BlockerRepository extends JsonEntityRepository<
  ReturnType<typeof BlockerSchema.parse>
> {
  constructor(db: Database) {
    super(db, 'acf_blockers', BlockerSchema, [
      'project_id',
      'requirement_id',
      'task_run_id',
      'status',
    ])
  }

  save(blocker: ReturnType<typeof BlockerSchema.parse>) {
    return this.upsert(blocker, {
      project_id: blocker.projectId,
      requirement_id: blocker.requirementId,
      task_run_id: blocker.taskRunId ?? null,
      status: blocker.status,
    })
  }
}
