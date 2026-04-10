# Claude Code 基座参考资料

本目录收纳 `ACF` 所依赖的 Claude Code TypeScript 基座说明资料。它们不是 `ACF` 控制平面本身，而是理解底层执行内核、工具系统、状态管理和运行边界的参考输入。

## 目录结构

- `00-09`：按模块拆分的基座结构说明，适合快速定位
- `claude-code-handbook/`：中文系统手册，适合连续阅读
- `other-ans-archive/`：辅助分析稿归档，不作为主导航
- `method-sources/`：`Dark Factory` 与 `BMAD` 等方法来源文档

## 阅读建议

- 如果你只想快速理解基座结构，先看 `00-architecture-overview.md`
- 如果你需要系统学习这份源码快照，再进入 `claude-code-handbook/`
- 如果你需要追溯设计来源，再看 `method-sources/`

## 与 ACF 的关系

- `ACF` 主文档在 `docs/` 根目录
- 本目录只承担“基座参考资料”职责
- 不应把本目录中的模块说明直接当成 `ACF` 控制平面设计
