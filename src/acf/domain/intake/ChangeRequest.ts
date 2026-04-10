import { z } from 'zod/v4'

export const ChangeRequestSchema = z.object({
  id: z.string().min(1),
  projectId: z.string().min(1),
  requirementId: z.string().min(1),
  title: z.string().min(1),
  rationale: z.string().min(1),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
})
export type ChangeRequest = z.infer<typeof ChangeRequestSchema>
