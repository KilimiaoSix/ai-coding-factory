import { z } from 'zod/v4'
import { REQUIREMENT_DRAFT_STATUSES } from '../../shared/enums.js'

export const RequirementDraftSchema = z.object({
  id: z.string().min(1),
  projectId: z.string().min(1),
  title: z.string().min(1),
  problemStatement: z.string().min(1),
  requestedOutcome: z.string().min(1),
  sourceRefs: z.array(z.string()).default([]),
  status: z.enum(REQUIREMENT_DRAFT_STATUSES),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
})
export type RequirementDraft = z.infer<typeof RequirementDraftSchema>
