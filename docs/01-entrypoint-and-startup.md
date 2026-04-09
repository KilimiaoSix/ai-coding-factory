# Claude Code 入口点和启动流程架构

## 一、概述

Claude Code 采用多层启动架构，通过快速路径（fast-path）处理常见命令，延迟加载完整CLI。核心设计目标是**最小化启动时间**，特别是 `--version` 等简单命令应实现零模块加载。

## 二、入口点文件

### 2.1 主入口：src/entrypoints/cli.tsx

这是CLI的引导入口，负责：
- 处理快速路径（无需加载完整CLI）
- 环境变量预处理
- 特性标志门控的分支路径

### 2.2 主程序：src/main.tsx

完整的CLI实现，包含：
- Commander.js 命令行解析
- Ink 渲染器初始化
- 并行预取优化

## 三、快速路径处理

### 3.1 --version 零模块路径

```typescript
// cli.tsx:36-42
if (args.length === 1 && (args[0] === '--version' || args[0] === '-v' || args[0] === '-V')) {
  // MACRO.VERSION 在构建时内联
  console.log(`${MACRO.VERSION} (Claude Code)`)
  return
}
```

这是唯一真正零模块加载的路径，`MACRO.VERSION` 在构建时被替换为字面量。

### 3.2 特性标志门控路径

```typescript
// 通过 feature() 实现编译时死代码消除
if (feature('BRIDGE_MODE') && args[0] === 'remote-control') {
  // Bridge 路径 - 仅在 feature('BRIDGE_MODE')=true 时编译
}

if (feature('DAEMON') && args[0] === 'daemon') {
  // Daemon 路径
}
```

**特性标志列表**:
| 标志 | 路径 | 说明 |
|------|------|------|
| `BRIDGE_MODE` | remote-control | 远程控制模式 |
| `DAEMON` | daemon, --daemon-worker | 后台守护进程 |
| `VOICE_MODE` | voice | 语音输入 |
| `DUMP_SYSTEM_PROMPT` | --dump-system-prompt | 导出系统提示 |
| `CHICAGO_MCP` | --computer-use-mcp | Computer Use MCP |
| `TEMPLATES` | new, list, reply | 模板任务 |
| `BYOC_ENVIRONMENT_RUNNER` | environment-runner | BYOC运行器 |
| `SELF_HOSTED_RUNNER` | self-hosted-runner | 自托管运行器 |

### 3.3 Chrome 集成路径

```typescript
// 不依赖 feature() 的内置路径
if (process.argv[2] === '--claude-in-chrome-mcp') {
  await runClaudeInChromeMcpServer()
  return
}

if (process.argv[2] === '--chrome-native-host') {
  await runChromeNativeHost()
  return
}
```

## 四、完整CLI启动流程

### 4.1 初始化阶段 (main.tsx)

```
启动流程图:
┌─────────────────────────────────────────┐
│  并行预取 (Side Effects)                 │
│  ├── startMdmRawRead()                  │
│  ├── startKeychainPrefetch()            │
│  └── (其他并行初始化)                     │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│  enableConfigs()                        │
│  - 加载 settings.json                   │
│  - 应用环境变量                          │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│  Commander.js CLI 解析                  │
│  - 注册命令和选项                        │
│  - 解析 process.argv                    │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│  setup() 初始化                         │
│  - 工作目录设置                          │
│  - Hook 快照捕获                        │
│  - Worktree 处理                        │
│  - 终端备份恢复                          │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│  showSetupDialog() / TrustDialog        │
│  - 信任验证                             │
│  - GrowthBook 初始化                    │
│  - API Key 审批                         │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│  Ink 渲染器启动                         │
│  - 创建 Root 组件                       │
│  - 渲染终端UI                           │
└─────────────────────────────────────────┘
```

### 4.2 并行预取机制

**MDM 设置预取**:
```typescript
// 在模块评估阶段启动
startMdmRawRead()  // 异步读取企业MDM配置
```

**Keychain 预取**:
```typescript
// macOS Keychain 凭证预加载
startKeychainPrefetch()
```

**API 预连接**:
```typescript
// apiPreconnect.ts
export function preconnectAnthropicApi(): void {
  // 发送 HEAD 请求预热 TCP+TLS 连接
  // 与启动工作并行执行，减少首次API调用延迟
  void fetch(baseUrl, { method: 'HEAD', signal: AbortSignal.timeout(10_000) })
}
```

### 4.3 setup() 核心流程

**文件**: `src/setup.ts`

```typescript
export async function setup(
  cwd: string,
  permissionMode: PermissionMode,
  allowDangerouslySkipPermissions: boolean,
  worktreeEnabled: boolean,
  worktreeName: string | undefined,
  tmuxEnabled: boolean,
  customSessionId?: string | null,
  worktreePRNumber?: number,
  messagingSocketPath?: string,
): Promise<void>
```

**关键步骤**:

1. **Node.js 版本检查**: 要求 >= 18
2. **UDS 消息服务器启动**: 仅非 bare 模式
3. **Teammate 快照捕获**: Swarm 模式支持
4. **终端备份恢复**: iTerm2 / Terminal.app
5. **工作目录设置**: `setCwd(cwd)`
6. **Hook 快照捕获**: `captureHooksConfigSnapshot()`
7. **Worktree 创建**: 可选的隔离工作树
8. **后台任务初始化**: Session Memory, Context Collapse

## 五、信任验证流程

### 5.1 TrustDialog

在首次运行或目录变更时显示：

```
TrustDialog 流程:
┌──────────────────────────────────────┐
│  检测到新目录                         │
│  "Do you trust this directory?"      │
│                                      │
│  [Yes, proceed] [No, exit]           │
└──────────────────────────────────────┘
          │
          ▼ (用户确认)
┌──────────────────────────────────────┐
│  setSessionTrustAccepted(true)       │
│  resetGrowthBook()                   │
│  initializeGrowthBook()              │
│  getSystemContext()                  │
│  handleMcpjsonServerApprovals()      │
└──────────────────────────────────────┘
```

### 5.2 安全检查

- Claude.md 外部包含警告
- API Key 环境变量审批
- Bypass Permissions 模式确认

## 六、Commander.js CLI 配置

### 6.1 命令结构

```typescript
const program = new Command()

program
  .name('claude')
  .version(MACRO.VERSION)
  .option('-p, --print', 'Print mode (non-interactive)')
  .option('--permission-mode <mode>', 'Set permission mode')
  .option('--model <model>', 'Specify model')
  .option('-c, --context <dirs...>', 'Add context directories')
  .option('--resume [sessionId]', 'Resume previous session')
  // ... 更多选项

// 子命令
program.command('config').description('Manage configuration')
program.command('mcp').description('Manage MCP servers')
program.command('update').description('Update CLI')
```

### 6.2 权限模式映射

| 模式 | 说明 |
|------|------|
| `default` | 默认，敏感操作需确认 |
| `plan` | 计划模式，暂停执行 |
| `acceptEdits` | 自动接受编辑 |
| `bypassPermissions` | 绕过权限检查 |
| `dontAsk` | 自动拒绝 |

## 七、Ink 渲染器初始化

### 7.1 渲染上下文

```typescript
// main.tsx
const { renderOptions, ink } = getRenderContext(exitOnCtrlC)

const { unmount, clear, waitUntilExit } = render(
  <Root {...props} />,
  renderOptions
)
```

### 7.2 Root 组件结构

```tsx
<Root>
  <ThemeProvider>
    <AppStateProvider>
      <MessagesProvider>
        <App />
      </MessagesProvider>
    </AppStateProvider>
  </ThemeProvider>
</Root>
```

## 八、启动优化策略

### 8.1 延迟加载

```typescript
// 动态导入减少初始包大小
const { QueryEngine } = await import('./QueryEngine.js')
const { getCommands } = await import('./commands.js')
```

### 8.2 预取与计算重叠

```
时间线:
[预取MDM]────────────────┐
[预取Keychain]───────────┤
[用户输入等待]────────────┼────[API预连接]
                         │
                         ▼
                   [首次API调用] (连接已预热)
```

### 8.3 模块分割

- 核心 CLI 入口最小化
- 大型依赖（OpenTelemetry、gRPC）延迟加载
- Feature-gated 代码完全消除

## 九、关键文件路径

| 文件 | 职责 |
|------|------|
| `src/entrypoints/cli.tsx` | 引导入口、快速路径 |
| `src/main.tsx` | 完整CLI、Commander配置 |
| `src/setup.ts` | 环境初始化 |
| `src/utils/apiPreconnect.ts` | API预连接 |
| `src/utils/startupProfiler.ts` | 启动性能分析 |