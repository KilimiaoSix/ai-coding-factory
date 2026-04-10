# Source Map

本文件用于维护三层映射关系：

- 同级 `00-09` 模块文档
- 新手册章节范围
- 对应的关键源码入口

## 模块文档到章节的主映射

| 现有文档 | 对应章节 | 主要源码入口 |
| --- | --- | --- |
| `../00-architecture-overview.md` | `ch01` `ch02` `ch03` `ch44` `ch45` | `src/main.tsx`, `src/QueryEngine.ts`, `src/Tool.ts`, `src/commands.ts`, `src/tools.ts` |
| `../01-entrypoint-and-startup.md` | `ch01` `ch04` `ch43` `ch44` | `src/entrypoints/cli.tsx`, `src/main.tsx`, `src/entrypoints/init.ts`, `scripts/build.ts` |
| `../02-service-layer.md` | `ch02` `ch12` `ch19` `ch39` `ch40` `ch41` `ch42` | `src/services/api/`, `src/services/mcp/`, `src/services/oauth/`, `src/services/analytics/`, `src/services/compact/` |
| `../03-tool-system.md` | `ch07` `ch14` `ch15` `ch16` `ch17` `ch18` `ch19` | `src/Tool.ts`, `src/tools.ts`, `src/tools/`, `src/services/tools/` |
| `../04-bridge-system.md` | `ch24` `ch26` `ch27` `ch44` | `src/bridge/`, `src/commands/teleport/`, `src/utils/teleport/`, `src/remote/` |
| `../05-command-system.md` | `ch35` `ch37` `ch38` `ch43` | `src/commands.ts`, `src/commands/`, `src/skills/`, `src/plugins/` |
| `../06-query-engine.md` | `ch01` `ch05` `ch06` `ch08` `ch09` `ch10` `ch11` `ch12` | `src/QueryEngine.ts`, `src/query.ts`, `src/query/`, `src/services/compact/` |
| `../07-permission-system.md` | `ch08` `ch20` `ch21` `ch22` `ch23` | `src/hooks/toolPermission/`, `src/utils/permissions/`, `src/utils/sandbox/` |
| `../08-ui-components.md` | `ch31` `ch32` `ch33` `ch34` | `src/ink/`, `src/components/`, `src/screens/` |
| `../09-config-and-state.md` | `ch10` `ch11` `ch13` `ch28` `ch29` `ch30` `ch44` | `src/state/`, `src/utils/config.ts`, `src/utils/sessionStorage.ts`, `src/services/SessionMemory/` |

## 章节簇到源码目录的映射

### 全景视角与启动

- `ch01-ch04`
- 关键目录：`src/entrypoints/`, `src/main.tsx`, `src/bootstrap/`, `scripts/build.ts`

### Agent 引擎与上下文

- `ch05-ch13`
- 关键目录：`src/QueryEngine.ts`, `src/query/`, `src/services/compact/`, `src/services/SessionMemory/`, `src/memdir/`

### 工具、权限与安全

- `ch14-ch23`
- 关键目录：`src/Tool.ts`, `src/tools.ts`, `src/tools/`, `src/hooks/toolPermission/`, `src/utils/permissions/`, `src/utils/sandbox/`, `src/services/mcp/`

### 多 Agent、状态与 UI

- `ch24-ch34`
- 关键目录：`src/coordinator/`, `src/tasks/`, `src/utils/worktree.ts`, `src/utils/teleport/`, `src/state/`, `src/ink/`, `src/components/`

### 扩展、韧性与生命周期

- `ch35-ch45`
- 关键目录：`src/commands.ts`, `src/commands/`, `src/services/plugins/`, `src/skills/`, `src/services/api/`, `src/services/oauth/`, `src/services/analytics/`

## 快照校正原则

- 如果 `other-ans`、同级模块文档与源码快照不一致，以当前 `src/` 结构为准。
- 如果能力受 `feature()` 或内部包门控控制，章节中必须显式写明，不把它描述为外部快照的稳定可用功能。
- 如果章节涉及内部发行版能力，优先使用“接口、门控点、降级路径”来描述，而不是推断缺失实现细节。

