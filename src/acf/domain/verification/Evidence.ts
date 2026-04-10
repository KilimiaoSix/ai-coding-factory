import { z } from 'zod/v4'
import { EVIDENCE_KINDS } from '../../shared/enums.js'
import { CodeAnchorRefSchema } from '../../shared/codeAnchor.js'
import { EvidenceSourceRefSchema } from '../../shared/refs.js'

export const EvidenceSchema = z.object({
  id: z.string().min(1),
  projectId: z.string().min(1),
  requirementId: z.string().optional(),
  taskRunId: z.string().optional(),
  verificationRunId: z.string().optional(),
  kind: z.enum(EVIDENCE_KINDS),
  title: z.string().min(1),
  summary: z.string().optional(),
  sourceRef: EvidenceSourceRefSchema.optional(),
  codeAnchorRef: CodeAnchorRefSchema.optional(),
  metadata: z.record(z.string(), z.string()).default({}),
  createdAt: z.string().min(1),
})
export type Evidence = z.infer<typeof EvidenceSchema>
