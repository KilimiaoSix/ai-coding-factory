# 04 验收标准

## 验收条件

- `Task` 和 `TaskRun` 生命周期清晰
- 写任务默认走隔离策略
- `TaskRun` 结束后有 `code_anchor_ref`
- 后续模块可以通过锚点引用到被执行代码

## 测试场景

1. 创建分析任务并执行
2. 创建实现任务并验证隔离策略
3. 执行完成后检查 `worktree_ref` 和 `code_anchor_ref`
4. 校验缺失锚点时后续流程不能进入 Gate
