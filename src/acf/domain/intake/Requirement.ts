import { z } from 'zod/v4'
import { REQUIREMENT_STATUSES } from '../../shared/enums.js'

export const RequirementSchema = z.object({
  id: z.string().min(1),
  projectId: z.string().min(1),
  draftId: z.string().min(1),
  title: z.string().min(1),
  specification: z.string().min(1),
  status: z.enum(REQUIREMENT_STATUSES),
  startedAt: z.string().optional(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
})
export type Requirement = z.infer<typeof RequirementSchema>
