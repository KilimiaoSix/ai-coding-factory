import type { TaskRun } from '../../domain/execution/TaskRun.js'
import {
  EvidenceSchema,
  type Evidence,
} from '../../domain/verification/Evidence.js'
import { nowIsoTimestamp, createEvidenceId } from '../../shared/ids.js'
import type { RuntimeEvent } from './RuntimeEvent.js'

function toMetadataRecord(payload: Record<string, unknown>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(payload).map(([key, value]) => [
      key,
      typeof value === 'string' ? value : JSON.stringify(value),
    ]),
  )
}

export type RuntimeProjection = {
  taskRun: TaskRun
  evidence: Evidence[]
}

export class RuntimeEventProjector {
  apply(taskRun: TaskRun, event: RuntimeEvent): RuntimeProjection {
    const evidence: Evidence[] = []
    let nextTaskRun = taskRun

    if (event.kind === 'session_started') {
      nextTaskRun = {
        ...taskRun,
        status: 'running',
        startedAt: event.occurredAt,
        updatedAt: event.occurredAt,
      }
      return { taskRun: nextTaskRun, evidence }
    }

    if (event.kind === 'stream_message') {
      const payload = event.payload
      evidence.push(
        EvidenceSchema.parse({
          id: createEvidenceId(),
          projectId: taskRun.projectId,
          requirementId: taskRun.requirementId,
          taskRunId: taskRun.id,
          kind: 'runtime_event',
          title: `Runtime event: ${String(payload.type ?? 'unknown')}`,
          summary:
            typeof payload.subtype === 'string'
              ? `subtype=${payload.subtype}`
              : undefined,
          codeAnchorRef: taskRun.codeAnchorRef,
          metadata: toMetadataRecord(payload),
          createdAt: nowIsoTimestamp(),
        }),
      )
      if (payload.type === 'result') {
        nextTaskRun = {
          ...nextTaskRun,
          status: payload.is_error ? 'failed' : 'completed',
          completedAt: event.occurredAt,
          updatedAt: event.occurredAt,
          sessionId:
            typeof payload.session_id === 'string'
              ? payload.session_id
              : nextTaskRun.sessionId,
          errorMessage:
            payload.is_error && Array.isArray(payload.errors)
              ? payload.errors.join('; ')
              : nextTaskRun.errorMessage,
        }
      }
      return { taskRun: nextTaskRun, evidence }
    }

    if (event.kind === 'session_failed') {
      nextTaskRun = {
        ...taskRun,
        status: 'failed',
        completedAt: event.occurredAt,
        updatedAt: event.occurredAt,
        errorMessage: event.payload.message,
      }
      evidence.push(
        EvidenceSchema.parse({
          id: createEvidenceId(),
          projectId: taskRun.projectId,
          requirementId: taskRun.requirementId,
          taskRunId: taskRun.id,
          kind: 'runtime_event',
          title: 'Runtime failure',
          summary: event.payload.message,
          codeAnchorRef: taskRun.codeAnchorRef,
          metadata: { kind: event.kind },
          createdAt: nowIsoTimestamp(),
        }),
      )
      return { taskRun: nextTaskRun, evidence }
    }

    if (
      event.kind === 'session_completed' &&
      nextTaskRun.status !== 'completed' &&
      nextTaskRun.status !== 'failed'
    ) {
      nextTaskRun = {
        ...nextTaskRun,
        status: event.payload.exitCode === 0 ? 'completed' : 'failed',
        completedAt: event.occurredAt,
        updatedAt: event.occurredAt,
        errorMessage:
          event.payload.exitCode === 0
            ? nextTaskRun.errorMessage
            : `Runtime exited with code ${event.payload.exitCode}`,
      }
    }
    return { taskRun: nextTaskRun, evidence }
  }
}
