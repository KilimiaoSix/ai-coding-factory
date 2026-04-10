# 06 评审、缺陷、阻塞与 Gate 闭环

- 状态：`ready`
- 模块目标：建立正式评审、缺陷回流、阻塞升级和阶段门禁
- 上游依赖：`01-control-plane-objects`、`04-task-worktree-anchor`、`05-test-environments`
- 下游模块：`07-ops-console`、`08-agent-profile-observability`

## 本模块解决的问题

- 任务完成不能直接等价为阶段通过
- QA 发现的问题需要正式缺陷对象和回流机制
- 非缺陷类阻塞需要正式升级链路
- 阶段推进需要正式输入和裁决对象

## 模块边界

本模块负责：

- `ReviewRecord`
- `Bug`
- `Blocker`
- `GateDecision`

本模块不负责：

- GUI 展示实现
- runtime 调度
