import { afterEach, describe, expect, test } from 'bun:test'
import { mkdirSync, mkdtempSync, rmSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import { createCodeAnchorRef } from './shared/codeAnchor.js'
import { nowIsoTimestamp } from './shared/ids.js'
import { openAcfControlPlaneDatabase } from './storage/sqlite/schema.js'
import {
  ProjectContextSummaryRepository,
  ProjectRepository,
  ReadinessChecklistRepository,
} from './storage/sqlite/repositories/ProjectRepository.js'
import {
  RequirementDraftRepository,
  RequirementRepository,
} from './storage/sqlite/repositories/IntakeRepository.js'
import {
  TaskRepository,
  TaskRunRepository,
} from './storage/sqlite/repositories/ExecutionRepository.js'
import {
  EvidenceRepository,
  TestEnvironmentConfigRepository,
  VerificationRunRepository,
} from './storage/sqlite/repositories/VerificationRepository.js'
import { GateDecisionRepository } from './storage/sqlite/repositories/QualityRepository.js'
import { EvidenceIndex } from './storage/artifacts/EvidenceIndex.js'
import { IntakeService } from './application/intake/IntakeService.js'
import { ExecutionService } from './application/execution/ExecutionService.js'
import { VerificationService } from './application/verification/VerificationService.js'
import { QualityService } from './application/quality/QualityService.js'
import { RuntimeEventProjector } from './adapters/runtime/RuntimeEventProjector.js'

const tempDirs: string[] = []
const openDatabases: Array<{ close?: () => void }> = []

afterEach(() => {
  for (const db of openDatabases.splice(0)) {
    db.close?.()
  }
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true })
  }
})

function createTempAcfContext() {
  const repoRoot = mkdtempSync(join(tmpdir(), 'acf-subsystem-'))
  tempDirs.push(repoRoot)
  const { db, paths } = openAcfControlPlaneDatabase(repoRoot)
  openDatabases.push(db)

  const projects = new ProjectRepository(db)
  const contextSummaries = new ProjectContextSummaryRepository(db)
  const readinessChecklists = new ReadinessChecklistRepository(db)
  const drafts = new RequirementDraftRepository(db)
  const requirements = new RequirementRepository(db)
  const tasks = new TaskRepository(db)
  const taskRuns = new TaskRunRepository(db)
  const testEnvironmentConfigs = new TestEnvironmentConfigRepository(db)
  const verificationRuns = new VerificationRunRepository(db)
  const evidence = new EvidenceRepository(db)
  const gateDecisions = new GateDecisionRepository(db)
  const evidenceIndex = new EvidenceIndex(paths.evidenceDir)

  const fakeWorktreeAdapter = {
    async allocateTaskWorktree(input: { taskRunId: string; sessionId: string }) {
      const worktreePath = join(repoRoot, '.claude', 'worktrees', input.taskRunId)
      mkdirSync(worktreePath, { recursive: true })
      const capturedAt = nowIsoTimestamp()
      return {
        worktreeRef: {
          kind: 'worktree' as const,
          path: worktreePath,
          branch: 'acf-test',
          gitRoot: repoRoot,
          hookBased: false,
          createdAt: capturedAt,
        },
        codeAnchorRef: createCodeAnchorRef({
          repoRoot,
          gitSha: 'deadbeef',
          branch: 'acf-test',
          worktreePath,
          transcriptSessionId: input.sessionId,
          capturedAt,
        }),
      }
    },
  }

  return {
    repoRoot,
    paths,
    intake: new IntakeService(
      projects,
      contextSummaries,
      readinessChecklists,
      drafts,
      requirements,
    ),
    execution: new ExecutionService(
      requirements,
      tasks,
      taskRuns,
      fakeWorktreeAdapter as never,
    ),
    verification: new VerificationService(
      taskRuns,
      testEnvironmentConfigs,
      verificationRuns,
      evidence,
      evidenceIndex,
    ),
    quality: new QualityService(
      taskRuns,
      verificationRuns,
      evidence,
      gateDecisions,
    ),
    taskRuns,
  }
}

describe('ACF subsystem skeleton', () => {
  test('persists the minimum happy path', async () => {
    const ctx = createTempAcfContext()
    const projector = new RuntimeEventProjector()

    const project = ctx.intake.createProject({
      slug: 'demo',
      name: 'Demo Project',
      repoRoot: ctx.repoRoot,
    })
    const draft = ctx.intake.createRequirementDraft({
      projectId: project.id,
      title: 'Implement MVP gate',
      problemStatement: 'Need a minimal ACF requirement flow',
      requestedOutcome: 'Run task, verification, and gate end-to-end',
    })
    const requirement = ctx.intake.startRequirement({ draftId: draft.id })
    const task = ctx.execution.createTask({
      requirementId: requirement.id,
      title: 'Build the first task',
      description: 'Create a task run and collect runtime evidence',
    })
    let taskRun = await ctx.execution.createTaskRun({
      taskId: task.id,
      prompt: 'Build the task',
      sessionId: 'session-happy-path',
    })

    taskRun = projector.apply(taskRun, {
      kind: 'session_started',
      adapter: 'native_cli',
      occurredAt: nowIsoTimestamp(),
      sessionId: taskRun.sessionId,
      payload: {
        command: 'bun',
        args: ['dist/cli.js'],
        cwd: ctx.repoRoot,
      },
    }).taskRun

    const completionProjection = projector.apply(taskRun, {
      kind: 'stream_message',
      adapter: 'native_cli',
      occurredAt: nowIsoTimestamp(),
      sessionId: taskRun.sessionId,
      payload: {
        type: 'result',
        session_id: taskRun.sessionId,
        is_error: false,
      },
    })
    taskRun = ctx.execution.saveTaskRun(completionProjection.taskRun)
    const runtimeEvidence = await Promise.all(
      completionProjection.evidence.map(item => ctx.verification.saveEvidence(item)),
    )

    const verificationRun = ctx.verification.startVerificationRun({
      taskRunId: taskRun.id,
      summary: 'Runtime reported a successful result',
    })
    const completedVerification = ctx.verification.completeVerificationRun({
      verificationRunId: verificationRun.id,
      status: 'passed',
      summary: 'Happy path verification passed',
      evidenceIds: runtimeEvidence.map(item => item.id),
    })
    const gate = ctx.quality.evaluateGate({
      taskRunId: taskRun.id,
      verificationRunId: completedVerification.id,
    })

    expect(taskRun.status).toBe('completed')
    expect(runtimeEvidence.length).toBeGreaterThan(0)
    expect(completedVerification.status).toBe('passed')
    expect(gate.status).toBe('passed')
    expect(ctx.taskRuns.getById(taskRun.id)?.codeAnchorRef.gitSha).toBe('deadbeef')
    expect(ctx.paths.dbPath.endsWith('.claude/acf/control-plane.sqlite')).toBe(true)
  })

  test('rejects gate decisions without evidence', async () => {
    const ctx = createTempAcfContext()

    const project = ctx.intake.createProject({
      slug: 'demo-2',
      name: 'Demo Project 2',
      repoRoot: ctx.repoRoot,
    })
    const draft = ctx.intake.createRequirementDraft({
      projectId: project.id,
      title: 'Reject missing evidence',
      problemStatement: 'Gate should refuse incomplete runs',
      requestedOutcome: 'Reject when evidence is missing',
    })
    const requirement = ctx.intake.startRequirement({ draftId: draft.id })
    const task = ctx.execution.createTask({
      requirementId: requirement.id,
      title: 'Prepare gate rejection',
      description: 'Create a task run without evidence',
    })
    const taskRun = await ctx.execution.createTaskRun({
      taskId: task.id,
      prompt: 'Run without evidence',
      sessionId: 'session-no-evidence',
    })

    const verificationRun = ctx.verification.completeVerificationRun({
      verificationRunId: ctx.verification.startVerificationRun({
        taskRunId: taskRun.id,
      }).id,
      status: 'passed',
      evidenceIds: [],
    })
    const gate = ctx.quality.evaluateGate({
      taskRunId: taskRun.id,
      verificationRunId: verificationRun.id,
    })

    expect(gate.status).toBe('rejected')
    expect(gate.reasons.some(reason => reason.includes('evidence'))).toBe(true)
  })
})
