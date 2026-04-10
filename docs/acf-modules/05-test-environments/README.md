# 05 Backend 与 Web 测试环境基座

- 状态：`ready`
- 模块目标：建立首期验证环境配置和统一验证结果模型
- 上游依赖：`01-control-plane-objects`、`02-runtime-adapter`、`04-task-worktree-anchor`
- 下游模块：`06-review-bug-gate`、`07-ops-console`、`08-agent-profile-observability`

## 本模块解决的问题

- 首期需要正式支持 Backend 和 Web 两类验证环境
- 不同验证方式需要统一结果模型
- 证据需要落成正式对象，而不是散落在日志与截图中

## 模块边界

本模块负责：

- `TestEnvironmentConfig`
- `VerificationRun`
- `Evidence`
- Backend/Web 验证能力接入

本模块不负责：

- 缺陷裁决
- 阶段 Gate 推进
