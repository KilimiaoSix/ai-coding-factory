# 03 需求入口、项目画像与 Start 冻结

- 状态：`ready`
- 模块目标：建立从用户需求输入到 `Start` 冻结的前置闭环
- 上游依赖：`01-control-plane-objects`、`02-runtime-adapter`
- 下游模块：`04-task-worktree-anchor`、`06-review-bug-gate`、`07-ops-console`

## 本模块解决的问题

- 用户需求需要先进入正式草稿对象，不能直接流入执行阶段
- 项目上下文和 readiness 检查需要有轻量但正式的落点
- `Start` 需要成为从“可讨论”到“正式进入控制平面”的边界动作

## 模块边界

本模块负责：

- `RequirementDraft` 入口
- `ProjectContextSummary`
- `ReadinessChecklist`
- `Start` 冻结动作和后续分流规则

本模块不负责：

- 实际开发执行
- 测试环境落地
- GUI 复杂视图
