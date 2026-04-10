import { z } from 'zod/v4'

export const CodeAnchorRefSchema = z.object({
  repoRoot: z.string().min(1),
  gitSha: z.string().min(1),
  branch: z.string().min(1),
  worktreePath: z.string().min(1),
  transcriptSessionId: z.string().min(1),
  capturedAt: z.string().min(1),
})
export type CodeAnchorRef = z.infer<typeof CodeAnchorRefSchema>

export type CodeAnchorCaptureInput = {
  repoRoot: string
  gitSha: string
  branch: string
  worktreePath: string
  transcriptSessionId: string
  capturedAt?: string
}

export function createCodeAnchorRef(
  input: CodeAnchorCaptureInput,
): CodeAnchorRef {
  return CodeAnchorRefSchema.parse({
    ...input,
    capturedAt: input.capturedAt ?? new Date().toISOString(),
  })
}

export function assertCodeAnchorRef(
  value: unknown,
  contextMessage = 'Expected a valid CodeAnchorRef',
): CodeAnchorRef {
  const parsed = CodeAnchorRefSchema.safeParse(value)
  if (!parsed.success) {
    throw new Error(contextMessage)
  }
  return parsed.data
}
