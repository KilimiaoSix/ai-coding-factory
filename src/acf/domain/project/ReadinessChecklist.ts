import { z } from 'zod/v4'
import { READINESS_STATUSES } from '../../shared/enums.js'

export const ReadinessChecklistItemSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  status: z.enum(['pending', 'done', 'blocked']),
  notes: z.string().optional(),
})
export type ReadinessChecklistItem = z.infer<
  typeof ReadinessChecklistItemSchema
>

export const ReadinessChecklistSchema = z.object({
  id: z.string().min(1),
  projectId: z.string().min(1),
  contextSummaryId: z.string().optional(),
  status: z.enum(READINESS_STATUSES),
  items: z.array(ReadinessChecklistItemSchema),
  generatedAt: z.string().min(1),
})
export type ReadinessChecklist = z.infer<typeof ReadinessChecklistSchema>
