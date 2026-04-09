# Claude Code 服务层架构

## 一、系统概述

服务层是Claude Code与外部系统交互的核心模块，位于`src/services/`目录。提供API调用、MCP集成、OAuth认证、分析服务等功能。

## 二、服务模块概览

```
src/services/
├── api/              # Anthropic API客户端
├── mcp/              # Model Context Protocol
├── oauth/            # OAuth 2.0认证
├── lsp/              # Language Server Protocol
├── analytics/        # GrowthBook分析
├── compact/          # 对话压缩
├── policyLimits/     # 组织策略限制
├── plugins/          # 插件系统
├── tools/            # 工具执行
├── SessionMemory/    # 会话内存
├── rateLimitMocking/ # 速率限制模拟
├── claudeAiLimits/   # Claude.ai限制
└── ...
```

## 三、API服务 (api/)

### 3.1 核心模块

| 文件 | 功能 |
|------|------|
| `claude.ts` | 核心API调用封装 |
| `client.ts` | Anthropic SDK客户端管理 |
| `withRetry.ts` | 重试逻辑 |
| `errors.ts` | API错误处理 |
| `bootstrap.ts` | 启动引导 |

### 3.2 客户端管理

**文件**: `src/services/api/client.ts`

```typescript
// 支持多种部署
type DeploymentType =
  | '1p'           // Anthropic官方
  | 'bedrock'      // AWS Bedrock
  | 'vertex'       // GCP Vertex
  | 'foundry'      // Anthropic Foundry

export async function getAnthropicClient(
  deployment: DeploymentType,
  context: ClientContext,
): Promise<Anthropic>
```

### 3.3 错误处理

**文件**: `src/services/api/errors.ts`

```typescript
// 错误类型判断
export function isPromptTooLongMessage(msg: AssistantMessage): boolean
export function isMediaSizeError(raw: string): boolean
export function parsePromptTooLongTokenCounts(rawMessage: string): { actualTokens, limitTokens }
```

## 四、MCP服务 (mcp/)

### 4.1 核心模块

| 文件 | 功能 |
|------|------|
| `MCPConnectionManager.ts` | 连接管理器 |
| `client.ts` | MCP客户端实现 |
| `transport.ts` | 传输层抽象 |
| `utils.ts` | 工具函数 |

### 4.2 连接管理

```typescript
type MCPClientState =
  | { type: 'pending' }
  | { type: 'connected'; client: MCPClient }
  | { type: 'error'; error: Error }
  | { type: 'disabled' }
```

### 4.3 传输协议

- **Stdio传输**: 通过标准输入/输出与进程通信
- **SSE传输**: Server-Sent Events
- **WebSocket传输**: 全双工通信

### 4.4 工具发现

```typescript
// 动态工具发现
export async function discoverMCPTools(client: MCPClient): Promise<MCPTool[]>

// 资源列表
export async function listMCPResources(client: MCPClient): Promise<Resource[]>
```

## 五、OAuth服务 (oauth/)

### 5.1 认证流程

```
OAuth认证流程:
┌───────────────┐
│  启动本地服务器 │
│  (随机端口)    │
└───────┬───────┘
        │
        ▼
┌───────────────┐
│  打开浏览器    │
│  OAuth授权页面 │
└───────┬───────┘
        │
        ▼
┌───────────────┐
│  用户授权     │
│  重定向回本地  │
└───────┬───────┘
        │
        ▼
┌───────────────┐
│  交换code获取 │
│  access_token │
└───────┬───────┘
        │
        ▼
┌───────────────┐
│  存储token    │
│  Keychain/文件│
└───────────────┘
```

### 5.2 端口选择

**文件**: `src/services/mcp/oauthPort.ts`

```typescript
// Windows使用39152-49151范围（避免保留端口）
// 其他平台使用49152-65535（临时端口范围）
const REDIRECT_PORT_RANGE =
  getPlatform() === 'windows'
    ? { min: 39152, max: 49151 }
    : { min: 49152, max: 65535 }
```

## 六、分析服务 (analytics/)

### 6.1 GrowthBook集成

**文件**: `src/services/analytics/growthbook.ts`

```typescript
export async function initializeGrowthBook(): Promise<void>
export function checkGate_CACHED_MAY_BE_STALE(gateName: string): boolean
export function getFeatureValue_CACHED_MAY_BE_STALE<T>(key: string, defaultValue: T): T
```

### 6.2 事件日志

**文件**: `src/services/analytics/index.ts`

```typescript
export function logEvent(
  eventName: string,
  metadata?: Record<string, unknown>,
): void
```

### 6.3 数据汇

**文件**: `src/services/analytics/sink.ts`

```typescript
export function initializeAnalyticsSink(): void {
  attachAnalyticsSink({
    logEvent: logEventImpl,
    logEventAsync: logEventAsyncImpl,
  })
}
```

事件路由到：
- Datadog（通用访问）
- 1P事件日志（包含PII标记字段）

## 七、对话压缩服务 (compact/)

### 7.1 压缩类型

| 类型 | 触发条件 | 说明 |
|------|----------|------|
| AutoCompact | Token使用超过阈值 | 自动触发 |
| MicroCompact | 对话轮次增加 | 小型增量压缩 |
| ContextCollapse | 上下文溢出 | 投影视图压缩 |

### 7.2 压缩流程

**文件**: `src/services/compact/compact.ts`

```typescript
export async function compactConversation(
  messages: Message[],
  context: CompactContext,
): Promise<CompactResult>
```

### 7.3 自动压缩配置

**文件**: `src/services/compact/autoCompact.ts`

```typescript
export function getAutoCompactThreshold(model: string): number {
  const effectiveContextWindow = getEffectiveContextWindowSize(model)
  return effectiveContextWindow - AUTOCOMPACT_BUFFER_TOKENS
}

// AUTOCOMPACT_BUFFER_TOKENS = 13,000
```

## 八、策略限制服务 (policyLimits/)

### 8.1 策略类型

```typescript
type PolicyLimit = {
  allow_remote_control: boolean
  allow_auto_mode: boolean
  max_session_cost: number | null
  max_session_duration_minutes: number | null
  allowed_models: string[] | null
}
```

### 8.2 限制检查

**文件**: `src/services/policyLimits/index.ts`

```typescript
export async function fetchAndLoadPolicyLimits(): Promise<void>
export function isPolicyAllowed(policy: keyof PolicyLimit): boolean
export function waitForPolicyLimitsToLoad(): Promise<void>
```

### 8.3 后台轮询

```typescript
export function startBackgroundPolling(): void {
  pollingIntervalId = setInterval(() => {
    void pollPolicyLimits()
  }, POLLING_INTERVAL_MS)  // 5分钟
}
```

## 九、LSP服务 (lsp/)

### 9.1 语言服务器管理

**文件**: `src/services/lsp/lspManager.ts`

```typescript
export class LSPManager {
  async startServer(languageId: string): Promise<LSPClient>
  async getDiagnostics(filePath: string): Promise<Diagnostic[]>
  async getCompletions(filePath: string, position: Position): Promise<CompletionItem[]>
}
```

### 9.2 支持的语言

通过MCP服务器的`codeAnalysis`功能间接支持：
- TypeScript/JavaScript
- Python
- Go
- Rust
- 等

## 十、插件服务 (plugins/)

### 10.1 插件加载

**文件**: `src/services/plugins/pluginLoader.ts`

```typescript
export async function loadPlugin(
  pluginPath: string,
  context: PluginContext,
): Promise<Plugin>
```

### 10.2 插件标识

```typescript
type PluginIdentifier = {
  marketplace: string    // 'anthropic' | 'custom'
  name: string
  version: string
}
```

## 十一、会话内存服务 (SessionMemory/)

### 11.1 内存存储

**文件**: `src/services/SessionMemory/sessionMemory.ts`

```typescript
export function initSessionMemory(): void
export function recordMemory(key: string, value: unknown): void
export function getMemory(key: string): unknown
```

### 11.2 内存压缩

**文件**: `src/services/compact/sessionMemoryCompact.ts`

```typescript
export async function trySessionMemoryCompaction(
  messages: Message[],
): Promise<boolean>
```

## 十二、关键文件路径

| 服务 | 文件路径 |
|------|----------|
| API调用 | `src/services/api/claude.ts` |
| API客户端 | `src/services/api/client.ts` |
| 重试逻辑 | `src/services/api/withRetry.ts` |
| MCP管理 | `src/services/mcp/MCPConnectionManager.ts` |
| MCP客户端 | `src/services/mcp/client.ts` |
| GrowthBook | `src/services/analytics/growthbook.ts` |
| 事件日志 | `src/services/analytics/index.ts` |
| 对话压缩 | `src/services/compact/compact.ts` |
| 自动压缩 | `src/services/compact/autoCompact.ts` |
| 策略限制 | `src/services/policyLimits/index.ts` |
| OAuth | `src/services/oauth/` |
| 插件 | `src/services/plugins/` |