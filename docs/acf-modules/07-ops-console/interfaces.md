# 07 接口说明

## 主要视图

- 项目总览
- 需求详情
- 执行视图
- 验证视图
- 缺陷与阻塞视图
- `Product Agent` 前台入口

## 主要读取对象

- `Project`
- `Requirement`
- `Task` / `TaskRun`
- `VerificationRun`
- `Bug`
- `Blocker`
- `GateDecision`

## 关键交互

- 创建草稿需求
- 执行 `Start`
- 查看当前阶段状态
- 查看验证与缺陷摘要
- 查看 Gate 输入和裁决结果

## 关键约束

- GUI 是运营控制台，不是纯聊天窗口换皮
- 对外只保留统一前台入口
