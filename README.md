# 基于 ClaudeCode 实现的全自动代码工厂（ACF）

`ACF` 是一个建立在当前 Claude Code TypeScript 基座之上的自动化研发控制平面，目标不是继续强化单个 Agent 工具，而是把需求冻结、任务编排、开发执行、验证回流、质量门禁和交付治理组织成一个可控闭环。

## 项目需求

传统 AI 编码工具更像“局部协作助手”，能补代码、跑命令、改文件，但很难稳定承担面向组织交付的完整研发过程。`ACF` 要解决的问题不是“让 Agent 更像人写代码”，而是“让一组 Agent 在明确规则、阶段和证据链下完成需求交付”。

项目面向两类用户：

- 团队管理者：需要可见的需求状态、阶段门禁、验证结果和风险信息
- 一线使用者：需要通过统一前台入口描述需求、接收反馈并驱动研发流程

核心目标包括：

- 把需求从草稿、冻结、执行到交付形成结构化闭环
- 用角色化 Agent 承担 Product、PM、Lead、Dev、QA 等不同职责
- 让开发、验证、缺陷修复和 Gate 推进都有正式对象和证据
- 让控制平面状态始终与代码版本、worktree 和验证结果对齐

## 当前实施阶段

- 蓝图阶段已完成
- 当前处于首期 MVP 实施准备阶段
- 现阶段重点落在控制平面对象层、运行时适配层、验证基座和 GUI 首期能力

首期 MVP 聚焦的是一条可验证闭环，而不是一次性做完整组织治理平台。

## 当前能力与未完成项

### 已有基座能力

- `src/` 提供现成的 Agent runtime、工具系统、会话留痕、任务原语和终端 UI 壳
- 当前仓库已经具备 worktree 原语、结构化 transcript、Agent 文件定义与编辑能力
- `docs/auto-coding-agent-demo/` 提供了可运行的大型自动编码示例和实验材料

### 正在建设的 ACF 能力

- 控制平面对象层：`RequirementDraft`、`Requirement`、`TaskRun`、`VerificationRun`、`GateDecision` 等
- 控制平面与 runtime 的适配层
- Backend/Web 测试环境基座
- Product 前台入口与 GUI 运营控制台
- 正式评审链、缺陷回流链和阶段门禁体系

## 快速导航

- [实施蓝图](./docs/acf-blueprint.md)
- [项目业务说明](./docs/acf-business-overview.md)
- [设计理念](./docs/acf-design-principles.md)
- [模块规格目录](./docs/acf-modules/README.md)
- [Claude Code 基座参考资料](./docs/claude-code-reference/README.md)
- [大型 Demo 与样例说明](./docs/auto-coding-agent-demo/README.md)

## 仓库结构

```text
src/    Claude Code 执行内核基座
docs/   ACF 文档、模块规格、基座参考资料与大型示例
```

- `src/` 是当前项目继续开发所依赖的执行内核，不是现成控制平面
- `docs/` 收纳 ACF 主文档、模块规格、Claude Code 基座资料和自动编码示例

## 基座来源说明

当前仓库源于 Claude Code 的 TypeScript 源码快照。`ACF` 的策略不是重写这一执行内核，而是在其上新增控制平面、验证基座和运营界面，把已有 Agent 能力组织成面向交付的自动化研发系统。
