# 04 接口说明

## 核心对象

- `Task`
- `TaskRun`
- `code_anchor_ref`
- `worktree_ref`

## 关键规则

- `Task` 描述意图，`TaskRun` 描述一次具体执行
- 写入型任务默认要求隔离策略
- `TaskRun` 完成时必须记录代码锚点
- 后续 `VerificationRun` 和 `GateDecision` 必须复用或引用该锚点链

## 关键接口

- `createTask`
- `scheduleTaskRun`
- `resolveIsolationPolicy`
- `allocateWorktree`
- `captureCodeAnchor`

## 输出契约

- 任何可交付执行都必须产生 `TaskRun`
- 任何写任务都必须可追溯到具体 worktree 或等效隔离引用
