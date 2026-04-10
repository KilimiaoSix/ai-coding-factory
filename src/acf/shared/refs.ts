import { z } from 'zod/v4'

export const WorktreeRefSchema = z.object({
  kind: z.literal('worktree'),
  path: z.string().min(1),
  branch: z.string().optional(),
  gitRoot: z.string().optional(),
  hookBased: z.boolean().default(false),
  createdAt: z.string().min(1),
})
export type WorktreeRef = z.infer<typeof WorktreeRefSchema>

export const TranscriptRefSchema = z.object({
  kind: z.literal('transcript'),
  sessionId: z.string().min(1),
  transcriptPath: z.string().min(1),
  agentId: z.string().optional(),
})
export type TranscriptRef = z.infer<typeof TranscriptRefSchema>

export const ArtifactRefSchema = z.object({
  kind: z.literal('artifact'),
  path: z.string().min(1),
  mediaType: z.string().optional(),
  sha256: z.string().optional(),
})
export type ArtifactRef = z.infer<typeof ArtifactRefSchema>

export const EvidenceSourceRefSchema = z.union([
  WorktreeRefSchema,
  TranscriptRefSchema,
  ArtifactRefSchema,
])
export type EvidenceSourceRef = z.infer<typeof EvidenceSourceRefSchema>
