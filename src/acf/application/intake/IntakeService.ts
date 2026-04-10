import {
  ProjectSchema,
  type Project,
} from '../../domain/project/Project.js'
import {
  ProjectContextSummarySchema,
  type ProjectContextSummary,
} from '../../domain/project/ProjectContextSummary.js'
import {
  ReadinessChecklistSchema,
  type ReadinessChecklist,
} from '../../domain/project/ReadinessChecklist.js'
import {
  RequirementDraftSchema,
  type RequirementDraft,
} from '../../domain/intake/RequirementDraft.js'
import { type Requirement } from '../../domain/intake/Requirement.js'
import { materializeRequirementFromDraft } from '../../domain/rules/startRules.js'
import {
  createProjectId,
  createReadinessChecklistId,
  createRequirementDraftId,
  nowIsoTimestamp,
} from '../../shared/ids.js'
import type {
  ProjectContextSummaryRepository,
  ProjectRepository,
  ReadinessChecklistRepository,
} from '../../storage/sqlite/repositories/ProjectRepository.js'
import type {
  RequirementDraftRepository,
  RequirementRepository,
} from '../../storage/sqlite/repositories/IntakeRepository.js'

export type CreateProjectInput = {
  slug: string
  name: string
  repoRoot: string
}

export type CreateRequirementDraftInput = {
  projectId: string
  title: string
  problemStatement: string
  requestedOutcome: string
  sourceRefs?: string[]
}

export class IntakeService {
  constructor(
    private readonly projects: ProjectRepository,
    private readonly contextSummaries: ProjectContextSummaryRepository,
    private readonly readinessChecklists: ReadinessChecklistRepository,
    private readonly drafts: RequirementDraftRepository,
    private readonly requirements: RequirementRepository,
  ) {}

  createProject(input: CreateProjectInput): Project {
    const timestamp = nowIsoTimestamp()
    const project = ProjectSchema.parse({
      id: createProjectId(),
      slug: input.slug,
      name: input.name,
      repoRoot: input.repoRoot,
      status: 'draft',
      createdAt: timestamp,
      updatedAt: timestamp,
    })
    return this.projects.save(project)
  }

  createProjectContextSummary(
    summary: ProjectContextSummary,
  ): ProjectContextSummary {
    return this.contextSummaries.save(ProjectContextSummarySchema.parse(summary))
  }

  createReadinessChecklist(input: {
    projectId: string
    contextSummaryId?: string
    items: Array<{
      key: string
      label: string
      status: 'pending' | 'done' | 'blocked'
      notes?: string
    }>
    status?: 'draft' | 'ready' | 'blocked'
  }): ReadinessChecklist {
    const checklist = ReadinessChecklistSchema.parse({
      id: createReadinessChecklistId(),
      projectId: input.projectId,
      contextSummaryId: input.contextSummaryId,
      status: input.status ?? 'draft',
      items: input.items,
      generatedAt: nowIsoTimestamp(),
    })
    return this.readinessChecklists.save(checklist)
  }

  createRequirementDraft(input: CreateRequirementDraftInput): RequirementDraft {
    const timestamp = nowIsoTimestamp()
    const draft = RequirementDraftSchema.parse({
      id: createRequirementDraftId(),
      projectId: input.projectId,
      title: input.title,
      problemStatement: input.problemStatement,
      requestedOutcome: input.requestedOutcome,
      sourceRefs: input.sourceRefs ?? [],
      status: 'draft',
      createdAt: timestamp,
      updatedAt: timestamp,
    })
    return this.drafts.save(draft)
  }

  startRequirement(input: {
    draftId: string
    specification?: string
  }): Requirement {
    const draft = this.drafts.getById(input.draftId)
    if (!draft) {
      throw new Error(`Requirement draft not found: ${input.draftId}`)
    }

    const preparedDraft = this.drafts.save({
      ...draft,
      status: 'ready_for_start',
      updatedAt: nowIsoTimestamp(),
    })
    const requirement = materializeRequirementFromDraft({
      draft: preparedDraft,
      specification: input.specification,
    })
    return this.requirements.save(requirement)
  }
}
