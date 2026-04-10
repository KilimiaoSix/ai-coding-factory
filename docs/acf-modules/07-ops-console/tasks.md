# 07 实现任务

## 任务列表

1. 建立项目总览页
2. 建立需求详情与阶段视图
3. 建立执行与验证视图
4. 建立 Product 前台入口与 `Start` 交互

## 任务拆分

| 任务 | 输入 | 输出 |
| --- | --- | --- |
| `7.1` 项目总览页 | `Project` 与 `Requirement` 数据 | 项目概览和阶段摘要 |
| `7.2` 执行与验证视图 | `TaskRun`、`VerificationRun`、`Evidence` | 运行与验证视图 |
| `7.3` 缺陷与 Gate 视图 | `Bug`、`Blocker`、`GateDecision` | 质量与门禁视图 |
| `7.4` Product 前台入口 | 草稿与 `Start` 流程 | 统一需求输入页 |

## 完成定义

- 管理者可以在 GUI 中查看关键状态
- 用户可以通过 GUI 入口发起需求并执行 `Start`
