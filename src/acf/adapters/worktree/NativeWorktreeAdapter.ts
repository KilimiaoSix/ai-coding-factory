import { execFileNoThrowWithCwd } from 'src/utils/execFileNoThrow.js'
import { findCanonicalGitRoot, gitExe } from 'src/utils/git.js'
import { createCodeAnchorRef, type CodeAnchorRef } from '../../shared/codeAnchor.js'
import { nowIsoTimestamp } from '../../shared/ids.js'
import { WorktreeRefSchema, type WorktreeRef } from '../../shared/refs.js'

export type AllocateTaskWorktreeInput = {
  taskRunId: string
  sessionId: string
  slug?: string
}

export type AllocateTaskWorktreeResult = {
  worktreeRef: WorktreeRef
  codeAnchorRef: CodeAnchorRef
}

async function getGitValue(
  cwd: string,
  args: string[],
  fallback: string,
): Promise<string> {
  const result = await execFileNoThrowWithCwd(gitExe(), args, { cwd })
  return result.code === 0 && result.stdout.trim() ? result.stdout.trim() : fallback
}

export class NativeWorktreeAdapter {
  async allocateTaskWorktree(
    input: AllocateTaskWorktreeInput,
  ): Promise<AllocateTaskWorktreeResult> {
    const slug = input.slug ?? `acf-${input.taskRunId}`
    const { createAgentWorktree } = await import('src/utils/worktree.js')
    const allocation = await createAgentWorktree(slug)
    const worktreePath = allocation.worktreePath
    const repoRoot =
      allocation.gitRoot ?? findCanonicalGitRoot(worktreePath) ?? worktreePath
    const gitSha =
      allocation.headCommit ??
      (await getGitValue(worktreePath, ['rev-parse', 'HEAD'], 'unknown'))
    const branch =
      allocation.worktreeBranch ??
      (await getGitValue(worktreePath, ['rev-parse', '--abbrev-ref', 'HEAD'], 'unknown'))
    const createdAt = nowIsoTimestamp()

    const worktreeRef = WorktreeRefSchema.parse({
      kind: 'worktree',
      path: worktreePath,
      branch,
      gitRoot: repoRoot,
      hookBased: allocation.hookBased ?? false,
      createdAt,
    })

    return {
      worktreeRef,
      codeAnchorRef: createCodeAnchorRef({
        repoRoot,
        gitSha,
        branch,
        worktreePath,
        transcriptSessionId: input.sessionId,
        capturedAt: createdAt,
      }),
    }
  }
}
