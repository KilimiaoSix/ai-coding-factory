import type { RequirementDraft } from '../intake/RequirementDraft.js'
import type { Requirement } from '../intake/Requirement.js'
import {
  createRequirementId,
  nowIsoTimestamp,
} from '../../shared/ids.js'

export type StartRequirementInput = {
  draft: RequirementDraft
  specification?: string
}

export function assertRequirementDraftCanStart(
  draft: RequirementDraft,
): RequirementDraft {
  if (draft.status === 'archived') {
    throw new Error('Archived requirement drafts cannot be started')
  }
  if (!draft.title.trim()) {
    throw new Error('Requirement draft title is required')
  }
  if (!draft.problemStatement.trim()) {
    throw new Error('Requirement draft problem statement is required')
  }
  if (!draft.requestedOutcome.trim()) {
    throw new Error('Requirement draft requested outcome is required')
  }
  return draft
}

export function materializeRequirementFromDraft(
  input: StartRequirementInput,
): Requirement {
  const draft = assertRequirementDraftCanStart(input.draft)
  const timestamp = nowIsoTimestamp()
  const specification =
    input.specification?.trim() ||
    [
      `Problem: ${draft.problemStatement}`,
      `Requested outcome: ${draft.requestedOutcome}`,
    ].join('\n\n')

  return {
    id: createRequirementId(),
    projectId: draft.projectId,
    draftId: draft.id,
    title: draft.title,
    specification,
    status: 'started',
    startedAt: timestamp,
    createdAt: timestamp,
    updatedAt: timestamp,
  }
}
