import { z } from 'zod/v4'
import { VERIFICATION_RUN_STATUSES } from '../../shared/enums.js'
import { CodeAnchorRefSchema } from '../../shared/codeAnchor.js'

export const VerificationRunSchema = z.object({
  id: z.string().min(1),
  projectId: z.string().min(1),
  requirementId: z.string().min(1),
  taskRunId: z.string().min(1),
  testEnvironmentConfigId: z.string().optional(),
  status: z.enum(VERIFICATION_RUN_STATUSES),
  summary: z.string().optional(),
  codeAnchorRef: CodeAnchorRefSchema,
  evidenceIds: z.array(z.string()).default([]),
  startedAt: z.string().min(1),
  completedAt: z.string().optional(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
})
export type VerificationRun = z.infer<typeof VerificationRunSchema>
