import {
  ProjectContextSummarySchema,
  type ProjectContextSummary,
} from '../../domain/project/ProjectContextSummary.js'
import {
  createProjectContextSummaryId,
  nowIsoTimestamp,
} from '../../shared/ids.js'

export type ContextAnalysisSnapshotInput = {
  projectId: string
  summary: string
  sourceRefs?: string[]
}

export class ContextAnalysisAdapter {
  createSummaryFromSnapshot(
    input: ContextAnalysisSnapshotInput,
  ): ProjectContextSummary {
    return ProjectContextSummarySchema.parse({
      id: createProjectContextSummaryId(),
      projectId: input.projectId,
      summary: input.summary,
      sourceRefs: input.sourceRefs ?? [],
      generatedAt: nowIsoTimestamp(),
    })
  }
}
