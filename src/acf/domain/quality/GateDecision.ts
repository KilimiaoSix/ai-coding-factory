import { z } from 'zod/v4'
import { GATE_DECISION_STATUSES } from '../../shared/enums.js'
import { CodeAnchorRefSchema } from '../../shared/codeAnchor.js'

export const GateDecisionSchema = z.object({
  id: z.string().min(1),
  projectId: z.string().min(1),
  requirementId: z.string().min(1),
  taskRunId: z.string().optional(),
  verificationRunId: z.string().optional(),
  status: z.enum(GATE_DECISION_STATUSES),
  reasons: z.array(z.string()).default([]),
  requiredEvidenceIds: z.array(z.string()).default([]),
  codeAnchorRef: CodeAnchorRefSchema,
  createdAt: z.string().min(1),
})
export type GateDecision = z.infer<typeof GateDecisionSchema>
