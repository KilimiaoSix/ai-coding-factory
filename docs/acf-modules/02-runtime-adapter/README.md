# 02 运行时接入与基座适配层

- 状态：`ready`
- 模块目标：建立控制平面到 Claude Code 执行基座的稳定接入层
- 上游依赖：`01-control-plane-objects`
- 下游模块：`03-intake-and-start`、`04-task-worktree-anchor`、`05-test-environments`、`07-ops-console`、`08-agent-profile-observability`

## 本模块解决的问题

- 控制平面不能直接依赖聊天流程驱动，需要稳定调用基座运行时
- runtime 事件需要投影到控制平面对象，而不是直接暴露 transcript
- 写任务、验证任务和前台需求入口需要统一调度适配

## 模块边界

本模块负责：

- runtime 接入面选择与封装
- 事件投影
- 任务调度适配

本模块不负责：

- 控制平面对象 schema 定义
- GUI 视图
- 具体测试环境实现

## 预计代码落点

- runtime adapter 目录
- stream/transcript 投影目录
- 调度 service 目录
