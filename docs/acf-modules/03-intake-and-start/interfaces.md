# 03 接口说明

## 主要对象

- `RequirementDraft`
- `ProjectContextSummary`
- `ReadinessChecklist`
- `Requirement`
- `ChangeRequest`

## 核心动作

- `createDraft`
- `updateDraft`
- `generateProjectContextSummary`
- `runReadinessChecklist`
- `startRequirement`
- `routePostStartInput`

## 分流规则

- 普通澄清：进入 `RequirementDraft` 或 `Requirement` 注记
- Blocker 回复：进入 `Blocker` 处理链
- 范围/验收/优先级变化：进入 `ChangeRequest`
- 停止或覆盖指令：触发中断策略评估

## 关键约束

- `Start` 后才允许进入正式 `Requirement`
- readiness 未通过时不得进入正式规划
- 用户输入的路由结果必须可追踪
