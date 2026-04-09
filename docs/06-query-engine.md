# Claude Code QueryEngine核心架构

## 一、系统概述

QueryEngine是Claude Code的核心引擎，负责LLM API调用、工具执行循环、上下文管理等关键功能。

### 核心文件
- `src/QueryEngine.ts` - 查询引擎主类
- `src/query.ts` - 查询管道实现
- `src/services/api/claude.ts` - API调用封装

## 二、QueryEngine类

### 2.1 类结构

```typescript
export class QueryEngine {
  private mutableMessages: Message[] = []
  private totalUsage: Usage = {}
  private abortController: AbortController
  private permissionDenials: PermissionDenialState
  
  constructor(private config: QueryEngineConfig) {}
  
  async *submitMessage(prompt: string | Message, options): AsyncGenerator<SDKMessage>
  interrupt(): void
  getMessages(): readonly Message[]
  getUsage(): Usage
  setModel(model: string): void
}
```

### 2.2 核心配置

```typescript
type QueryEngineConfig = {
  cwd: string
  tools: Tool[]
  mcpClients: MCPClient[]
  systemPrompt?: string
  thinkingConfig: ThinkingConfig
  mainLoopModel: string
  permissionMode: PermissionMode
  permissionToolConfirmQueue: ToolUseConfirm[]
  // ...
}
```

## 三、查询管道 (query.ts)

### 3.1 主循环状态机

```typescript
type LoopState = {
  messages: Message[]
  toolUseContext: ToolUseContext
  autoCompactTracking: AutoCompactTrackingState | undefined
  maxOutputTokensRecoveryCount: number
  hasAttemptedReactiveCompact: boolean
  pendingToolUseSummary: Promise<ToolUseSummaryMessage | null> | undefined
  stopHookActive: boolean | undefined
  turnCount: number
  transition: ContinueReason | undefined
}
```

### 3.2 主循环流程

```
queryLoop(state) {
  while (true) {
    // 1. 状态解构
    let { messages, toolUseContext, ... } = state
    
    // 2. 消息预处理
    messagesForQuery = getMessagesAfterCompactBoundary(messages)
    
    // 3. 上下文管理
    if (feature('HISTORY_SNIP')) snipCompactIfNeeded(...)
    await microcompact(...)
    await autocompactIfNeeded(...)
    
    // 4. API调用 (流式)
    for await (const message of callModel(...)) {
      // 累积 assistantMessages
      // StreamingToolExecutor 并行执行工具
    }
    
    // 5. 终止检查
    if (!needsFollowUp) {
      await handleStopHooks()
      return { reason: 'completed' }
    }
    
    // 6. 工具结果收集
    toolResults = collectToolResults(...)
    
    // 7. 状态更新并继续
    state = { messages: [...messagesForQuery, ...assistantMessages, ...toolResults], ... }
    continue
  }
}
```

## 四、API调用层

### 4.1 调用链路

```
query.ts:callModel()
    └── claude.ts:queryModelWithStreaming()
        └── withStreamingVCR() // 录制包装
            └── queryModel()
                ├── buildSystemPromptBlocks()
                ├── normalizeMessagesForAPI()
                ├── toolToAPISchema()
                ├── paramsFromContext()
                └── withRetry()
                    └── anthropic.beta.messages.create() // SDK流式调用
```

### 4.2 请求参数构建

```typescript
{
  model: normalizeModelString(model),
  messages: addCacheBreakpoints(messages),
  system: systemPromptBlocks,
  tools: toolSchemas,
  tool_choice: toolChoice,
  max_tokens: maxOutputTokens,
  thinking: thinkingConfig,  // { type: 'adaptive' } | { budget_tokens: N }
  betas: betaHeaders,        // Beta功能开关
  output_config: { effort, task_budget },
  speed: 'fast' | undefined, // Fast Mode
  context_management: contextCollapse,
}
```

### 4.3 Beta Headers管理

使用latch机制确保会话内Beta Headers稳定：

```typescript
let fastModeHeaderLatched = getFastModeHeaderLatched() === true
let cacheEditingHeaderLatched = getCacheEditingHeaderLatched() === true
let afkHeaderLatched = getAfkModeHeaderLatched() === true
```

**关键Beta Headers**:
| Header | 功能 |
|--------|------|
| `FAST_MODE` | 快速模式 |
| `REDACT_THINKING` | Thinking压缩 |
| `CONTEXT_MANAGEMENT` | 上下文管理 |
| `TASK_BUDGETS` | 任务预算 |
| `EFFORT` | Effort参数 |

## 五、流式响应处理

### 5.1 事件类型处理

```typescript
for await (const part of stream) {
  switch (part.type) {
    case 'message_start':      // 初始化 partialMessage, usage
    case 'content_block_start': // 创建 contentBlocks[index]
    case 'content_block_delta': // 累积内容
    case 'content_block_stop':  // yield AssistantMessage
    case 'message_delta':       // 最终 usage, stop_reason
    case 'message_stop':        // 流结束
  }
}
```

### 5.2 内容块类型

| 类型 | Delta类型 | 处理 |
|------|-----------|------|
| text | text_delta | 累积到 text |
| thinking | thinking_delta | 累积到 thinking |
| thinking | signature_delta | 设置 signature |
| tool_use | input_json_delta | 累积 JSON 输入 |

### 5.3 StreamingToolExecutor

**并发控制**:
- `concurrency-safe`工具可并行执行
- 非`concurrency-safe`工具需独占执行
- 结果按接收顺序输出

```typescript
canExecuteTool(isConcurrencySafe: boolean): boolean {
  const executing = this.tools.filter(t => t.status === 'executing')
  return executing.length === 0 ||
    (isConcurrencySafe && executing.every(t => t.isConcurrencySafe))
}
```

## 六、Thinking模式

### 6.1 配置类型

```typescript
type ThinkingConfig =
  | { type: 'adaptive' }  // 自适应，无预算限制
  | { type: 'enabled'; budgetTokens: number }  // 固定预算
  | { type: 'disabled' }
```

### 6.2 模型支持判断

- **1P/Foundry**: 所有Claude 4+模型支持Thinking
- **3P**: 仅Opus 4+和Sonnet 4+支持Thinking
- **自适应Thinking**: 仅Opus 4-6和Sonnet 4-6支持

### 6.3 处理规则

1. Thinking/redacted_thinking消息必须属于`max_thinking_length > 0`的请求
2. Thinking块不能是消息中最后一个块
3. Thinking块必须在整个assistant trajectory期间保留

## 七、重试逻辑

### 7.1 withRetry框架

```typescript
export async function* withRetry<T>(
  getClient: () => Promise<Anthropic>,
  operation: (client, attempt, context) => Promise<T>,
  options: RetryOptions,
): AsyncGenerator<SystemAPIErrorMessage, T>
```

### 7.2 重试策略

| 错误类型 | 处理策略 |
|---------|---------|
| 401/403 OAuth | 刷新token, 重建client |
| 429 Rate Limit | Fast Mode: 等待retry-after或进入cooldown |
| 529 Overloaded | 短延迟重试(最多3次) |
| ECONNRESET/EPIPE | 禁用keep-alive, 重建连接 |

### 7.3 Fallback模型切换

```typescript
catch (innerError) {
  if (innerError instanceof FallbackTriggeredError && fallbackModel) {
    currentModel = fallbackModel
    messagesForQuery = stripSignatureBlocks(messagesForQuery)
    // 重试请求
  }
}
```

### 7.4 Prompt-Too-Long恢复

```
Prompt-Too-Long恢复流程:
1. 尝试 context collapse drain
   └── 成功 → collapse_drain_retry
2. 尝试 reactive compact
   └── 成功 → reactive_compact_retry
3. 无法恢复
   └── 返回 { reason: 'prompt_too_long' }
```

## 八、上下文管理

### 8.1 压缩策略层次

```
消息处理顺序 (优先级从高到低):
1. Snip Compact (HISTORY_SNIP feature)
   └── 快速裁剪历史
2. Microcompact
   └── 小型增量压缩
3. Context Collapse
   └── 投影视图压缩
4. Autocompact
   └── 完整摘要压缩
```

### 8.2 Compact Boundary消息

```typescript
type CompactBoundaryMessage = {
  type: 'system'
  subtype: 'compact_boundary'
  compactMetadata: {
    preCompactTokenCount: number
    postCompactTokenCount: number
    summaryMessages: Message[]
  }
}
```

### 8.3 Task Budget跟踪

跨压缩边界追踪剩余token预算。

## 九、Token计数与成本追踪

### 9.1 Usage结构

```typescript
type Usage = {
  input_tokens: number
  output_tokens: number
  cache_read_input_tokens?: number
  cache_creation_input_tokens?: number
  server_tool_use?: { web_search_requests?: number }
}
```

### 9.2 成本计算流程

```
queryModel()
    ├── message_start: updateUsage(usage, part.message.usage)
    ├── message_delta: updateUsage(usage, part.usage)
    └── message_stop: 
          └── addToTotalSessionCost(usage)
              └── calculateUSDCost(usage)
```

## 十、关键文件路径

| 功能 | 文件路径 |
|------|----------|
| QueryEngine类 | `src/QueryEngine.ts` |
| 查询管道 | `src/query.ts` |
| API调用 | `src/services/api/claude.ts` |
| 重试逻辑 | `src/services/api/withRetry.ts` |
| 流式工具执行 | `src/services/tools/StreamingToolExecutor.ts` |
| 成本追踪 | `src/cost-tracker.ts` |
| Thinking配置 | `src/utils/thinking.ts` |