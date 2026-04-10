import { existsSync } from 'fs'
import { createInterface } from 'readline'
import { ChildProcessWithoutNullStreams, spawn } from 'child_process'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { Stream } from 'src/utils/stream.js'
import type { RuntimeSessionHandle, StartRuntimeSessionInput } from './RuntimeAdapter.js'
import type { RuntimeEvent, RawRuntimeMessage } from './RuntimeEvent.js'
import type { RuntimeAdapter } from './RuntimeAdapter.js'
import { nowIsoTimestamp } from '../../shared/ids.js'

type NativeCliRuntimeSession = RuntimeSessionHandle & {
  child: ChildProcessWithoutNullStreams
  events: Stream<RuntimeEvent>
  inputMode: 'text' | 'stream-json'
}

function getRepoRootFromModule(): string {
  const currentFile = fileURLToPath(import.meta.url)
  return join(dirname(currentFile), '..', '..', '..', '..')
}

function resolveNativeCliEntry(cwd: string): string {
  const repoRoot = getRepoRootFromModule()
  const distCli = join(repoRoot, 'dist', 'cli.js')
  if (existsSync(distCli)) {
    return distCli
  }
  return join(repoRoot, 'src', 'entrypoints', 'cli.tsx')
}

function resolveNativeCliCommand(input: StartRuntimeSessionInput): {
  command: string
  args: string[]
} {
  if (input.command) {
    return { command: input.command, args: input.args ?? [] }
  }

  const entry = resolveNativeCliEntry(input.cwd)
  const args = [
    entry,
    '--print',
    '--verbose',
    '--output-format',
    'stream-json',
  ]
  if (input.inputMode === 'stream-json') {
    args.push('--input-format', 'stream-json')
  }
  if (input.dangerouslySkipPermissions) {
    args.push('--dangerously-skip-permissions')
  }
  if (input.prompt && input.inputMode !== 'stream-json') {
    args.push(input.prompt)
  }
  return {
    command: process.execPath,
    args,
  }
}

function parseRuntimeLine(line: string): RawRuntimeMessage {
  return JSON.parse(line) as RawRuntimeMessage
}

export class NativeCliRuntimeAdapter implements RuntimeAdapter {
  readonly kind = 'native_cli' as const
  private readonly sessions = new Map<string, NativeCliRuntimeSession>()

  async startSession(
    input: StartRuntimeSessionInput,
  ): Promise<RuntimeSessionHandle> {
    const { command, args } = resolveNativeCliCommand(input)
    const child = spawn(command, args, {
      cwd: input.cwd,
      env: { ...process.env, ...input.extraEnv },
      stdio: 'pipe',
    })
    const events = new Stream<RuntimeEvent>(() => {
      if (!child.killed) {
        child.kill('SIGTERM')
      }
    })
    const handle: NativeCliRuntimeSession = {
      id: input.sessionId,
      adapter: this.kind,
      cwd: input.cwd,
      child,
      events,
      inputMode: input.inputMode ?? 'text',
    }
    this.sessions.set(handle.id, handle)

    events.enqueue({
      kind: 'session_started',
      adapter: this.kind,
      occurredAt: nowIsoTimestamp(),
      sessionId: handle.id,
      payload: { command, args, cwd: input.cwd },
    })

    const stdoutReader = createInterface({ input: child.stdout })
    stdoutReader.on('line', line => {
      if (!line.trim()) {
        return
      }
      try {
        events.enqueue({
          kind: 'stream_message',
          adapter: this.kind,
          occurredAt: nowIsoTimestamp(),
          sessionId: handle.id,
          payload: parseRuntimeLine(line),
        })
      } catch (error) {
        events.enqueue({
          kind: 'session_failed',
          adapter: this.kind,
          occurredAt: nowIsoTimestamp(),
          sessionId: handle.id,
          payload: {
            message:
              error instanceof Error
                ? `Failed to parse runtime output: ${error.message}`
                : 'Failed to parse runtime output',
          },
        })
      }
    })

    child.on('error', error => {
      events.enqueue({
        kind: 'session_failed',
        adapter: this.kind,
        occurredAt: nowIsoTimestamp(),
        sessionId: handle.id,
        payload: { message: error.message },
      })
      events.done()
      this.sessions.delete(handle.id)
    })

    child.on('close', code => {
      events.enqueue({
        kind: 'session_completed',
        adapter: this.kind,
        occurredAt: nowIsoTimestamp(),
        sessionId: handle.id,
        payload: { exitCode: code ?? 0 },
      })
      events.done()
      this.sessions.delete(handle.id)
    })

    return handle
  }

  async sendInput(handle: RuntimeSessionHandle, input: string): Promise<void> {
    const session = this.sessions.get(handle.id)
    if (!session) {
      throw new Error(`Unknown runtime session: ${handle.id}`)
    }
    if (session.inputMode !== 'stream-json') {
      throw new Error('sendInput requires a session started in stream-json mode')
    }
    session.child.stdin.write(input.endsWith('\n') ? input : `${input}\n`)
  }

  async interrupt(handle: RuntimeSessionHandle): Promise<void> {
    const session = this.sessions.get(handle.id)
    if (!session) {
      return
    }
    session.child.kill('SIGINT')
  }

  streamEvents(handle: RuntimeSessionHandle): AsyncIterable<RuntimeEvent> {
    const session = this.sessions.get(handle.id)
    if (!session) {
      throw new Error(`Unknown runtime session: ${handle.id}`)
    }
    return session.events
  }
}
