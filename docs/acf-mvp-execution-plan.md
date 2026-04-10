# ACF 首期 MVP 实施计划

- 状态: `draft`
- 上游文档: [acf-blueprint.md](./acf-blueprint.md)、[acf-design-principles.md](./acf-design-principles.md)、[docs/acf-modules/module-index.md](./acf-modules/module-index.md)
- 适用范围: 首期 `MVP`
- 非目标: 不覆盖二期/三期治理能力，不在首期同时完成 `CC/Codex` 代理 Agent 接入

## 1. 文档定位

本文档是 [acf-blueprint.md](./acf-blueprint.md) 的派生执行计划，用于把唯一实施蓝图转换为可排期、可分工、可验收的开发顺序。

本文档不是第二份蓝图，也不替代 [acf-blueprint.md](./acf-blueprint.md) 的唯一蓝图地位。若本文档与蓝图存在冲突，应以蓝图为准，并回收本文档中的偏差表述。

本文档与其他文档的关系如下：

- [acf-blueprint.md](./acf-blueprint.md): 提供首期范围、对象模型、系统设计和总体实施蓝图。
- [acf-design-principles.md](./acf-design-principles.md): 提供“在当前仓库内新增控制平面、原生执行引擎优先”的分层原则。
- [acf-business-overview.md](./acf-business-overview.md): 提供业务目标、用户价值和核心闭环说明。
- [docs/acf-modules/module-index.md](./acf-modules/module-index.md): 提供模块边界、依赖和推荐实施顺序。

本计划的核心边界只有一条：`ACF` 首期继续在当前仓库内建设，当前仓库承担原生执行引擎与宿主角色；`CC/Codex` 作为后续代理 Agent 接入，不属于首期主线。

## 2. 当前现状映射

### 2.1 已有基座能力

当前仓库已经具备首期 `ACF` 可以直接复用或上浮的基座能力：

| 能力 | 当前仓库现状 | 在 `ACF` 中的作用 |
| --- | --- | --- |
| multi-agent 执行基座 | 已有本地/远程/后台任务与 agent 协作原语 | 作为 `TaskRun` 的原生执行能力 |
| worktree 原语 | 已有 `.claude/worktrees`、分支隔离、创建/恢复/清理逻辑 | 作为写任务隔离策略基础 |
| transcript / JSONL 留痕 | 已有会话持久化、JSONL transcript、恢复逻辑 | 作为 `Evidence` 和审计追溯的底层来源 |
| plan mode | 已有 `/plan` 命令和计划文件管理 | 可复用为 `RequirementDraft` 前置准备能力之一 |
| context 分析 | 已有 `/context` 分析链路和上下文可视化 | 可复用为 `ProjectContextSummary` 的输入来源之一 |
| agent definitions | 已有 built-in / project / user / plugin agent 定义加载能力 | 可复用为 `AgentProfile` 的底层来源之一 |
| CLI / stream-json / server 入口 | 已有 `--print`、`--input-format`、`--output-format=stream-json` 等接入面 | 适合作为控制平面与原生执行引擎之间的稳定边界 |

### 2.2 当前缺口

当前仓库并没有现成的 `ACF` 控制平面，至少还缺以下子系统：

- 正式控制平面对象层：`Project`、`RequirementDraft`、`Requirement`、`ChangeRequest`、`ReviewRecord`、`Task`、`TaskRun`、`VerificationRun`、`Evidence`、`Bug`、`Blocker`、`GateDecision`、`AgentProfile`
- 本地持久化层与对象索引层
- 面向控制平面的 `RuntimeAdapter`
- 统一验证结果模型
- 正式 `Gate` 规则与阶段推进逻辑
- 双端控制台共用的控制平面 backend
- 后续代理 Agent 接入边界

### 2.3 现状与蓝图的关键区分

当前仓库里的 `Task` 主要是执行层任务状态与 UI/进程管理原语，不等于蓝图中的 `ACF` 业务 `Task / TaskRun`。同理，transcript 事件也不能直接充当 `RequirementDraft`、`ReviewRecord`、`GateDecision` 这样的正式业务对象。

因此，首期开发必须坚持以下映射原则：

- 现有 runtime 原语可以复用，但不能直接冒充正式控制平面对象。
- transcript 和日志用于追溯与取证，不作为主状态源。
- 控制平面状态必须独立建模，并能回指到具体代码版本或 worktree 快照。

## 3. 首期实施原则

### 3.1 本地优先

首期 `ACF` 采用本地优先方案。正式控制平面状态、证据索引和运行归因都以当前项目目录为中心组织，不预设服务端多租户协作。

建议把首期控制平面数据目录统一约定为：

```text
.claude/acf/
  control-plane.sqlite
  artifacts/
  evidence/
  snapshots/
```

### 3.2 `code_anchor_ref` 强制化

任何 `TaskRun`、`VerificationRun`、`GateDecision` 的有效性都必须能够锚定到具体代码版本、分支或 worktree 快照。不能定位到代码版本的结论，只能视为不完整证据。

### 3.3 transcript 只做 evidence

transcript、JSONL、session memory、plan 文件都可以作为证据来源或辅助上下文，但不能作为控制平面主状态存储。正式业务对象必须有独立 schema、独立生命周期和独立查询路径。

### 3.4 Backend / Web 分治、结果统一

首期验证环境只收敛为 `Backend` 与 `Web` 两类。它们底层运行方式可以不同，但最终都必须汇总为统一的 `VerificationRun + Evidence` 语言。

### 3.5 GUI 双轨并行、backend 统一

首期 GUI 采用双轨并行策略：

- 一条轨道是基于当前仓库的 CLI / TUI 控制台。
- 另一条轨道是浏览器 GUI。

两端都只能读写同一套本地控制平面 backend，不能分别维护状态机、数据库或调度逻辑。

### 3.6 原生引擎优先，代理 Agent 后置

首期先在当前仓库内跑通原生执行引擎闭环。`CC/Codex` 等代理 Agent 的接入需要预留边界，但不抢占首期对象层、验证链和门禁链的主线排期。

## 4. 实施阶段

实施顺序与 [docs/acf-modules/module-index.md](./acf-modules/module-index.md) 保持一致：

`01 -> 02 -> 03 -> 04 -> 05 -> 06 -> 08 -> 07`

### Phase 0: 开发前准备

**目标**

建立首期开发所需的仓库内目录、工具链、测试入口约定和数据目录约定，避免后续阶段在基础设施层反复返工。

**输入**

- 当前仓库构建方式
- 现有 `Bun` 工具链要求
- 首期 `ACF` 模块顺序与边界

**输出**

- 明确的本地开发工具链基线
- 明确的测试入口约定
- 约定好的 `.claude/acf/` 数据目录结构
- 约定好的 `src/acf/` 或等效代码落点

**依赖**

- 无

**关键工作**

- 补齐 `Bun` / toolchain 环境前提
- 明确首期代码验证入口和文档验收入口
- 约定 `.claude/acf/` 本地数据目录
- 约定控制平面代码在当前仓库内的组织方式

**完成定义**

- 开发者可以在统一工具链下执行构建和类型检查
- 团队对首期数据目录与代码落点达成一致
- 后续阶段不再争论“状态放哪里”和“代码放哪里”

### Phase 1: `01-control-plane-objects`

**目标**

建立正式控制平面对象层与本地存储基线，为所有后续功能提供统一数据语言。

**输入**

- 蓝图中的对象模型与字段约束
- 设计原则中的分层要求

**输出**

- 控制平面 schema
- 核心枚举和状态约束
- repository / storage 接口
- artifact index 基线
- `Project` 到 `GateDecision` 的全对象集

**依赖**

- `Phase 0`

**关键工作**

- 先定义正式对象集，不复用 runtime `TaskStatus` 之类的执行层枚举作为业务状态
- 明确对象主键、索引、引用关系和时间线字段
- 明确 transcript / evidence / artifact 的引用方式

**完成定义**

- 控制平面对象可以独立存取，不依赖 transcript 反推
- 每个正式对象有明确生命周期和最小字段约束
- 后续模块都能围绕统一对象集继续开发

### Phase 2: `02-runtime-adapter`

**目标**

建立控制平面与当前原生执行引擎之间的稳定接入层，并为后续代理 Agent 接入预留边界。

**输入**

- 当前仓库的 CLI / stream-json 接口
- `Phase 1` 的正式对象模型

**输出**

- `RuntimeAdapter`
- 原生 runtime 事件投影机制
- 失败回写机制
- 调度与执行边界定义

**依赖**

- `Phase 1`

**关键工作**

- 首选以当前仓库 `CLI --print + stream-json` 作为接入边界
- 建立 runtime 事件到控制平面对象的投影
- 建立失败、超时、中断、异常终止的统一回写路径
- 抽象后续 `cc_proxy` / `codex_proxy` 所需的最小兼容接口

**完成定义**

- 控制平面可以启动一次受控执行，并稳定接收结构化事件
- runtime 失败可以被正式记录，而不是只停留在终端输出
- 后续 `TaskRun` 能通过 adapter 驱动执行而不直接耦合 UI 状态

### Phase 3: `03-intake-and-start`

**目标**

建立需求入口、项目画像、readiness 检查与 `Start` 冻结机制。

**输入**

- `Phase 1` 对象模型
- `Phase 2` runtime 接入能力
- 现有 context / plan / session memory 能力

**输出**

- `RequirementDraft`
- `ProjectContextSummary`
- `ReadinessChecklist`
- `Start` 冻结规则
- post-start 变更路由

**依赖**

- `Phase 1`
- `Phase 2`

**关键工作**

- 把需求草稿与正式需求区分开
- 把上下文摘要与 readiness 检查作为前置约束，而非聊天附带结果
- 定义 `Start` 之后的变更进入 `ChangeRequest` 或其他正式路径

**完成定义**

- 用户可以从统一前台入口形成 `RequirementDraft`
- `Start` 会生成正式执行基线，而不是继续在会话里漂移
- `Start` 之后的新增诉求不会污染既有需求基线

### Phase 4: `04-task-worktree-anchor`

**目标**

建立正式 `Task / TaskRun`、写任务隔离策略和代码锚点规则。

**输入**

- `Phase 1` 正式对象集
- `Phase 2` runtime adapter
- 当前仓库 worktree 原语

**输出**

- `Task`
- `TaskRun`
- 默认写任务 worktree 策略
- `code_anchor_ref` 统一规则

**依赖**

- `Phase 1`
- `Phase 2`
- `Phase 3`

**关键工作**

- 把“任务定义”和“任务执行记录”拆开建模
- 约定哪些任务必须进入 worktree
- 为 `TaskRun`、`VerificationRun`、`GateDecision` 建立统一 `code_anchor_ref`

**完成定义**

- 至少一类写任务默认走 worktree 隔离
- 每个 `TaskRun` 都可以回指到稳定的代码锚点
- 控制平面中的任务状态不再与 runtime 临时状态混淆

### Phase 5: `05-test-environments`

**目标**

建立 `Backend` 与 `Web` 两类验证环境以及统一结果模型。

**输入**

- `Phase 1` 对象层
- `Phase 2` runtime adapter
- `Phase 4` 代码锚点机制

**输出**

- `TestEnvironmentConfig`
- Backend 验证能力
- Web 验证能力
- `VerificationRun`
- `Evidence`

**依赖**

- `Phase 1`
- `Phase 2`
- `Phase 4`

**关键工作**

- 首期只接纳显式配置的测试环境，不做隐式猜测
- 把不同验证方式统一汇总到 `VerificationRun + Evidence`
- 明确验证失败到缺陷回流的结构化接口

**完成定义**

- Backend 和 Web 至少各有一条可执行验证链路
- 验证产物可以被正式沉淀和查询
- 控制平面可以依据 `VerificationRun` 做后续 Gate 评估

### Phase 6: `06-review-bug-gate`

**目标**

建立评审、缺陷、阻塞与门禁闭环。

**输入**

- `Phase 1` 正式对象集
- `Phase 4` 任务与代码锚点
- `Phase 5` 验证结果模型

**输出**

- `ReviewRecord`
- `Bug`
- `Blocker`
- `GateDecision`

**依赖**

- `Phase 1`
- `Phase 4`
- `Phase 5`

**关键工作**

- 定义评审记录的正式输入结构
- 定义缺陷与阻塞的状态推进规则
- 定义阶段门禁的必需输入和拒绝条件

**完成定义**

- 验证失败可以形成正式 `Bug` / `Blocker`
- 阶段推进依赖 `GateDecision`，而不是“任务都做完了”
- 至少一条 `验证失败 -> 缺陷回流 -> 复测 -> 门禁决策` 闭环可跑通

### Phase 7: `08-agent-profile-observability`

**目标**

建立 `AgentProfile`、证据索引和审计链路。

**输入**

- `Phase 1` 正式对象集
- `Phase 2` runtime adapter
- `Phase 4` 任务归因
- `Phase 5` / `Phase 6` 证据与门禁链路

**输出**

- `AgentProfile`
- evidence / transcript link
- audit chain

**依赖**

- `Phase 1`
- `Phase 2`
- `Phase 4`
- `Phase 5`
- `Phase 6`

**关键工作**

- 把现有 agent definitions 投影为控制平面可治理的 `AgentProfile`
- 把证据、执行和角色配置串成审计链
- 为后续代理 Agent 配置映射预留扩展字段

**完成定义**

- 控制平面可以查询角色配置与执行归因关系
- 至少一条任务执行链可以追溯到 agent 配置与证据
- 审计信息不再散落在 transcript 与本地配置文件中

### Phase 8: `07-ops-console`

**目标**

建立首期运营控制台，包括 CLI / TUI 控制台与浏览器 GUI。

**输入**

- `Phase 1` 到 `Phase 7` 的控制平面 backend 能力

**输出**

- CLI / TUI 控制台
- 浏览器 GUI
- 共享本地 API / backend

**依赖**

- `Phase 1`
- `Phase 2`
- `Phase 3`
- `Phase 4`
- `Phase 5`
- `Phase 6`
- `Phase 7`

**关键工作**

- 用共享 backend 暴露项目、需求、任务、验证、缺陷和门禁视图
- CLI / TUI 优先承担首批运营动作与状态浏览
- 浏览器 GUI 承担更适合图形化查看的项目总览与执行视图

**完成定义**

- CLI 与 Web 能查看同一项目状态
- 两端能对同一控制平面对象执行读写操作
- 不存在两套数据库、两套状态机或两套调度逻辑

## 5. 关键接口草案

本节列出的接口和类型是实施目标，不是本次文档新增后的实际代码接口。

本次新增文档不会改变当前仓库公开接口；以下内容只是计划中的接口，用于约束后续开发边界。

### 5.1 `RuntimeAdapter`

```ts
type RuntimeAdapter = {
  startSession(input: StartSessionInput): Promise<RuntimeSessionRef>
  sendInput(sessionId: string, input: RuntimeInput): Promise<void>
  interrupt(sessionId: string): Promise<void>
  streamEvents(sessionId: string): AsyncIterable<RuntimeEvent>
}
```

职责：

- 负责控制平面到原生执行引擎的会话驱动
- 屏蔽 CLI / stream-json 的细节
- 输出供控制平面投影的统一 runtime 事件

### 5.2 `ExecutionDispatcher`

```ts
type ExecutionDispatcher = {
  dispatchTaskRun(
    taskRunId: string,
    agentProfileId: string,
    isolationPolicy: IsolationPolicy,
  ): Promise<DispatchResult>
}
```

职责：

- 负责根据控制平面任务状态触发正式执行
- 统一处理 worktree / 非 worktree 的调度策略
- 为后续 `cc_proxy` / `codex_proxy` 保留兼容边界

### 5.3 `CodeAnchorRef`

```ts
type CodeAnchorRef = {
  repoRoot: string
  gitSha: string
  branch?: string
  worktreePath?: string
  transcriptSessionId?: string
  capturedAt: string
}
```

职责：

- 为 `TaskRun`、`VerificationRun`、`GateDecision` 提供统一代码归因锚点
- 保证控制平面对象可以回溯到代码版本

### 5.4 `VerificationExecutor`

```ts
type VerificationExecutor = {
  prepare(input: VerificationPrepareInput): Promise<PreparedVerification>
  run(input: PreparedVerification): Promise<VerificationExecutionResult>
  collectEvidence(result: VerificationExecutionResult): Promise<EvidenceRef[]>
  finalize(result: VerificationExecutionResult): Promise<VerificationRunRecord>
}
```

职责：

- 负责 `Backend` / `Web` 验证环境的统一执行约束
- 负责把不同验证形式转为统一 `VerificationRun + Evidence`

### 5.5 `GateEvaluator`

```ts
type GateEvaluator = {
  evaluate(input: GateEvaluationInput): Promise<GateEvaluationResult>
}
```

职责：

- 根据评审、验证、缺陷和阻塞输入作出阶段判断
- 显式给出通过、拒绝或缺失输入的原因

### 5.6 预留代理 Agent 边界

首期不实现外部代理 Agent，但建议在接口层预留后续扩展点：

- `NativeRuntimeAdapter`
- `ClaudeCodeProxyAdapter`
- `CodexProxyAdapter`

首期只落地 `NativeRuntimeAdapter`，其余仅保留接口位置与事件兼容要求。

### 5.7 本地 API 资源边界

建议首期只暴露最小资源集合：

- `/projects`
- `/requirements`
- `/tasks`
- `/task-runs`
- `/verification-runs`
- `/bugs`
- `/gates`
- `/events`

这些 API 的作用是为 CLI / TUI 与浏览器 GUI 提供统一访问面，而不是对外公开服务端平台接口。

## 6. 里程碑与完成定义

### M1: 对象层 + 存储可用

- 正式控制平面对象集已经落地
- 本地存储可以独立保存和查询对象
- transcript 不再承担主状态职责

### M2: 一条任务执行链可归因到代码版本

- 至少一类 `TaskRun` 可以被正式调度
- 每次执行都能生成 `code_anchor_ref`
- 执行失败与中断都能被正式记录

### M3: Backend / Web 任一验证可形成正式 `VerificationRun`

- 至少一类 Backend 验证和一类 Web 验证能跑通其一
- 验证产物可以沉淀为 `Evidence`
- 控制平面可以按对象查询验证结果

### M4: `Bug / Blocker / GateDecision` 闭环跑通

- 验证失败可以形成缺陷或阻塞
- 缺陷修复后可以重新验证
- 阶段推进依赖正式 `GateDecision`

### M5: CLI 与 Web 都能查看同一项目状态

- CLI / TUI 与浏览器 GUI 共用一套 backend
- 两端显示的项目、任务、验证与门禁状态一致
- 双端只负责视图和动作，不重复建设控制平面逻辑

## 7. 风险与依赖

### 7.1 Bun 环境缺失

当前仓库以 `Bun` 为构建与运行前提。如果开发环境未满足该前提，首期实施将缺少稳定的构建、类型检查和本地验证反馈链。

### 7.2 数据模型与现有 runtime 语义混淆

如果把现有 runtime 任务、transcript 事件或 UI 状态直接等同于控制平面业务对象，后续阶段会出现状态失真、难以迁移和难以治理的问题。

### 7.3 双 GUI 导致后端重复建设

如果 CLI / TUI 与浏览器 GUI 分别维护数据库、状态机或调度逻辑，首期范围会立刻失控，也会直接破坏“控制平面唯一事实源”的目标。

### 7.4 过早抽象代理 Agent

如果在首期对象层和验证链还未稳定时就同时推进 `CC/Codex` 代理接入，接口很容易被未来假设绑架，反而拖慢原生闭环落地。

### 7.5 外部验证环境复杂度失控

如果 `Backend` / `Web` 验证环境首期没有坚持显式配置和范围收敛，测试基座很容易演变成泛化平台集成工程，拖慢主闭环落地。

## 8. 文档验收方式

本文档的验收只做文档一致性检查，不包含代码修改验收。

验收标准如下：

- 与 [acf-blueprint.md](./acf-blueprint.md) 术语一致
- 与 [docs/acf-modules/module-index.md](./acf-modules/module-index.md) 的实施顺序一致
- 明确区分“现有基座能力”和“新增控制平面能力”
- 明确写出双 GUI 共用一套 backend 的策略
- 明确写出“原生引擎优先、代理 Agent 后置”的策略
- 每个阶段都有输入、输出、依赖、完成定义

## 9. 附加约束

- 本文档不命名为第二份“蓝图”或“设计原则”
- 本轮只新增这一份文档文件，不扩散到导航、索引、`README` 或代码入口同步
- 若后续进入实现阶段，优先顺序仍按 `01 -> 02 -> 03 -> 04 -> 05 -> 06 -> 08 -> 07` 执行，其中代理 Agent 接入不应抢占首期主线
