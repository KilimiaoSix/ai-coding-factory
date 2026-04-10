import { z } from 'zod/v4'

export const ReviewRecordSchema = z.object({
  id: z.string().min(1),
  projectId: z.string().min(1),
  requirementId: z.string().min(1),
  taskRunId: z.string().optional(),
  summary: z.string().min(1),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
})
export type ReviewRecord = z.infer<typeof ReviewRecordSchema>
