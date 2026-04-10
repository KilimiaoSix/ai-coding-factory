import { TaskSchema, type Task } from '../../domain/execution/Task.js'
import { TaskRunSchema, type TaskRun } from '../../domain/execution/TaskRun.js'
import { createTaskId, createTaskRunId, nowIsoTimestamp } from '../../shared/ids.js'
import type { NativeWorktreeAdapter } from '../../adapters/worktree/NativeWorktreeAdapter.js'
import type {
  TaskRepository,
  TaskRunRepository,
} from '../../storage/sqlite/repositories/ExecutionRepository.js'
import type { RequirementRepository } from '../../storage/sqlite/repositories/IntakeRepository.js'

export class ExecutionService {
  constructor(
    private readonly requirements: RequirementRepository,
    private readonly tasks: TaskRepository,
    private readonly taskRuns: TaskRunRepository,
    private readonly worktreeAdapter: NativeWorktreeAdapter,
  ) {}

  createTask(input: {
    requirementId: string
    title: string
    description: string
    taskType?: 'implementation' | 'verification' | 'review'
    runtimeAdapter?: string
  }): Task {
    const requirement = this.requirements.getById(input.requirementId)
    if (!requirement) {
      throw new Error(`Requirement not found: ${input.requirementId}`)
    }
    const timestamp = nowIsoTimestamp()
    const task = TaskSchema.parse({
      id: createTaskId(),
      projectId: requirement.projectId,
      requirementId: requirement.id,
      title: input.title,
      description: input.description,
      taskType: input.taskType ?? 'implementation',
      runtimeAdapter: input.runtimeAdapter ?? 'native_cli',
      createdAt: timestamp,
      updatedAt: timestamp,
    })
    return this.tasks.save(task)
  }

  async createTaskRun(input: {
    taskId: string
    prompt: string
    sessionId: string
    slug?: string
  }): Promise<TaskRun> {
    const task = this.tasks.getById(input.taskId)
    if (!task) {
      throw new Error(`Task not found: ${input.taskId}`)
    }
    const taskRunId = createTaskRunId()
    const allocation = await this.worktreeAdapter.allocateTaskWorktree({
      taskRunId,
      sessionId: input.sessionId,
      slug: input.slug,
    })
    const timestamp = nowIsoTimestamp()
    const taskRun = TaskRunSchema.parse({
      id: taskRunId,
      taskId: task.id,
      projectId: task.projectId,
      requirementId: task.requirementId,
      status: 'queued',
      runtimeAdapter: task.runtimeAdapter,
      prompt: input.prompt,
      sessionId: input.sessionId,
      worktreeRef: allocation.worktreeRef,
      codeAnchorRef: allocation.codeAnchorRef,
      createdAt: timestamp,
      updatedAt: timestamp,
    })
    return this.taskRuns.save(taskRun)
  }

  saveTaskRun(taskRun: TaskRun): TaskRun {
    return this.taskRuns.save(taskRun)
  }
}
