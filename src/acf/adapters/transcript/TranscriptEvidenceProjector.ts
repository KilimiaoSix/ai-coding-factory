import { createEvidenceId, nowIsoTimestamp } from '../../shared/ids.js'
import {
  EvidenceSchema,
  type Evidence,
} from '../../domain/verification/Evidence.js'
import type { CodeAnchorRef } from '../../shared/codeAnchor.js'
import type { TranscriptRef } from '../../shared/refs.js'

export class TranscriptEvidenceProjector {
  projectTranscript(
    input: {
      projectId: string
      requirementId?: string
      taskRunId?: string
      verificationRunId?: string
      transcriptRef: TranscriptRef
      codeAnchorRef?: CodeAnchorRef
      summary?: string
    },
  ): Evidence {
    return EvidenceSchema.parse({
      id: createEvidenceId(),
      projectId: input.projectId,
      requirementId: input.requirementId,
      taskRunId: input.taskRunId,
      verificationRunId: input.verificationRunId,
      kind: 'transcript',
      title: `Transcript: ${input.transcriptRef.sessionId}`,
      summary: input.summary,
      sourceRef: input.transcriptRef,
      codeAnchorRef: input.codeAnchorRef,
      createdAt: nowIsoTimestamp(),
    })
  }
}
