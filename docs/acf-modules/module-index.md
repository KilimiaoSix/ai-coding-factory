# ACF 模块索引

| 模块 | 目标 | 主要产出 | 依赖 |
| --- | --- | --- | --- |
| `01-control-plane-objects` | 建立首期控制平面对象与存储基线 | schema、状态约束、索引基线 | 蓝图 |
| `02-runtime-adapter` | 建立控制平面到 Claude Code 基座的接入层 | 运行时适配、事件投影、调度适配 | 01 |
| `03-intake-and-start` | 建立需求入口、项目画像和 `Start` 冻结机制 | 草稿入口、上下文摘要、readiness 检查 | 01, 02 |
| `04-task-worktree-anchor` | 建立任务执行、worktree 归因和代码锚点 | `TaskRun`、worktree 策略、代码版本引用 | 01, 02, 03 |
| `05-test-environments` | 建立 Backend/Web 验证环境和统一结果模型 | 环境配置、验证运行、证据产出 | 01, 02, 04 |
| `06-review-bug-gate` | 建立评审、缺陷、阻塞与阶段门禁闭环 | `ReviewRecord`、`Bug`、`Blocker`、`GateDecision` | 01, 04, 05 |
| `07-ops-console` | 建立首期 GUI 运营控制台 | 项目总览、执行视图、验证视图、前台入口 | 01, 02, 03, 04, 05, 06 |
| `08-agent-profile-observability` | 建立角色配置与审计链路 | `AgentProfile`、证据索引、状态审计 | 01, 02, 04, 05, 06 |

## 推荐实施顺序

1. `01-control-plane-objects`
2. `02-runtime-adapter`
3. `03-intake-and-start`
4. `04-task-worktree-anchor`
5. `05-test-environments`
6. `06-review-bug-gate`
7. `08-agent-profile-observability`
8. `07-ops-console`
