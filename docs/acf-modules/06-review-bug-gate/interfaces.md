# 06 接口说明

## 主要对象

- `ReviewRecord`
- `Bug`
- `Blocker`
- `GateDecision`

## 关键规则

- QA 拥有质量 veto 输入，但不直接推进阶段
- `GateDecision.status = passed` 之前必须满足 `required_inputs`
- `Bug` 与 `Blocker` 分开建模
- `ReviewRecord` 是正式评审，不等于聊天摘要

## 关键接口

- `createReviewRecord`
- `createBug`
- `updateBugStatus`
- `createBlocker`
- `resolveBlocker`
- `evaluateGateInputs`
- `createGateDecision`

## 输出契约

- 所有阶段推进必须通过 `GateDecision`
- 所有正式评审必须产生 `ReviewRecord`
- 所有质量问题必须通过 `Bug` 流程回流
