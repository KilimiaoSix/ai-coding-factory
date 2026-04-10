import type { TaskRun } from '../../domain/execution/TaskRun.js'
import type { Evidence } from '../../domain/verification/Evidence.js'
import type { RuntimeAdapter } from './RuntimeAdapter.js'
import type { RuntimeEvent } from './RuntimeEvent.js'
import { RuntimeEventProjector } from './RuntimeEventProjector.js'

export type DispatchTaskRunInput = {
  taskRun: TaskRun
  cwd: string
  prompt?: string
  dangerouslySkipPermissions?: boolean
}

export type DispatchTaskRunResult = {
  taskRun: TaskRun
  evidence: Evidence[]
  events: RuntimeEvent[]
}

export class ExecutionDispatcher {
  constructor(
    private readonly runtimeAdapter: RuntimeAdapter,
    private readonly projector = new RuntimeEventProjector(),
  ) {}

  async dispatchTaskRun(
    input: DispatchTaskRunInput,
  ): Promise<DispatchTaskRunResult> {
    let taskRun = input.taskRun
    const evidence: Evidence[] = []
    const events: RuntimeEvent[] = []
    const handle = await this.runtimeAdapter.startSession({
      cwd: input.cwd,
      prompt: input.prompt ?? input.taskRun.prompt,
      sessionId: input.taskRun.sessionId,
      dangerouslySkipPermissions: input.dangerouslySkipPermissions,
    })

    for await (const event of this.runtimeAdapter.streamEvents(handle)) {
      events.push(event)
      const projection = this.projector.apply(taskRun, event)
      taskRun = projection.taskRun
      evidence.push(...projection.evidence)
    }

    return { taskRun, evidence, events }
  }
}
