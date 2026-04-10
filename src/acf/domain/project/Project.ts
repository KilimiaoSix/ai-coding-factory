import { z } from 'zod/v4'
import { PROJECT_STATUSES } from '../../shared/enums.js'

export const ProjectSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  name: z.string().min(1),
  repoRoot: z.string().min(1),
  status: z.enum(PROJECT_STATUSES),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
})
export type Project = z.infer<typeof ProjectSchema>
