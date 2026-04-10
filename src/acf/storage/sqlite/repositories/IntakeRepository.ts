import type { Database } from 'bun:sqlite'
import { RequirementDraftSchema } from '../../../domain/intake/RequirementDraft.js'
import { RequirementSchema } from '../../../domain/intake/Requirement.js'
import { JsonEntityRepository } from './BaseRepository.js'

export class RequirementDraftRepository extends JsonEntityRepository<
  ReturnType<typeof RequirementDraftSchema.parse>
> {
  constructor(db: Database) {
    super(db, 'acf_requirement_drafts', RequirementDraftSchema, [
      'project_id',
      'status',
    ])
  }

  save(draft: ReturnType<typeof RequirementDraftSchema.parse>) {
    return this.upsert(draft, {
      project_id: draft.projectId,
      status: draft.status,
    })
  }
}

export class RequirementRepository extends JsonEntityRepository<
  ReturnType<typeof RequirementSchema.parse>
> {
  constructor(db: Database) {
    super(db, 'acf_requirements', RequirementSchema, [
      'project_id',
      'draft_id',
      'status',
    ])
  }

  save(requirement: ReturnType<typeof RequirementSchema.parse>) {
    return this.upsert(requirement, {
      project_id: requirement.projectId,
      draft_id: requirement.draftId,
      status: requirement.status,
    })
  }

  findByDraftId(draftId: string) {
    return this.listByColumn('draft_id', draftId)
  }
}
