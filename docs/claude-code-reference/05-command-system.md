# Claude Code 命令系统架构

## 一、系统概述

Claude Code的命令系统实现了用户可调用的斜杠命令（/commit, /review等）。命令通过统一的注册机制加载，支持多种实现模式。

## 二、命令注册机制

### 2.1 commands.ts注册

**文件**: `src/commands.ts`

```typescript
export function getCommands(): Command[] {
  return memoizedCommands ??= [
    // 内置命令
    ...builtInCommands(),
    
    // 从技能目录加载
    ...loadSkillsDir(),
    
    // Bundled技能
    ...bundledSkills(),
    
    // MCP技能
    ...mcpSkills(),
    
    // Workflow命令
    ...workflowCommands(),
  ]
}
```

### 2.2 Command类型定义

**文件**: `src/types/command.ts`

```typescript
type Command =
  | PromptCommand
  | LocalCommand
  | LocalJSXCommand

type CommandBase = {
  name: string
  description?: string
  hidden?: boolean
  pluginInfo?: PluginInfo
}

// 提示型命令 - 返回文本注入对话
type PromptCommand = CommandBase & {
  type: 'prompt'
  getPromptForCommand: (args: string) => Promise<string | string[]>
}

// 本地命令 - 执行函数
type LocalCommand = CommandBase & {
  type: 'local'
  load: () => Promise<{ call: (args: string) => Promise<void> }>
}

// JSX命令 - 返回React组件
type LocalJSXCommand = CommandBase & {
  type: 'local-jsx'
  load: () => Promise<{ call: (onDone, context, args) => Promise<React.ReactNode> }>
}
```

## 三、命令实现模式

### 3.1 Prompt命令

通过`getPromptForCommand()`返回提示文本：

```typescript
// src/commands/commit/commit.ts
export const CommitCommand: PromptCommand = {
  name: 'commit',
  type: 'prompt',
  description: 'Create a git commit',
  async getPromptForCommand(args: string) {
    return `Create a git commit with the changes in the current directory.`
  },
}
```

### 3.2 Local命令

执行异步操作，无UI渲染：

```typescript
// src/commands/compact/compact.ts
export const CompactCommand: LocalCommand = {
  name: 'compact',
  type: 'local',
  description: 'Compact conversation history',
  async load() {
    const { compact } = await import('./compactImpl.js')
    return { call: compact }
  },
}
```

### 3.3 Local-JSX命令

返回React组件渲染UI：

```typescript
// src/commands/mcp/mcp.tsx
export const MCPCommand: LocalJSXCommand = {
  name: 'mcp',
  type: 'local-jsx',
  description: 'Manage MCP servers',
  async load() {
    const { MCPSettings } = await import('./MCPSettings.js')
    return {
      call: async (onDone, context, args) => {
        return <MCPSettings onComplete={onDone} args={args} />
      }
    }
  },
}
```

## 四、主要命令列表

| 命令 | 类型 | 说明 |
|------|------|------|
| `/commit` | prompt | 创建Git提交 |
| `/review` | prompt | 代码审查 |
| `/compact` | local | 压缩对话历史 |
| `/mcp` | local-jsx | MCP服务器管理 |
| `/config` | local-jsx | 配置面板 |
| `/doctor` | local-jsx | 诊断工具 |
| `/login` | local-jsx | OAuth登录 |
| `/logout` | local | 注销 |
| `/memory` | local-jsx | 记忆管理 |
| `/skills` | local-jsx | 技能管理 |
| `/tasks` | local-jsx | 任务管理 |
| `/vim` | local | Vim模式切换 |
| `/theme` | local-jsx | 主题切换 |
| `/cost` | local | 成本查看 |
| `/diff` | local-jsx | 差异查看 |
| `/clear` | local | 清除对话 |
| `/help` | local-jsx | 帮助信息 |

## 五、Skill系统

### 5.1 Bundled Skills

**文件**: `src/skills/bundledSkills.ts`

```typescript
export function registerBundledSkill(skill: BundledSkill): void {
  bundledSkillsRegistry.set(skill.name, skill)
}

type BundledSkill = {
  name: string
  description: string
  prompt: string
  model?: string
  effort?: number
}
```

### 5.2 技能目录加载

**文件**: `src/skills/loadSkillsDir.ts`

从`.claude/skills/`目录加载SKILL.md文件。

### 5.3 SkillTool

**文件**: `src/tools/SkillTool/SkillTool.ts`

模型通过SkillTool调用技能：
- Inline执行：在当前对话中执行
- Fork执行：启动子代理执行

## 六、命令执行流程

### 6.1 斜杠命令解析

**文件**: `src/utils/slashCommandParsing.ts`

```typescript
export function parseSlashCommand(input: string): {
  command: string
  args: string
} | null {
  const match = input.match(/^\/([a-zA-Z0-9_-]+)(?:\s+(.*))?$/)
  if (!match) return null
  return { command: match[1], args: match[2] ?? '' }
}
```

### 6.2 执行入口

**文件**: `src/utils/processUserInput.ts`

```typescript
async function executeSlashCommand(
  command: Command,
  args: string,
  context: ProcessUserInputContext,
): Promise<SlashCommandResult>
```

### 6.3 Fork执行模式

对于需要上下文隔离的命令：

```typescript
async function executeForkedSlashCommand(
  command: CommandBase & PromptCommand,
  args: string,
  context: ProcessUserInputContext,
): Promise<SlashCommandResult> {
  // 启动子代理执行
  for await (const message of runAgent({
    agentDefinition: baseAgent,
    promptMessages,
    toolUseContext,
    isAsync: true,
  })) {
    agentMessages.push(message)
  }
}
```

## 七、Plugin命令

### 7.1 Plugin信息

```typescript
type PluginInfo = {
  pluginManifest: PluginManifest
  repository: string
}
```

### 7.2 Plugin命令加载

从已安装的插件中加载命令，支持：
- Anthropic官方插件市场
- 自定义插件仓库

## 八、命令权限

### 8.1 权限规则格式

```
/commit → 自动允许
/config → 需要确认
```

### 8.2 权限配置

```json
{
  "permissions": {
    "allow": [
      "Bash(git commit:*)",
      "Read(.claude/**)"
    ]
  }
}
```

## 九、新增命令指南

### 9.1 创建命令文件

```typescript
// src/commands/myCommand/myCommand.ts
export const MyCommand: LocalJSXCommand = {
  name: 'mycommand',
  type: 'local-jsx',
  description: 'My custom command',
  async load() {
    const { MyCommandUI } = await import('./MyCommandUI.js')
    return {
      call: async (onDone, context, args) => {
        return <MyCommandUI onComplete={onDone} args={args} />
      }
    }
  },
}
```

### 9.2 注册命令

在`src/commands.ts`中导入并添加：

```typescript
import { MyCommand } from './commands/myCommand/myCommand.js'

function builtInCommands(): Command[] {
  return [
    // ... 现有命令
    MyCommand,
  ]
}
```

### 9.3 创建UI组件

```tsx
// src/commands/myCommand/MyCommandUI.tsx
export function MyCommandUI({ onComplete, args }: Props) {
  const [result, setResult] = useState<string>()
  
  useEffect(() => {
    // 执行逻辑
    doSomething().then(result => {
      onComplete(result)
    })
  }, [])
  
  return (
    <Box flexDirection="column">
      <Text>Executing my command...</Text>
    </Box>
  )
}
```

## 十、关键文件路径

| 功能 | 文件路径 |
|------|----------|
| 命令注册 | `src/commands.ts` |
| 命令类型 | `src/types/command.ts` |
| 斜杠解析 | `src/utils/slashCommandParsing.ts` |
| 执行入口 | `src/utils/processUserInput.ts` |
| Bundled技能 | `src/skills/bundledSkills.ts` |
| 技能目录 | `src/skills/loadSkillsDir.ts` |
| SkillTool | `src/tools/SkillTool/SkillTool.ts` |