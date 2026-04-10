# 08 Agent 配置与可观测性

- 状态：`ready`
- 模块目标：建立角色配置、证据索引和关键状态审计链
- 上游依赖：`01-control-plane-objects`、`02-runtime-adapter`、`04-task-worktree-anchor`、`05-test-environments`、`06-review-bug-gate`
- 下游模块：`07-ops-console`

## 本模块解决的问题

- 角色配置需要从控制平面可见，而不是只留在底层 agent 文件
- transcript、日志和 artifact 需要被引用到正式对象链
- 关键阶段状态变化需要审计记录

## 模块边界

本模块负责：

- `AgentProfile`
- `Evidence` 索引链
- transcript 到控制平面对象的引用关系
- 关键状态审计链

本模块不负责：

- 完整组织治理
- 插件市场或复杂权限系统
