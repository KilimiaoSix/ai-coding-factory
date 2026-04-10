# 03 实现任务

## 任务列表

1. 建立需求草稿入口
2. 建立项目画像生成与维护机制
3. 建立 readiness 检查
4. 建立 `Start` 冻结和输入分流

## 任务拆分

| 任务 | 输入 | 输出 |
| --- | --- | --- |
| `3.1` 实现草稿对象流转 | 用户输入与对象 schema | `RequirementDraft` 流程 |
| `3.2` 实现项目画像摘要 | 草稿与项目背景 | `ProjectContextSummary` |
| `3.3` 实现 readiness 检查 | 上下文与规则 | `ReadinessChecklist` |
| `3.4` 实现 `Start` 冻结 | 草稿、画像、检查结果 | `Requirement` 创建与分流策略 |

## 完成定义

- 用户需求可稳定进入草稿
- `Start` 会产生正式 `Requirement`
- `Start` 后的新输入可按规则分流
