# AI-Coding-Factory 方案评审文档

## 一、文档定位

本文档用于沉淀当前阶段对 `AI-Coding-Factory` 方案的评审结论，作为后续技术架构设计、数据模型设计和任务拆解的前置输入。

本文档不是技术实现文档，也不是详细数据设计文档，重点回答以下问题：

- 当前方案中哪些方向已经评审通过，可以视为已决策
- 哪些问题必须在进入正式架构设计前尽快拍板
- 哪些问题可以在后续设计期继续细化，而不阻塞项目推进
- 现有仓库能稳定复用哪些能力，哪些部分不应被误判为首期直接可用

## 二、评审上下文

本轮评审基于以下材料和前提展开：

- 项目立项文档：[ai-coding-factory-project-proposal.md](/Users/kilimiao/CodeProject/claude-code/docs/ai-coding-factory-project-proposal.md)
- 方法与流程参考：[dark-factory-development-pattern.md](/Users/kilimiao/CodeProject/claude-code/docs/dark-factory-development-pattern.md)
- 外部方法标准评估：[bmad-standard-evaluation.md](/Users/kilimiao/CodeProject/claude-code/docs/bmad-standard-evaluation.md)
- 当前仓库的可复用底层能力：子 Agent、任务系统、Agent 编辑、worktree、终端 UI、权限系统、会话持久化

评审过程中同时确认了一个重要边界：

- 当前仓库适合作为 `AI-Coding-Factory` 的执行内核与交互壳
- 当前仓库并不等于现成可用的“研发工厂控制平面”
- 首期必须在现有 runtime 之上新增结构化控制平面，而不是继续放大单 Agent 对话能力

## 三、总体结论

综合当前立项文档、现有代码底座和已完成的方案讨论，结论如下：

- `AI-Coding-Factory` 的方向成立，且与当前仓库的复用路径匹配
- 项目最合理的路径不是重写底层 Agent runtime，而是在其上构建本地优先的控制平面
- 首期产品应以“多项目、多角色、可验证、可审计”的研发运营控制台为中心，而不是先做大而全的自动化平台
- 目前方案已经完成若干关键方向的拍板，但仍有一组高优先级对象模型与权限问题，需要在正式架构设计前收敛

## 四、已完成评审并可视为已决策的事项

### 1. 控制平面真相源

已决策：

- 采用“本地优先控制平面”
- 结构化状态以本地数据库为主保存
- 证据、日志、截图、报告、构建产物等以本地文件系统保存
- 文件体系不再充当官方状态源，而是作为证据载体
- 未来服务端主要承担同步、协作、审计与组织治理能力

这意味着首期架构的基本判断已经成立：

- `DB 为主`
- `Artifact Store 为辅`
- `服务端非首期真相源`

### 2. 写任务默认 worktree 隔离

已决策：

- `Dev Agent` 的写任务默认在独立 `worktree` 中运行
- 非写任务不强制进入 `worktree`
- `QA Agent` 验证某个具体开发任务时，优先在对应 `worktree` 上执行

这一决策解决的是并行开发的基础工程问题：

- 代码隔离
- 验证归因
- 回滚可控
- 多 Agent 并发写入不互相污染

### 3. QA、Bug、发布裁决边界

已决策：

- `QA Agent` 不只是验证执行者，还承担质量负向裁决职责
- `QA Agent` 是 `Bug` 体系的唯一创建者、回归验证者和关闭者
- `Dev Agent` 不纳入 `Bug` 体系，在开发中发现的问题作为任务内部返工处理
- `Dev Agent` 负责修复 `QA Agent` 提出的 `Bug`，但无权关闭 `Bug`
- `QA Agent` 有权让相关 `Gate` 进入 `failed` 或 `blocked`
- `QA Agent` 无权推进阶段，也无权做最终发布决定
- 阶段推进采用主控 Agent 机制，不再由单一角色独占
- `Lead Agent` 主控技术后段推进与发布建议
- `PM Agent` 主控前段流程推进与收口
- `Product Agent` 负责业务验收输入，但不直接承担流程推进职责

该分工形成了清晰的三权拆分：

- `Dev`：执行权
- `QA`：否决输入权
- `Lead / PM`：按阶段分工承担推进主控权

### 4. Backend 与 Web 测试环境的实现策略

已决策：

- `Backend Test Environment` 与 `Web Test Environment` 首期底层分别实现
- 控制平面上层统一结果模型
- 首期不强行统一底层执行器、启动方式、依赖拉起方式与证据采集细节

统一层面聚焦于：

- `VerificationRun`
- `Evidence`
- `FailureCategory`
- `GateDecision`

### 5. GUI 首期定位

已决策：

- GUI 首期定位为“多项目老板视角的运营控制台”
- GUI 不是单纯对话框，也不是追求视觉复杂度的工厂大屏
- GUI 首期支持多项目管理、Agent 状态观察、与 `Product Agent` 的持续需求对话、`Start` 启动交互、模型配置与测试环境设置

关键约束：

- 用户与 `Product Agent` 的对话必须写入同一套结构化控制平面对象
- 首期需求入口采用 `RequirementDraft -> Start -> Requirement` 链路：仅 `Product Agent` 维护 draft，用户点击 `Start` 后由系统冻结需求基线、创建正式 `Requirement`，并正式进入工厂流程
- `Start` 后新建的 `Requirement` 从 `phase = intake` 开始，不直接进入开发，而是进入 `Product / PM / Lead` 参与的正式需求评审
- 首期不提供手工编排入口，不形成两套平行系统

### 6. 评审链与回溯能力边界

已决策：

- 评审链需要单独建模，不能只靠聊天记录、Gate 摘要字段或零散备注承载
- 首期回溯能力采用“可追溯 + 阶段重开”模式，不做任意历史快照回滚
- 首期应引入轻量评审记录对象，用于承载需求评审、方案评审、详细设计评审、代码评审、业务验收等正式评审动作
- `GateDecision` 继续承接阶段出口裁决，评审记录与阶段出口裁决分层处理
- 关键状态变更仍建议通过事件记录保留审计链路

这意味着首期控制平面至少要同时具备三层能力：

- `ReviewRecord` 一类对象承载正式评审动作
- `GateDecision` 承载阶段出口裁决
- 阶段 `reopen` 能力承接有限回退

### 7. `Start` 后的需求变更边界

已决策：

- `Start` 后用户仍然可以持续输入，工厂前台不能因为进入执行态就关闭用户输入通道
- `Start` 后的用户输入默认先进入 `Product Agent`，不直接覆盖正式 `Requirement` 基线
- 首期引入独立且完整的 `Change Request` 对象，用于承接所有影响执行基线的正式需求变更
- 普通澄清、Blocker 回复和不影响范围/验收标准的补充信息，不直接进入 `Change Request`
- 影响范围、验收标准、交付边界、优先级或排期基线的输入，必须形成正式 `Change Request`
- `Change Request` 未批准前，在途 Agent 默认继续当前已批准基线，不因用户新输入自动漂移
- `Change Request` 批准后，由 `PM` 与 `Lead` 共同决定哪些任务继续、哪些调整、哪些暂停或取消
- 只有明确的停止/紧急覆盖指令，才允许大范围立即打断在途 Agent

这意味着首期控制平面需要明确区分三类东西：

- 当前正式执行基线
- 待审批的需求变更
- 变更获批后对在途任务的影响处置

### 8. 用户接入型 Blocker 的升级边界

已决策：

- `Blocker` 默认内部流转，内部创建不等于自动打扰用户
- 用户接入型 `Blocker` 的升级权按类型分配，而不由单一角色独占
- 技术型 `Blocker` 由 `Lead` 升级
- 协调型 `Blocker` 由 `PM` 升级
- 业务决策型 `Blocker` 由 `Product` 升级
- 虽然升级权分角色，但最终仍统一通过 `Product Agent` 面向用户表达
- 只有已影响流程推进、内部无法自愈且明确需要外部动作的 `Blocker` 才允许升级给用户
- 升级给用户时必须附带明确动作请求，而不是只同步“系统卡住了”

这意味着首期控制平面应明确区分：

- `Blocker` 的内部发现者
- `Blocker` 的升级权角色
- `Product Agent` 作为统一前台表达者

## 五、已形成设计方向，但应转入详细设计的事项

以下内容已经完成方案层讨论，方向基本明确，但当前文档不再继续展开字段、JSON 结构和枚举细节；后续应转入技术架构文档或数据设计文档处理。

为避免信息丢失，已从本评审文档中拆出的预设计内容已转存到：

- [ai-coding-factory-preliminary-design-notes.md](/Users/kilimiao/CodeProject/claude-code/docs/ai-coding-factory-preliminary-design-notes.md)

### 1. 首期最小对象模型骨架

已明确的方向：

- 外层以 `Requirement / Phase / Gate` 驱动
- 内层以 `Task / Verification / Bug / Evidence` 驱动
- 首期最小运行对象收敛为：
  - `Project`
  - `Requirement`
  - `Task`
  - `TaskRun`
  - `VerificationRun`
  - `Evidence`
  - `Bug`
  - `Blocker`
  - `GateDecision`
- `Requirement.phase` 采用 6 个阶段：
  - `intake`
  - `planning`
  - `execution`
  - `qa`
  - `release`
  - `done`
- `GateDecision` 作为独立对象建模，并与阶段出口一一对应
- `Bug` 必须来自 QA 正式验证结果
- `Blocker` 与 `Bug` 分开建模
- `Task` 首期只保留 `analysis / implementation / verification / fix` 四类

这些点已经足够支撑方案成立，字段和状态流转细节不再在本评审文档中展开。

### 2. Requirement / Task 的分层建模方向

已明确的方向：

- 首期采用 `RequirementDraft -> Start -> Requirement` 链路
- `Product Agent` 只维护 `RequirementDraft`
- 用户点击 `Start` 后，由系统冻结基线并创建正式 `Requirement`
- 正式 `Requirement` 从 `intake` 开始，进入 `Product / PM / Lead` 的正式需求评审
- `Requirement` 采用 `Product / PM / Lead / System` 分层建模
- `Task` 采用 `Lead / PM / Owner / System` 分层建模

这些点已经属于详细设计输入；字段表、同步规则和最小列集合不再保留在本评审文档中。

### 3. Phase 与主控 Agent 机制

已明确的方向：

- `Requirement.phase` 必须与 `Task`、`VerificationRun`、`Bug`、`Blocker` 等执行事实关联
- 阶段不因任务状态满足而自动推进
- 系统负责聚合事实，主控 Agent 负责做正式 `GateDecision`
- 首期建议的主控分配为：
  - `intake -> planning`：`PM`
  - `planning -> execution`：`PM`
  - `execution -> qa`：`Lead`
  - `qa -> release`：`Lead`
  - `release -> done`：`PM`

Gate 输入项命名、输入结构和聚合方式已形成初步方向，但已下沉到详细设计层，不再保留在本评审文档中。

## 六、仍需方案层继续拍板的问题

当前仍属于“方案评审”层、尚未完全拍板的问题，建议优先继续讨论以下事项。

### 1. GUI 的前台与后台角色呈现边界

目前已拍板：

- 用户前台入口为 `Product Agent`
- GUI 是多项目运营控制台

但仍需方案层明确：

- `PM / Lead / QA` 在用户面前显示到什么程度
- 哪些内部状态只在控制台展示，不直接进入对话前台
- 前台对话与后台组织态信息如何协同，而不让用户看到多个入口角色

## 七、后续建议顺序

建议后续按以下顺序推进：

1. 先收口剩余方案层问题，重点处理 GUI 的前后台角色呈现边界
2. 基于已决策结论输出首期技术架构草案
3. 将当前已经形成方向的对象模型、字段、Gate 输入结构转入详细设计文档
4. 在技术架构草案基础上补齐测试环境契约与 GUI 信息架构

## 八、评审结论

当前 `AI-Coding-Factory` 方案的高层方向已经基本成立，核心边界也已经稳定：

- 本地优先控制平面
- 多角色分权
- 纯对话委派入口
- `RequirementDraft -> Start -> Requirement`
- PM 与 Lead 分工后的阶段主控机制
- QA 驱动的缺陷与门禁体系

接下来不宜继续在方案评审文档里下沉到字段和 JSON 结构层，而应把这部分转入正式技术设计。方案评审阶段剩余的重点，应集中在仍会影响产品边界和控制平面职责划分的少量高层问题上。
