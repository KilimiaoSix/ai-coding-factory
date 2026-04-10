# 08 接口说明

## 主要对象

- `AgentProfile`
- `Evidence`
- 审计记录引用链

## 关键接口

- `createAgentProfile`
- `updateAgentProfile`
- `indexEvidence`
- `linkTranscriptEvidence`
- `recordAuditEvent`

## 关键约束

- `AgentProfile` 只描述控制平面需要的角色配置，不等同于组织治理系统
- transcript 只作为证据引用，不直接承担正式业务状态
- phase、Gate、bug、blocker 等关键状态变化必须进入审计链
