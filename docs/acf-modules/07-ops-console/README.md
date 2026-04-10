# 07 GUI 运营控制台

- 状态：`ready`
- 模块目标：建立首期 GUI 运营控制台和统一前台入口
- 上游依赖：`01-control-plane-objects`、`02-runtime-adapter`、`03-intake-and-start`、`04-task-worktree-anchor`、`05-test-environments`、`06-review-bug-gate`
- 下游模块：无

## 本模块解决的问题

- 首期需要可视化查看项目、需求、执行、验证、缺陷和 Gate 状态
- 用户需要统一前台入口，而不是直接面向多角色 Agent
- 管理者需要一个运营控制台，而不是对话壳包装

## 模块边界

本模块负责：

- 项目总览页
- 执行与验证视图
- Product 前台入口

本模块不负责：

- 控制平面对象定义
- 底层 runtime 接入逻辑
