import { z } from 'zod/v4'
import { TASK_RUN_STATUSES } from '../../shared/enums.js'
import { CodeAnchorRefSchema } from '../../shared/codeAnchor.js'
import { WorktreeRefSchema } from '../../shared/refs.js'

export const TaskRunSchema = z.object({
  id: z.string().min(1),
  taskId: z.string().min(1),
  projectId: z.string().min(1),
  requirementId: z.string().min(1),
  status: z.enum(TASK_RUN_STATUSES),
  runtimeAdapter: z.string().min(1),
  prompt: z.string().min(1),
  sessionId: z.string().min(1),
  worktreeRef: WorktreeRefSchema,
  codeAnchorRef: CodeAnchorRefSchema,
  startedAt: z.string().optional(),
  completedAt: z.string().optional(),
  errorMessage: z.string().optional(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
})
export type TaskRun = z.infer<typeof TaskRunSchema>
