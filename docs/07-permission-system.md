# Claude Code 权限系统架构

## 一、系统概述

Claude Code 的权限系统是一个多层次、多模式的工具调用权限检查框架，位于 `src/hooks/toolPermission/` 和 `src/utils/permissions/` 目录。

## 二、权限模式 (PermissionMode)

### 2.1 模式定义

```typescript
export const EXTERNAL_PERMISSION_MODES = [
  'acceptEdits',
  'bypassPermissions',
  'default',
  'dontAsk',
  'plan',
] as const

export type InternalPermissionMode = ExternalPermissionMode | 'auto' | 'bubble'
```

### 2.2 各模式说明

| 模式 | 说明 | 风险级别 |
|------|------|----------|
| **default** | 默认模式，敏感操作需用户确认 | 低 |
| **plan** | 计划模式，暂停执行等待批准计划 | 低 |
| **acceptEdits** | 自动接受文件编辑操作 | 中 |
| **bypassPermissions** | 完全绕过权限检查 | 高 |
| **dontAsk** | 不询问，自动拒绝所有操作 | 低 |
| **auto** | AI模式，分类器自动判断 | 中 |

## 三、权限检查流程

### 3.1 核心函数

**文件**: `src/utils/permissions/permissions.ts`

```typescript
export async function hasPermissionsToUseTool(
  tool: Tool,
  input: unknown,
  toolUseContext: ToolUseContext,
  permissionMode: string,
): Promise<PermissionResult>
```

### 3.2 检查步骤（按优先级）

```
权限检查流程:
┌─────────────────────────────────────────┐
│ Step 1a: 全工具拒绝规则检查              │
│ Step 1b: 全工具询问规则检查              │
│ Step 1c: 工具特定权限检查                │
│ Step 1d: 工具拒绝处理                    │
│ Step 1e: 用户交互需求检查                │
│ Step 1f: 内容特定询问规则                │
│ Step 1g: 安全检查 (.git/, .claude/等)    │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│ Step 2a: 模式检查                        │
│  - bypassPermissions → 直接允许          │
│  - dontAsk → 转换为 deny                 │
│  - auto → 分类器判断                     │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│ Step 2b: 白名单规则检查                  │
│ Step 3: Passthrough 转换为 ask           │
└─────────────────────────────────────────┘
```

### 3.3 结果类型

```typescript
type PermissionResult = 
  | { behavior: 'allow'; decisionReason?: PermissionDecisionReason }
  | { behavior: 'deny'; decisionReason?: PermissionDecisionReason }
  | { behavior: 'ask'; decisionReason: PermissionDecisionReason; ... }
```

## 四、三种权限处理器

### 4.1 InteractiveHandler

**文件**: `src/hooks/toolPermission/handlers/interactiveHandler.ts`

处理主Agent的交互式权限流程：

- 将权限请求推入确认队列
- 异步运行Permission Hooks与Bash分类器
- 支持Bridge (CCR)和Channel远程权限

**竞争机制**:
```
本地用户 + Hook + 分类器 + Bridge + Channel
     ↓
  claim() 原子竞争 → 唯一获胜者解决请求
```

### 4.2 CoordinatorHandler

**文件**: `src/hooks/toolPermission/handlers/coordinatorHandler.ts`

处理Coordinator Worker的权限流程：

1. 顺序等待Permission Hooks
2. 如果Hook未解决，等待分类器
3. 两者都未解决则回退到交互式对话框

### 4.3 SwarmWorkerHandler

**文件**: `src/hooks/toolPermission/handlers/swarmWorkerHandler.ts`

处理Swarm Worker的权限流程：

1. 尝试分类器自动批准
2. 通过mailbox将请求转发给Leader
3. 注册回调等待Leader响应

## 五、Auto模式分类器

### 5.1 分类流程

```
Auto模式决策流程:
┌──────────────────────┐
│  acceptEdits快速路径 │ → 直接批准
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  安全工具白名单检查   │ → 直接批准
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  classifyYoloAction  │
│  (AI分类器)          │
│  Stage 1: Fast模型   │
│  Stage 2: Thinking   │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  拒绝限制检查         │ → 回退交互式
└──────────────────────┘
```

### 5.2 Bash命令分类器

用于Bash命令的安全性预测：
- 规则匹配（prompt rule）
- 异步执行与用户交互竞争
- Speculative检查（提前预测）

## 六、权限规则系统

### 6.1 规则结构

```typescript
type PermissionRule = {
  source: PermissionRuleSource     // 规则来源
  ruleBehavior: PermissionBehavior // 'allow' | 'deny' | 'ask'
  ruleValue: PermissionRuleValue   // 工具名 + 规则内容
}

type PermissionRuleSource =
  | 'userSettings' | 'projectSettings' | 'localSettings'
  | 'flagSettings' | 'policySettings' | 'cliArg'
  | 'command' | 'session'
```

### 6.2 配置源优先级

```
配置源优先级（从低到高）:
┌──────────────────────────────────────────┐
│  userSettings     - ~/.claude/settings   │
├──────────────────────────────────────────┤
│  projectSettings  - .claude/settings     │
├──────────────────────────────────────────┤
│  localSettings    - .claude/settings.local│
├──────────────────────────────────────────┤
│  flagSettings     - --settings 标志      │
├──────────────────────────────────────────┤
│  policySettings   - managed-settings.json│
└──────────────────────────────────────────┘
```

### 6.3 PermissionUpdate操作

```typescript
type PermissionUpdate =
  | { type: 'addRules', destination, rules, behavior }
  | { type: 'replaceRules', destination, rules, behavior }
  | { type: 'removeRules', destination, rules, behavior }
  | { type: 'setMode', destination, mode }
  | { type: 'addDirectories', destination, directories }
```

## 七、Permission Hooks

### 7.1 Hook执行

**文件**: `src/utils/hooks.ts`

```typescript
export async function* executePermissionRequestHooks<ToolInput>(
  toolName: string,
  toolUseID: string,
  toolInput: ToolInput,
  toolUseContext: ToolUseContext,
  permissionMode?: string,
  ...
): AsyncGenerator<HookResult>
```

**返回类型**:
- `allow`: 自动批准，可携带`updatedInput`和`updatedPermissions`
- `deny`: 自动拒绝，可设置`interrupt`标志中断执行

### 7.2 Hook配置

**文件**: `src/schemas/hooks.ts`

支持四种Hook类型：
- `BashCommandHook` - Shell命令执行钩子
- `PromptHook` - LLM提示词钩子
- `HttpHook` - HTTP请求钩子
- `AgentHook` - 代理验证钩子

## 八、React组件交互

### 8.1 useCanUseTool Hook

**文件**: `src/hooks/useCanUseTool.tsx`

React组件层的权限检查入口：

```typescript
function useCanUseTool(setToolUseConfirmQueue, setToolPermissionContext) {
  return async (tool, input, toolUseContext, assistantMessage, toolUseID, forceDecision) => {
    const ctx = createPermissionContext(...)
    const result = await hasPermissionsToUseTool(...)
    
    if (result.behavior === 'allow') {
      resolve(ctx.buildAllow(...))
    } else if (result.behavior === 'ask') {
      // 根据 Agent 类型选择处理器
      handleInteractivePermission(...)
    }
  }
}
```

### 8.2 PermissionRequest组件

**文件**: `src/components/permissions/PermissionRequest.tsx`

工具专属权限对话框映射：

```typescript
function permissionComponentForTool(tool: Tool) {
  switch (tool) {
    case FileEditTool: return FileEditPermissionRequest
    case BashTool: return BashPermissionRequest
    default: return FallbackPermissionRequest
  }
}
```

### 8.3 ToolUseConfirm类型

```typescript
type ToolUseConfirm = {
  assistantMessage: AssistantMessage
  tool: Tool
  description: string
  input: z.infer<Input>
  toolUseContext: ToolUseContext
  toolUseID: string
  permissionResult: PermissionDecision
  // 回调
  onAllow(updatedInput, permissionUpdates, feedback?) 
  onReject(feedback?)
}
```

## 九、权限决策日志

**文件**: `src/hooks/toolPermission/permissionLogging.ts`

### 9.1 事件类型

| 事件 | 触发条件 |
|------|----------|
| `tengu_tool_use_granted_in_config` | 配置自动批准 |
| `tengu_tool_use_granted_by_classifier` | 分类器批准 |
| `tengu_tool_use_granted_in_prompt_permanent` | 用户永久批准 |
| `tengu_tool_use_granted_by_permission_hook` | Hook批准 |
| `tengu_tool_use_rejected_in_prompt` | 用户/Hook拒绝 |

### 9.2 OTel遥测

```typescript
logOTelEvent('tool_decision', {
  tool_name,
  decision,
  source,
  duration_ms,
})
```

## 十、关键文件路径

| 功能 | 文件路径 |
|------|----------|
| 权限类型定义 | `src/types/permissions.ts` |
| 权限上下文 | `src/hooks/toolPermission/PermissionContext.ts` |
| 权限检查主函数 | `src/utils/permissions/permissions.ts` |
| 权限模式定义 | `src/utils/permissions/PermissionMode.ts` |
| Interactive处理器 | `src/hooks/toolPermission/handlers/interactiveHandler.ts` |
| 权限对话框组件 | `src/components/permissions/PermissionRequest.tsx` |
| React Hook | `src/hooks/useCanUseTool.tsx` |