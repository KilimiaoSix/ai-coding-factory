# 05 接口说明

## 主要对象

- `TestEnvironmentConfig`
- `VerificationRun`
- `Evidence`

## 环境分类

- `backend`
- `web`

## 关键接口

- `registerEnvironmentConfig`
- `prepareEnvironment`
- `startVerificationRun`
- `collectEvidence`
- `completeVerificationRun`

## 输出契约

- 验证结果必须形成正式 `VerificationRun`
- 日志、截图、视频、报告等必须进入 `Evidence`
- `VerificationRun` 必须包含 `code_anchor_ref`

## 关键约束

- 只做 Backend/Web 两类环境
- 验证底层可不同，结果模型必须统一
