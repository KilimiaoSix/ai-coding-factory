# 01 控制平面对象与存储基线

- 状态：`ready`
- 模块目标：把蓝图中的首期核心对象落成统一 schema 和本地持久化基线
- 上游依赖：无
- 下游模块：`02-runtime-adapter`、`03-intake-and-start`、`04-task-worktree-anchor`、`05-test-environments`、`06-review-bug-gate`、`08-agent-profile-observability`

## 本模块解决的问题

- 控制平面对象目前只存在于蓝图，需要落成可被代码消费的结构定义
- 首期需要本地优先存储方案，不能继续把结构化状态留在文档和对话里
- 需要统一对象关系、状态字段和索引边界，为后续模块提供稳定接口

## 模块边界

本模块负责：

- 首期对象 schema
- 本地存储基线
- 对象间主外键和索引规则

本模块不负责：

- runtime 接入
- GUI 展示
- 真实验证执行

## 主要对象

- `Project`
- `ProjectContextSummary`
- `ReadinessChecklist`
- `RequirementDraft`
- `Requirement`
- `ChangeRequest`
- `ReviewRecord`
- `Task`
- `TaskRun`
- `VerificationRun`
- `Evidence`
- `Bug`
- `Blocker`
- `GateDecision`
- `TestEnvironmentConfig`
- `AgentProfile`

## 预计代码落点

- 控制平面 schema 目录
- 本地数据库初始化与迁移目录
- Artifact 索引与引用工具目录
