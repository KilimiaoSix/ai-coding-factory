# Claude Code 配置和状态管理架构

## 一、系统概述

Claude Code 采用分层的配置和状态管理系统，核心设计理念：
1. **分层配置源**: 用户级、项目级、本地级、标志级、策略级
2. **响应式状态管理**: 基于React的单向数据流
3. **类型安全**: 使用Zod schema验证
4. **持久化内存**: 基于文件系统的记忆存储

## 二、配置系统

### 2.1 配置源优先级

```
配置源优先级（从低到高）:
┌──────────────────────────────────────────┐
│  userSettings     - ~/.claude/settings   │  用户全局
├──────────────────────────────────────────┤
│  projectSettings  - .claude/settings     │  项目共享
├──────────────────────────────────────────┤
│  localSettings    - .claude/settings.local │ 项目本地(gitignored)
├──────────────────────────────────────────┤
│  flagSettings     - --settings 标志      │  命令行
├──────────────────────────────────────────┤
│  policySettings   - managed-settings.json │ 企业策略（最高优先级）
└──────────────────────────────────────────┘
```

### 2.2 GlobalConfig结构

```typescript
type GlobalConfig = {
  // 用户偏好
  theme: ThemeSetting
  editorMode: EditorMode
  hasCompletedOnboarding: boolean
  
  // 账户信息
  oauthAccount: OAuthAccount | null
  organizationUuid: string | null
  
  // 缓存数据
  cachedFeatureFlags: Record<string, boolean>
  lastVersionCheck: string | null
  
  // 迁移追踪
  migrations: Record<string, boolean>
}
```

### 2.3 ProjectConfig结构

```typescript
type ProjectConfig = {
  // 权限配置
  allowedTools: string[]
  permissionMode: PermissionMode
  
  // MCP服务器
  mcpServers: Record<string, MCPServerConfig>
  
  // 会话指标
  sessionMetrics: {
    totalTokens: number
    totalCost: number
    sessionCount: number
  }
  
  // 工作树
  worktreeSessions: Record<string, WorktreeSession>
}
```

### 2.4 Settings Schema

**文件**: `src/utils/settings/types.ts`

```typescript
type SettingsJson = {
  // 权限规则
  permissions: {
    allow: PermissionRule[]
    deny: PermissionRule[]
    ask: PermissionRule[]
    defaultMode: PermissionMode
    additionalDirectories: string[]
  }
  
  // Hooks
  hooks: HooksSettings
  
  // 环境变量
  env: Record<string, string>
  
  // MCP服务器
  mcpServers: Record<string, MCPServerConfig>
  
  // 模型配置
  model: string
  
  // ... 100+ 配置项
}
```

## 三、状态管理层

### 3.1 Store实现

**文件**: `src/state/store.ts`

```typescript
type Store<T> = {
  getState: () => T
  setState: (updater: (prev: T) => T) => void
  subscribe: (listener: Listener) => () => void
}
```

**特性**:
- 使用`Object.is`比较避免不必要更新
- 支持`onChange`回调进行副作用处理
- 返回取消订阅函数

### 3.2 AppState定义

**文件**: `src/state/AppStateStore.ts`

```typescript
type AppState = {
  // 核心配置
  settings: SettingsJson
  verbose: boolean
  mainLoopModel: string
  
  // 任务管理
  tasks: Record<string, TaskState>
  agentNameRegistry: Record<string, string>
  foregroundedTaskId: string | null
  
  // MCP集成
  mcp: {
    clients: MCPClientState[]
    tools: MCPTool[]
    commands: MCPCommand[]
  }
  
  // 权限系统
  toolPermissionContext: ToolPermissionContext
  
  // 远程连接
  remoteConnectionStatus: RemoteConnectionStatus
  
  // 插件系统
  plugins: {
    enabled: Plugin[]
    disabled: Plugin[]
    errors: Record<string, Error>
  }
  
  // ... 60+ 状态字段
}
```

### 3.3 React集成

**文件**: `src/state/AppState.tsx`

```typescript
// 核心 Hooks
function useAppState<T>(selector: (state: AppState) => T): T
function useSetAppState(): (updater: (prev: AppState) => AppState) => void
function useAppStateStore(): Store<AppState>
```

**优化策略**:
- 使用`useSyncExternalStore`实现外部状态同步
- 选择器模式避免不必要的渲染
- React Compiler优化（`_c`运行时缓存）

### 3.4 状态变更处理

**文件**: `src/state/onChangeAppState.ts`

```
状态变更副作用:
┌─────────────────────────────────────────┐
│  权限模式同步到CCR/SDK                   │
│  mainLoopModel 持久化                    │
│  expandedView 视图状态持久化             │
│  verbose 日志级别持久化                  │
│  settings 变更清除认证缓存               │
└─────────────────────────────────────────┘
```

## 四、Schema定义层

### 4.1 Hook Schema

**文件**: `src/schemas/hooks.ts`

```typescript
type Hook =
  | BashCommandHook
  | PromptHook
  | HttpHook
  | AgentHook

type BashCommandHook = {
  type: 'BashCommand'
  command: string
  timeout?: number
  match?: string  // 条件过滤
}
```

**特性**:
- 条件过滤机制通过`if`字段支持权限规则语法
- `lazySchema`模式避免循环依赖
- `discriminatedUnion`确保类型安全

## 五、配置迁移机制

### 5.1 迁移文件结构

**目录**: `src/migrations/`

```
migrations/
├── migrateAutoUpdatesToSettings.ts
├── migrateBypassPermissionsAcceptedToSettings.ts
├── migrateFennecToOpus.ts          # 模型别名迁移
├── migrateSonnet45ToSonnet46.ts
└── ...
```

### 5.2 迁移设计原则

- **幂等性**: 重复执行不产生副作用
- **仅修改userSettings**: 不触碰其他配置源
- **原子写入**: 使用`updateSettingsForSource`

## 六、上下文管理

### 6.1 Mailbox模式

**文件**: `src/context/mailbox.tsx`

```typescript
function useMailbox(): Mailbox {
  return {
    send: (message) => void
    receive: () => Promise<Message>
    subscribe: (handler) => () => void
  }
}
```

用于跨组件、跨任务的消息传递。

### 6.2 通知系统

**文件**: `src/context/notifications.tsx`

```typescript
type NotificationPriority = 'immediate' | 'high' | 'medium' | 'low'

type Notification = {
  key: string
  priority: NotificationPriority
  content: React.ReactNode
  timeout?: number
  onDismiss?: () => void
}
```

**特性**:
- 优先级队列
- 折叠合并（相同key）
- 失效链（新通知使旧通知失效）

### 6.3 统计收集

**文件**: `src/context/stats.tsx`

```typescript
type StatsStore = {
  increment(name: string, value?: number): void
  set(name: string, value: number): void
  observe(name: string, value: number): void
  add(name: string, value: string): void
  getAll(): Record<string, unknown>
}
```

使用水库抽样算法限制内存使用。

## 七、持久化内存目录

### 7.1 内存类型

**文件**: `src/memdir/memoryTypes.ts`

| 类型 | 范围 | 用途 |
|------|------|------|
| `user` | 始终私有 | 用户角色、偏好、知识 |
| `feedback` | 默认私有，可团队 | 用户指导（避免/保持的做法） |
| `project` | 偏向团队 | 项目上下文、目标、事件 |
| `reference` | 通常团队 | 外部系统指针 |

### 7.2 路径解析

**文件**: `src/memdir/paths.ts`

```
解析顺序:
1. CLAUDE_COWORK_MEMORY_PATH_OVERRIDE
2. autoMemoryDirectory 设置项
3. 默认路径: <configHome>/projects/<sanitized-git-root>/memory/
```

### 7.3 内存提示词构建

**文件**: `src/memdir/memdir.ts`

`buildMemoryLines()`函数构建内存系统提示词，包含：
- 内存类型说明
- 不应保存的内容
- 保存格式指南
- 访问时机说明

## 八、任务管理系统

### 8.1 任务类型

**文件**: `src/tasks/types.ts`

```typescript
type TaskState =
  | LocalShellTaskState
  | LocalAgentTaskState
  | RemoteAgentTaskState
  | InProcessTeammateTaskState
  | LocalWorkflowTaskState
  | MonitorMcpTaskState
  | DreamTaskState
```

### 8.2 任务停止机制

**文件**: `src/tasks/stopTask.ts`

```typescript
async function stopTask(taskId: string, context: TaskContext): Promise<TaskInfo> {
  // 1. 验证任务存在且运行中
  // 2. 调用任务类型的kill方法
  // 3. 对于Shell任务：抑制退出通知
  // 4. 发送SDK终止事件
  // 5. 返回任务信息
}
```

## 九、常量定义

### 9.1 系统提示词常量

**文件**: `src/constants/system.ts`

```typescript
const DEFAULT_PREFIX = "You are Claude Code, Anthropic's official CLI for Claude."
const AGENT_SDK_PREFIX = "You are a Claude agent, built on Anthropic's Claude Agent SDK."
```

### 9.2 工具常量

**文件**: `src/constants/tools.ts`

```typescript
// 异步代理允许的工具
const ASYNC_AGENT_ALLOWED_TOOLS = {
  Read, WebSearch, Grep, Glob, Bash, Edit, Write, ...
}

// 代理禁止的工具
const ALL_AGENT_DISALLOWED_TOOLS = {
  TaskOutput, ExitPlanMode, EnterPlanMode, Agent, ...
}
```

## 十、关键文件路径

| 功能 | 文件路径 |
|------|----------|
| Store实现 | `src/state/store.ts` |
| AppState定义 | `src/state/AppStateStore.ts` |
| React集成 | `src/state/AppState.tsx` |
| 状态变更处理 | `src/state/onChangeAppState.ts` |
| 配置加载 | `src/utils/config.ts` |
| Settings类型 | `src/utils/settings/types.ts` |
| Hook Schema | `src/schemas/hooks.ts` |
| 内存类型 | `src/memdir/memoryTypes.ts` |
| 任务类型 | `src/tasks/types.ts` |
| 系统常量 | `src/constants/system.ts` |