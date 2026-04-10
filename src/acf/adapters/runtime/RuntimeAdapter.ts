import type { RuntimeAdapterKind } from '../../shared/enums.js'
import type { RuntimeEvent } from './RuntimeEvent.js'

export type StartRuntimeSessionInput = {
  cwd: string
  prompt?: string
  sessionId: string
  inputMode?: 'text' | 'stream-json'
  command?: string
  args?: string[]
  extraEnv?: Record<string, string>
  dangerouslySkipPermissions?: boolean
}

export type RuntimeSessionHandle = {
  id: string
  adapter: RuntimeAdapterKind
  cwd: string
}

export interface RuntimeAdapter {
  readonly kind: RuntimeAdapterKind
  startSession(input: StartRuntimeSessionInput): Promise<RuntimeSessionHandle>
  sendInput(handle: RuntimeSessionHandle, input: string): Promise<void>
  interrupt(handle: RuntimeSessionHandle): Promise<void>
  streamEvents(handle: RuntimeSessionHandle): AsyncIterable<RuntimeEvent>
}
