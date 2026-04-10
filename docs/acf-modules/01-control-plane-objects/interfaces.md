# 01 接口说明

## 核心对象接口

- `Project`
  - 标识项目级上下文
  - 需要承载 `status`、`current_phase`、`owner_role`
- `RequirementDraft`
  - 需求草稿输入对象
  - 冻结前可反复修改
- `Requirement`
  - 正式需求对象
  - 进入阶段推进、任务拆解和门禁判断
- `Task` / `TaskRun`
  - 分别表示任务定义和执行实例
- `VerificationRun`
  - 验证动作的正式记录
- `ReviewRecord`
  - 正式评审对象
- `Bug` / `Blocker`
  - 分别处理缺陷和非缺陷阻塞
- `GateDecision`
  - 阶段退出或重开裁决对象

## 存储要求

- 本地优先
- 主业务对象必须可落库
- Artifact 与 transcript 只保留引用，不直接承担主状态
- `TaskRun`、`VerificationRun`、`GateDecision` 必须包含 `code_anchor_ref`

## 关键关系

- `Project` 1:N `Requirement`
- `Requirement` 1:N `Task`
- `Task` 1:N `TaskRun`
- `Requirement` 1:N `VerificationRun`
- `Requirement` 1:N `ReviewRecord`
- `Requirement` 1:N `Bug`
- `Requirement` 1:N `Blocker`
- `Requirement` 1:N `GateDecision`

## 输出契约

- 对外暴露统一对象 schema
- 为后续模块提供稳定读取和写入接口
- 保证状态机枚举来自蓝图，不允许模块内自行扩展
