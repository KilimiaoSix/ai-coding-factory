import { z } from 'zod/v4'

export const ProjectContextSummarySchema = z.object({
  id: z.string().min(1),
  projectId: z.string().min(1),
  summary: z.string().min(1),
  sourceRefs: z.array(z.string()).default([]),
  generatedAt: z.string().min(1),
})
export type ProjectContextSummary = z.infer<typeof ProjectContextSummarySchema>
