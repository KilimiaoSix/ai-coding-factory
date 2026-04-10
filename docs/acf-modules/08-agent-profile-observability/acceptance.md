# 08 验收标准

## 验收条件

- 可以创建与读取 `AgentProfile`
- 可以把 artifact 和 transcript 关联到正式对象
- 可以查询关键状态变化审计记录
- `AgentProfile` 文档和实现不扩展为完整组织治理系统

## 测试场景

1. 创建一个 `Product` 或 `Dev` 角色配置
2. 建立一次 `TaskRun` 到 transcript 的引用
3. 建立一次 `VerificationRun` 到 `Evidence` 的引用
4. 记录并查询一次 Gate 状态变化
