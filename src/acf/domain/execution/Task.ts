import { z } from 'zod/v4'
import { TASK_TYPES } from '../../shared/enums.js'

export const TaskSchema = z.object({
  id: z.string().min(1),
  projectId: z.string().min(1),
  requirementId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  taskType: z.enum(TASK_TYPES),
  runtimeAdapter: z.string().min(1),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
})
export type Task = z.infer<typeof TaskSchema>
