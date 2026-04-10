import type { RuntimeAdapterKind } from '../../shared/enums.js'

export type RawRuntimeMessage = Record<string, unknown>

export type RuntimeEvent =
  | {
      kind: 'session_started'
      adapter: RuntimeAdapterKind
      occurredAt: string
      sessionId: string
      payload: {
        command: string
        args: string[]
        cwd: string
      }
    }
  | {
      kind: 'stream_message'
      adapter: RuntimeAdapterKind
      occurredAt: string
      sessionId: string
      payload: RawRuntimeMessage
    }
  | {
      kind: 'session_completed'
      adapter: RuntimeAdapterKind
      occurredAt: string
      sessionId: string
      payload: {
        exitCode: number
      }
    }
  | {
      kind: 'session_failed'
      adapter: RuntimeAdapterKind
      occurredAt: string
      sessionId: string
      payload: {
        message: string
      }
    }
