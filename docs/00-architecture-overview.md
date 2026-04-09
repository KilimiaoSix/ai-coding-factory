# Claude Code 架构总览

本文档提供 Claude Code 源码快照的架构全景图，帮助快速理解整个系统的设计。

## 一、系统概述

Claude Code 是 Anthropic 的官方 CLI 工具，用于在终端与 Claude 交互，执行软件工程任务（文件编辑、命令执行、代码搜索等）。

**代码规模**: ~1,900 文件, 512,000+ 行代码

**技术栈**:
| 组件 | 技术 |
|------|------|
| 运行时 | Bun |
| 语言 | TypeScript (strict) |
| 终端UI | React 19 + Ink (自定义fork) |
| CLI框架 | Commander.js 13 |
| Schema验证 | Zod v3 |
| 协议 | MCP SDK, LSP |
| API | Anthropic SDK |
| 遥测 | OpenTelemetry |

## 二、架构分层

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLI Entry Layer                          │
│         src/entrypoints/cli.tsx → src/main.tsx                  │
├─────────────────────────────────────────────────────────────────┤
│                       Command Layer                             │
│              src/commands.ts + src/commands/                    │
├─────────────────────────────────────────────────────────────────┤
│                        Tool Layer                               │
│               src/tools.ts + src/tools/                         │
├─────────────────────────────────────────────────────────────────┤
│                      Query Engine                               │
│              src/QueryEngine.ts + src/query.ts                  │
├─────────────────────────────────────────────────────────────────┤
│                       Service Layer                             │
│        src/services/ (API, MCP, OAuth, Analytics, ...)          │
├─────────────────────────────────────────────────────────────────┤
│                       State Layer                               │
│        src/state/ + src/utils/config.ts                         │
├─────────────────────────────────────────────────────────────────┤
│                        UI Layer                                 │
│           src/ink/ + src/components/                            │
└─────────────────────────────────────────────────────────────────┘
```

## 三、核心模块文档

| 文档 | 内容 |
|------|------|
| [01-entrypoint-and-startup.md](01-entrypoint-and-startup.md) | 入口点和启动流程 |
| [02-service-layer.md](02-service-layer.md) | 服务层架构 |
| [03-tool-system.md](03-tool-system.md) | 工具系统架构 |
| [04-bridge-system.md](04-bridge-system.md) | Bridge远程控制系统 |
| [05-command-system.md](05-command-system.md) | 命令系统架构 |
| [06-query-engine.md](06-query-engine.md) | QueryEngine核心 |
| [07-permission-system.md](07-permission-system.md) | 权限系统架构 |
| [08-ui-components.md](08-ui-components.md) | 终端UI系统 |
| [09-config-and-state.md](09-config-and-state.md) | 配置和状态管理 |

## 四、目录结构速览

```
src/
├── main.tsx                 # 主程序入口 (Commander.js CLI)
├── QueryEngine.ts           # LLM查询引擎
├── Tool.ts                  # 工具类型定义
├── commands.ts              # 命令注册
├── tools.ts                 # 工具注册
│
├── entrypoints/             # 入口点
│   └── cli.tsx              # CLI引导入口
│
├── commands/                # 斜杠命令实现 (~50个)
│   ├── commit/              # /commit
│   ├── mcp/                 # /mcp
│   ├── config/              # /config
│   └── ...
│
├── tools/                   # 工具实现 (~40个)
│   ├── BashTool/            # Shell执行
│   ├── FileReadTool/        # 文件读取
│   ├── FileEditTool/        # 文件编辑
│   ├── AgentTool/           # 子代理
│   └── ...
│
├── services/                # 服务层
│   ├── api/                 # Anthropic API
│   ├── mcp/                 # MCP集成
│   ├── oauth/               # OAuth认证
│   ├── analytics/           # 分析服务
│   └── ...
│
├── bridge/                  # 远程控制系统
│   ├── bridgeMain.ts        # 主循环
│   ├── bridgeMessaging.ts   # 消息协议
│   └── ...
│
├── hooks/                   # React Hooks + 权限系统
│   └── toolPermission/      # 工具权限处理
│
├── components/              # UI组件 (~140个)
│   ├── messages/            # 消息显示
│   ├── permissions/         # 权限对话框
│   └── ...
│
├── ink/                     # 自定义Ink渲染器
│   ├── reconciler.ts        # React Reconciler配置
│   ├── dom.ts               # DOM抽象
│   ├── layout/              # Yoga布局
│   └── components/          # 基础组件
│
├── state/                   # 状态管理
│   ├── AppStateStore.ts     # AppState定义
│   └── store.ts             # Store实现
│
├── utils/                   # 工具函数
│   ├── permissions/         # 权限检查
│   ├── config.ts            # 配置加载
│   └── ...
│
├── schemas/                 # Zod Schema定义
├── migrations/              # 配置迁移
├── memdir/                  # 持久化内存
├── tasks/                   # 任务管理
├── vim/                     # Vim模式
├── keybindings/             # 快捷键
├── skills/                  # 技能系统
└── constants/               # 常量定义
```

## 五、关键数据流

### 5.1 查询流程

```
用户输入 → processUserInput()
         → submitMessage() [QueryEngine]
         → queryLoop() [query.ts]
         → callModel() [claude.ts]
         → API Streaming
         → 工具执行 [StreamingToolExecutor]
         → 结果聚合
         → 响应用户
```

### 5.2 权限流程

```
工具调用 → hasPermissionsToUseTool()
         → 规则检查 (allow/deny/ask)
         → 模式检查 (bypass/auto/default)
         → 处理器分发:
            - InteractiveHandler (主Agent)
            - CoordinatorHandler (Worker)
            - SwarmWorkerHandler (Swarm)
         → 用户确认/自动批准
         → 执行/拒绝
```

### 5.3 Bridge流程

```
claude.ai/code → CCR服务器
              → Bridge进程轮询
              → 会话创建
              → 子进程CLI
              → 消息同步
              → 权限代理
```

## 六、Feature Flags

所有特性标志在外部构建中默认为`false`，实现编译时死代码消除：

| 标志 | 功能 |
|------|------|
| `BRIDGE_MODE` | 远程控制 |
| `DAEMON` | 后台守护进程 |
| `VOICE_MODE` | 语音输入 |
| `COORDINATOR_MODE` | 多代理协调 |
| `PROACTIVE` | 主动模式 |
| `KAIROS` | 助手模式 |

## 七、配置源层级

```
优先级 (从低到高):
1. userSettings     - ~/.claude/settings.json
2. projectSettings  - .claude/settings.json
3. localSettings    - .claude/settings.local.json
4. flagSettings     - --settings 命令行
5. policySettings   - managed-settings.json (企业)
```

## 八、构建说明

本源码快照缺少内部Anthropic包，构建时自动stub：

```bash
bun install      # 安装依赖
bun run build    # 构建 → dist/cli.js
bun dist/cli.js  # 运行
```

构建脚本 (`scripts/build.ts`) 处理：
- `bun:bundle` feature flags polyfill
- `MACRO.*` 构建时常量注入
- 内部包自动stub
- 缺失源文件自动stub

## 九、关于本仓库

本仓库是 Claude Code TypeScript 源码快照，用于教育、安全研究和架构学习。

- **来源**: 2026年3月31日通过npm包source map暴露
- **用途**: 教育、安全研究、架构分析
- **声明**: 不代表Anthropic官方，内部包不可用