import type { Database } from 'bun:sqlite'
import {
  ProjectContextSummarySchema,
} from '../../../domain/project/ProjectContextSummary.js'
import { ProjectSchema } from '../../../domain/project/Project.js'
import {
  ReadinessChecklistSchema,
} from '../../../domain/project/ReadinessChecklist.js'
import { JsonEntityRepository } from './BaseRepository.js'

export class ProjectRepository extends JsonEntityRepository<
  ReturnType<typeof ProjectSchema.parse>
> {
  constructor(db: Database) {
    super(db, 'acf_projects', ProjectSchema, ['repo_root', 'status'])
  }

  save(project: ReturnType<typeof ProjectSchema.parse>) {
    return this.upsert(project, {
      repo_root: project.repoRoot,
      status: project.status,
    })
  }

  findByRepoRoot(repoRoot: string) {
    return this.listByColumn('repo_root', repoRoot)
  }
}

export class ProjectContextSummaryRepository extends JsonEntityRepository<
  ReturnType<typeof ProjectContextSummarySchema.parse>
> {
  constructor(db: Database) {
    super(db, 'acf_project_context_summaries', ProjectContextSummarySchema, [
      'project_id',
    ])
  }

  save(summary: ReturnType<typeof ProjectContextSummarySchema.parse>) {
    return this.upsert(summary, {
      project_id: summary.projectId,
    })
  }
}

export class ReadinessChecklistRepository extends JsonEntityRepository<
  ReturnType<typeof ReadinessChecklistSchema.parse>
> {
  constructor(db: Database) {
    super(db, 'acf_readiness_checklists', ReadinessChecklistSchema, [
      'project_id',
      'status',
    ])
  }

  save(checklist: ReturnType<typeof ReadinessChecklistSchema.parse>) {
    return this.upsert(checklist, {
      project_id: checklist.projectId,
      status: checklist.status,
    })
  }
}
