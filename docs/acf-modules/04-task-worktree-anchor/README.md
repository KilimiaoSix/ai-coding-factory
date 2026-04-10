# 04 任务执行、worktree 归因与代码锚点

- 状态：`ready`
- 模块目标：建立任务执行实例、写任务隔离和代码版本锚点
- 上游依赖：`01-control-plane-objects`、`02-runtime-adapter`、`03-intake-and-start`
- 下游模块：`05-test-environments`、`06-review-bug-gate`、`08-agent-profile-observability`

## 本模块解决的问题

- 任务需要正式定义与执行实例分离
- 写入型任务不能直接在主工作区无约束运行
- 验证和 Gate 结论必须能指向实际代码版本

## 模块边界

本模块负责：

- `Task` 与 `TaskRun`
- worktree 归因策略
- `code_anchor_ref` 生成与约束

本模块不负责：

- 缺陷与 Gate 裁决
- 测试环境执行器
