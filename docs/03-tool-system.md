# Claude Code 工具系统架构

## 一、系统概述

Claude Code的工具系统是一个模块化的代理工具框架，定义了Claude可以执行的所有操作。每个工具都是自包含的模块，包含输入schema、权限模型和执行逻辑。

## 二、核心类型定义

### 2.1 Tool接口

**文件**: `src/Tool.ts`

```typescript
export interface Tool<Input extends z.ZodType = z.ZodType, Output = unknown> {
  name: string
  description: string
  inputSchema: Input
  
  // 权限相关
  isConcurrencySafe?: boolean
  requiresPermission?: boolean
  checkPermissions?: (input: z.infer<Input>, context: ToolUseContext) => PermissionResult
  
  // 执行方法
  call: (input: z.infer<Input>, context: ToolUseContext) => Promise<ToolResult<Output>>
  
  // 可选方法
  progress?: AsyncGenerator<ToolProgress<Output>>
  renderResult?: (result: Output) => React.ReactNode
}
```

### 2.2 ToolResult类型

```typescript
export type ToolResult<Output = unknown> =
  | { type: 'success'; data: Output }
  | { type: 'error'; error: string }
  | { type: 'permission_denied'; message: string }
```

### 2.3 ToolUseContext

```typescript
export type ToolUseContext = {
  abortController: AbortController
  permissionMode: PermissionMode
  readFileState: FileStateCache
  toolPermissionContext: ToolPermissionContext
  getAppState: () => AppState
  setAppState: (updater: (prev: AppState) => AppState) => void
  // ...
}
```

## 三、工具注册机制

### 3.1 tools.ts注册

**文件**: `src/tools.ts`

```typescript
export function getBaseTools(): Tool[] {
  return [
    BashTool,
    FileReadTool,
    FileWriteTool,
    FileEditTool,
    GlobTool,
    GrepTool,
    WebFetchTool,
    WebSearchTool,
    AgentTool,
    SkillTool,
    MCPTool,
    // ... ~40个工具
  ]
}
```

### 3.2 工具分类

| 类别 | 工具 | 说明 |
|------|------|------|
| **文件操作** | FileReadTool, FileWriteTool, FileEditTool | 文件读写编辑 |
| **搜索** | GlobTool, GrepTool | 文件和内容搜索 |
| **Shell** | BashTool, PowerShellTool | 命令执行 |
| **网络** | WebFetchTool, WebSearchTool | 网络访问 |
| **代理** | AgentTool, SkillTool, MCPTool | 子代理调用 |
| **计划** | EnterPlanModeTool, ExitPlanModeTool | 计划模式 |
| **工作树** | EnterWorktreeTool, ExitWorktreeTool | Git工作树 |
| **任务** | TaskCreateTool, TaskUpdateTool, TaskListTool | 任务管理 |
| **调度** | CronCreateTool, RemoteTriggerTool | 定时任务 |

## 四、核心工具实现

### 4.1 BashTool

**文件**: `src/tools/BashTool/BashTool.ts`

**特性**:
- 支持后台执行 (`--bg` / `--background`)
- 沙箱模式支持
- 命令分类器预测
- 输出重定向处理

**输入Schema**:
```typescript
const BashToolInputSchema = z.object({
  command: z.string().describe('The bash command to execute'),
  timeout: z.number().optional().describe('Timeout in milliseconds'),
  description: z.string().optional().describe('Description of the command'),
  background: z.boolean().optional(),
})
```

### 4.2 FileReadTool

**文件**: `src/tools/FileReadTool/FileReadTool.ts`

**特性**:
- 支持多种文件类型（文本、图片、PDF、Jupyter Notebook）
- 分页读取大文件
- 编码检测
- 图片尺寸限制处理

**输入Schema**:
```typescript
const FileReadToolInputSchema = z.object({
  file_path: z.string().describe('The absolute path to the file'),
  limit: z.number().optional().describe('Number of lines to read'),
  offset: z.number().optional().describe('Starting line number'),
})
```

### 4.3 FileEditTool

**文件**: `src/tools/FileEditTool/FileEditTool.ts`

**特性**:
- 精确字符串替换
- 支持多位置替换
- 替换前读取验证
- 沙箱路径限制

**输入Schema**:
```typescript
const FileEditToolInputSchema = z.object({
  file_path: z.string(),
  old_string: z.string().describe('The text to replace'),
  new_string: z.string().describe('The replacement text'),
  replace_all: z.boolean().optional().describe('Replace all occurrences'),
})
```

### 4.4 AgentTool

**文件**: `src/tools/AgentTool/AgentTool.ts`

**特性**:
- 子代理创建
- 支持多种代理类型（general-purpose, Explore, Plan等）
- 超时管理
- 进度流式返回

**代理类型**:
| 类型 | 用途 |
|------|------|
| `general-purpose` | 通用任务 |
| `Explore` | 代码库探索 |
| `Plan` | 实现计划 |
| `code-reviewer` | 代码审查 |

### 4.5 MCPTool

**文件**: `src/tools/MCPTool/MCPTool.ts`

**特性**:
- 调用MCP服务器工具
- 动态工具发现
- 错误处理和重连

## 五、Input Schema设计

### 5.1 Zod Schema模式

```typescript
// 基础模式
const inputSchema = z.object({
  path: z.string().describe('The file path'),
  content: z.string().describe('The content to write'),
})

// 条件字段
const conditionalSchema = z.object({
  action: z.enum(['read', 'write']),
  // 条件性字段
}).and(z.object({
  content: z.string().optional(),
}).refine(
  (data) => data.action !== 'write' || data.content !== undefined,
  { message: 'content is required for write action' }
))
```

### 5.2 语义类型

**文件**: `src/utils/semanticNumber.ts`, `src/utils/semanticBoolean.ts`

```typescript
// 数字接受字符串形式
semanticNumber(z.number().optional())
// "30" → 30, "abc" → 验证错误

// 布尔接受字符串形式
semanticBoolean(z.boolean().default(false))
// "true" → true, "false" → false
```

## 六、权限模型

### 6.1 权限检查流程

```
工具权限检查:
┌─────────────────────────────────────────┐
│ 1. 全局拒绝规则检查                      │
│ 2. 全局询问规则检查                      │
│ 3. 工具特定权限检查 (checkPermissions)   │
│ 4. 安全路径检查 (.git/, .claude/)        │
│ 5. 模式检查 (bypass, dontAsk, auto)     │
│ 6. 白名单规则检查                        │
└─────────────────────────────────────────┘
```

### 6.2 工具级权限检查

```typescript
checkPermissions(input, context): PermissionResult {
  // 1. 检查路径是否在允许的目录内
  if (!isPathAllowed(input.file_path, context.allowedDirectories)) {
    return { behavior: 'deny', reason: 'Path not allowed' }
  }
  
  // 2. 检查安全敏感路径
  if (isSensitivePath(input.file_path)) {
    return { behavior: 'ask', reason: 'Sensitive path requires approval' }
  }
  
  // 3. 返回允许
  return { behavior: 'allow' }
}
```

### 6.3 Concurrency Safety

```typescript
// 并发安全工具可以同时执行
isConcurrencySafe: true

// 非并发安全工具需要独占执行
isConcurrencySafe: false  // 默认值
```

## 七、工具执行流程

### 7.1 执行入口

**文件**: `src/services/tools/toolExecution.ts`

```typescript
export async function executeTool(
  tool: Tool,
  input: unknown,
  toolUseContext: ToolUseContext,
  assistantMessage: AssistantMessage,
  toolUseID: string,
): Promise<ToolResult>
```

### 7.2 执行流程

```
executeTool():
1. 验证输入 (inputSchema.parse)
2. 检查权限 (hasPermissionsToUseTool)
3. 执行工具 (tool.call)
4. 处理结果
   - 成功: { type: 'success', data }
   - 错误: { type: 'error', error }
5. 记录遥测
6. 返回结果
```

### 7.3 流式工具执行

**文件**: `src/services/tools/StreamingToolExecutor.ts`

```typescript
class StreamingToolExecutor {
  async execute(
    toolUseBlocks: ToolUseBlock[],
    context: ToolUseContext,
  ): AsyncGenerator<ToolResultMessage>
  
  private canExecuteTool(isConcurrencySafe: boolean): boolean {
    const executing = this.tools.filter(t => t.status === 'executing')
    return executing.length === 0 ||
      (isConcurrencySafe && executing.every(t => t.isConcurrencySafe))
  }
}
```

## 八、工具UI渲染

### 8.1 工具专属UI组件

**目录**: `src/tools/*/UI.tsx`

```typescript
// BashTool/UI.tsx
export function BashToolUI({ input, result }: { input: BashInput; result: BashResult }) {
  return (
    <Box flexDirection="column">
      <Text color="cyan">{input.command}</Text>
      <ScrollBox>{result.stdout}</ScrollBox>
    </Box>
  )
}
```

### 8.2 渲染映射

```typescript
function getToolUIComponent(toolName: string): React.ComponentType {
  switch (toolName) {
    case 'Bash': return BashToolUI
    case 'Read': return FileReadToolUI
    case 'Edit': return FileEditToolUI
    default: return DefaultToolUI
  }
}
```

## 九、新增工具指南

### 9.1 创建工具文件

```typescript
// src/tools/MyTool/MyTool.ts
export const MyTool: Tool = {
  name: 'my_tool',
  description: 'Description of what this tool does',
  inputSchema: z.object({
    param: z.string().describe('Parameter description'),
  }),
  
  isConcurrencySafe: true,
  
  checkPermissions(input, context) {
    return { behavior: 'allow' }
  },
  
  async call(input, context) {
    // 实现逻辑
    return { type: 'success', data: result }
  },
}
```

### 9.2 注册工具

在`src/tools.ts`中添加：

```typescript
import { MyTool } from './tools/MyTool/MyTool.js'

export function getBaseTools(): Tool[] {
  return [
    // ... 现有工具
    MyTool,
  ]
}
```

### 9.3 添加权限规则

在`src/utils/permissions/permissionSetup.ts`中：

```typescript
export const MY_TOOL_DEFAULT_ALLOW_RULES = [
  'my_tool(safe_param:*)',
]
```

## 十、关键文件路径

| 功能 | 文件路径 |
|------|----------|
| Tool类型定义 | `src/Tool.ts` |
| 工具注册 | `src/tools.ts` |
| 工具执行 | `src/services/tools/toolExecution.ts` |
| 流式执行 | `src/services/tools/StreamingToolExecutor.ts` |
| BashTool | `src/tools/BashTool/BashTool.ts` |
| FileReadTool | `src/tools/FileReadTool/FileReadTool.ts` |
| FileEditTool | `src/tools/FileEditTool/FileEditTool.ts` |
| AgentTool | `src/tools/AgentTool/AgentTool.ts` |
| MCPTool | `src/tools/MCPTool/MCPTool.ts` |