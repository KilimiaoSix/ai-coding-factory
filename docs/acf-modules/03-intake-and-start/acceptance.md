# 03 验收标准

## 验收条件

- 能创建和更新 `RequirementDraft`
- 能生成和更新 `ProjectContextSummary`
- readiness 未通过时不能 `Start`
- `Start` 后能产生正式 `Requirement`
- `Start` 后的输入可正确分流为注记、`ChangeRequest` 或阻塞回复

## 测试场景

1. 创建草稿并多轮补充
2. 缺失关键信息时 readiness 失败
3. readiness 通过后执行 `Start`
4. `Start` 后发送普通澄清，验证只更新注记
5. `Start` 后发送范围变化，验证创建 `ChangeRequest`
