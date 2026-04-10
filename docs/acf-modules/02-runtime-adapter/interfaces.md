# 02 接口说明

## 接入原则

- 首期只要求存在稳定接入面，不要求抽象出所有未来执行器
- 接入层负责把基座事件翻译为控制平面可消费的结构
- 控制平面不直接依赖原始 transcript 作为业务状态

## 关键接口

- `RuntimeAdapter`
  - `startSession(input)`
  - `sendInput(sessionId, input)`
  - `interrupt(sessionId, reason)`
  - `readEvents(sessionId)`
- `ExecutionDispatcher`
  - 根据角色、任务类型、隔离策略调度到底层基座
- `RuntimeEventProjector`
  - 把 session event、tool event、completion event 投影到对象引用链

## 输入输出契约

- 输入：控制平面任务、角色配置、环境上下文
- 输出：运行事件、执行摘要、引用到 `TaskRun` 或 `VerificationRun` 的结果

## 失败约束

- runtime 接入失败必须显式回写到控制平面状态
- 原始 transcript 不得直接充当正式评审或门禁结论
