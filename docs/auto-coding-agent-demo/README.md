# ACF 大型 Demo 与样例说明

本目录保存的是 `ACF` 的大型自动编码示例材料，用于展示长流程自动执行、任务驱动开发和样例项目落地方式。它是演示与实验目录，不是当前主系统源码。

## 目录内容

- `CLAUDE.md`：示例工作流和执行约束
- `task.json`：任务清单
- `progress.txt`：执行过程记录
- `architecture.md`：示例项目架构说明
- `hello-nextjs/`：样例项目
- `supabase/`：样例项目数据库相关内容
- `automation-logs/`：自动化运行日志

## 如何阅读

建议按以下顺序阅读：

1. 先看 `architecture.md`，理解样例项目目标
2. 再看 `task.json` 和 `CLAUDE.md`，理解任务拆分与执行规则
3. 然后看 `progress.txt` 和 `automation-logs/`，理解运行过程
4. 最后进入 `hello-nextjs/` 查看样例项目代码

## 使用定位

这个目录主要承担三件事：

- 作为 `Dark Factory` 式自动编码工作法的示例
- 作为基于 Claude Code 基座进行任务驱动开发的样例
- 作为 `ACF` 后续设计与实现时的参考实验材料

## 边界说明

- 本目录不是 `ACF` 控制平面实现
- 本目录证明的是工作法和样例项目可运行，不等于平台能力已经具备
- 如果要理解 `ACF` 当前正式方案，请优先阅读 [acf-blueprint.md](../acf-blueprint.md)
