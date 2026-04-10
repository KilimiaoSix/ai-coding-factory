# 01 验收标准

## 验收条件

- 可以创建、读取和更新首期对象
- `RequirementDraft` 与 `Requirement` 明确分离
- `ReviewRecord`、`ChangeRequest`、`GateDecision` 已进入正式对象集
- `TaskRun`、`VerificationRun`、`GateDecision` 强制包含代码锚点字段
- transcript 和 artifact 只作为引用，不替代主对象

## 测试场景

1. 初始化一个空项目并写入 `Project`
2. 创建 `RequirementDraft` 并冻结为 `Requirement`
3. 创建 `ChangeRequest` 并检查其与 `Requirement`、`ReviewRecord` 的关系是否成立
4. 创建 `Task`、`TaskRun`、`VerificationRun` 并检查关系是否成立
5. 创建 `Bug`、`Blocker`、`ReviewRecord`、`GateDecision` 并检查关联
6. 校验缺失关键字段时写入失败
