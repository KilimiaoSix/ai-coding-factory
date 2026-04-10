# ACF 模块规格目录

本目录用于承载 `ACF` 的模块级实现文档，目标是让 AI 在不反复回读整份蓝图的情况下，直接根据单个模块规格完成实现。

## 使用原则

- 蓝图是全局真相源，模块文档是实现输入
- 一个模块只解决一个清晰问题
- 每个模块目录必须自包含，至少覆盖目标、接口、任务和验收
- 模块之间通过依赖关系连接，不通过隐含上下文连接

## 固定结构

每个模块目录固定包含 4 份文档：

- `README.md`：模块目标、范围、依赖、非目标
- `interfaces.md`：对象、字段、接口、事件、状态机、输入输出契约
- `tasks.md`：可直接分配给 AI 的实现任务
- `acceptance.md`：验收标准、测试场景、完成定义

## 当前模块

- [module-index.md](./module-index.md)
- [01-control-plane-objects](./01-control-plane-objects/README.md)
- [02-runtime-adapter](./02-runtime-adapter/README.md)
- [03-intake-and-start](./03-intake-and-start/README.md)
- [04-task-worktree-anchor](./04-task-worktree-anchor/README.md)
- [05-test-environments](./05-test-environments/README.md)
- [06-review-bug-gate](./06-review-bug-gate/README.md)
- [07-ops-console](./07-ops-console/README.md)
- [08-agent-profile-observability](./08-agent-profile-observability/README.md)

## 与主文档的关系

- 全局方案：见 [acf-blueprint.md](../acf-blueprint.md)
- 业务表达：见 [acf-business-overview.md](../acf-business-overview.md)
- 设计原则：见 [acf-design-principles.md](../acf-design-principles.md)
