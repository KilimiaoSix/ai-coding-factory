import type { Database } from 'bun:sqlite'
import { TaskRunSchema } from '../../../domain/execution/TaskRun.js'
import { TaskSchema } from '../../../domain/execution/Task.js'
import { JsonEntityRepository } from './BaseRepository.js'

export class TaskRepository extends JsonEntityRepository<
  ReturnType<typeof TaskSchema.parse>
> {
  constructor(db: Database) {
    super(db, 'acf_tasks', TaskSchema, [
      'project_id',
      'requirement_id',
      'task_type',
    ])
  }

  save(task: ReturnType<typeof TaskSchema.parse>) {
    return this.upsert(task, {
      project_id: task.projectId,
      requirement_id: task.requirementId,
      task_type: task.taskType,
    })
  }
}

export class TaskRunRepository extends JsonEntityRepository<
  ReturnType<typeof TaskRunSchema.parse>
> {
  constructor(db: Database) {
    super(db, 'acf_task_runs', TaskRunSchema, [
      'project_id',
      'task_id',
      'requirement_id',
      'status',
      'session_id',
      'git_sha',
    ])
  }

  save(taskRun: ReturnType<typeof TaskRunSchema.parse>) {
    return this.upsert(taskRun, {
      project_id: taskRun.projectId,
      task_id: taskRun.taskId,
      requirement_id: taskRun.requirementId,
      status: taskRun.status,
      session_id: taskRun.sessionId,
      git_sha: taskRun.codeAnchorRef.gitSha,
    })
  }
}
