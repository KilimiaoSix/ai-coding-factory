import { z } from 'zod/v4'
import { QUALITY_ITEM_STATUSES } from '../../shared/enums.js'

export const BlockerSchema = z.object({
  id: z.string().min(1),
  projectId: z.string().min(1),
  requirementId: z.string().min(1),
  taskRunId: z.string().optional(),
  title: z.string().min(1),
  description: z.string().min(1),
  status: z.enum(QUALITY_ITEM_STATUSES),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
})
export type Blocker = z.infer<typeof BlockerSchema>
