# Claude Code Bridge 系统架构

## 一、概述

Bridge系统是Claude Code实现**Remote Control**功能的核心组件，允许用户从Web端、移动端等远程客户端控制本地CLI会话。

### 核心功能
- **远程会话控制**: 用户可在claude.ai/code上控制本地CLI
- **双向消息同步**: 本地与远程实时同步对话内容
- **权限代理**: 远程审批本地工具执行权限
- **会话持久化**: 支持断线重连、崩溃恢复

## 二、模块架构

```
┌─────────────────────────────────────────────────────────────────┐
│                         initReplBridge.ts                        │
│                    (REPL入口，读取bootstrap状态)                  │
└───────────────────────────┬─────────────────────────────────────┘
                            │
            ┌───────────────┼───────────────┐
            ▼               ▼               ▼
┌───────────────────┐ ┌───────────────┐ ┌─────────────────────┐
│ bridgeEnabled.ts  │ │ bridgeConfig  │ │ createSession.ts    │
│ (启用条件检查)    │ │ (配置管理)    │ │ (会话创建API)       │
└───────────────────┘ └───────────────┘ └─────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────┐
│                   replBridge.ts / remoteBridgeCore.ts            │
│                      (Bridge核心逻辑)                            │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌─────────────────┐  ┌───────────────────┐   │
│  │ bridgeMain   │  │ bridgeMessaging │  │ jwtUtils          │   │
│  │ (主循环)     │  │ (消息协议)      │  │ (JWT认证)         │   │
│  └──────────────┘  └─────────────────┘  └───────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────┐
│                  replBridgeTransport.ts                          │
│                     (传输层抽象)                                  │
├───────────────────────────┬─────────────────────────────────────┤
│  v1: HybridTransport      │  v2: SSETransport + CCRClient       │
│  (WebSocket + POST)       │  (SSE读取 + POST写入)               │
└───────────────────────────┴─────────────────────────────────────┘
```

## 三、bridgeMain.ts - 主循环

**核心职责**:

1. **环境注册**: 向CCR服务注册bridge环境
2. **工作轮询**: 持续轮询服务器获取工作项
3. **会话生命周期管理**: 创建、监控、清理子进程会话
4. **心跳维护**: 定期心跳保持工作租约

### 3.1 主循环流程

```typescript
while (!loopSignal.aborted) {
  const pollConfig = getPollIntervalConfig()
  
  // 1. 轮询工作项
  const work = await api.pollForWork(environmentId, environmentSecret, loopSignal)
  
  if (!work) {
    // 无工作：根据容量状态决定休眠策略
    if (atCapacity) {
      await heartbeatActiveWorkItems()
      await sleep(pollConfig.multisession_poll_interval_ms_at_capacity)
    } else {
      await sleep(pollConfig.multisession_poll_interval_ms_not_at_capacity)
    }
    continue
  }
  
  // 2. 处理工作项
  switch (work.data.type) {
    case 'healthcheck':
      await api.acknowledgeWork(...)
      break
    case 'session':
      await spawnSession(...)
      break
  }
}
```

### 3.2 多会话模式

| 模式 | 说明 |
|------|------|
| `single-session` | 单会话，结束后bridge退出 |
| `same-dir` | 多会话共享同一工作目录 |
| `worktree` | 每个会话在隔离的git worktree中运行 |

## 四、bridgeMessaging.ts - 消息协议

### 4.1 消息类型

```typescript
// 入站消息类型判断
isSDKMessage(value)           // 用户消息
isSDKControlResponse(value)   // 权限响应
isSDKControlRequest(value)    // 控制请求

// 可转发消息判断
isEligibleBridgeMessage(m)    // user, assistant, local_command
```

### 4.2 服务端控制请求

| 子类型 | 用途 |
|--------|------|
| `initialize` | 会话初始化 |
| `set_model` | 切换模型 |
| `set_max_thinking_tokens` | 设置思考token上限 |
| `set_permission_mode` | 切换权限模式 |
| `interrupt` | 中断当前轮次 |

### 4.3 Echo去重机制

```typescript
// BoundedUUIDSet: 有界环形缓冲区
export class BoundedUUIDSet {
  private readonly ring: (string | undefined)[]
  private readonly set = new Set<string>()
  
  add(uuid: string): void {
    // 容量满时自动驱逐最旧条目
    if (this.set.has(uuid)) return
    const evicted = this.ring[this.writeIdx]
    if (evicted !== undefined) this.set.delete(evicted)
    this.ring[this.writeIdx] = uuid
    this.set.add(uuid)
    this.writeIdx = (this.writeIdx + 1) % this.capacity
  }
}
```

## 五、bridgePermissionCallbacks.ts - 权限回调

### 5.1 权限流程

```
┌──────────────┐     control_request      ┌──────────────┐
│  子进程CLI   │ ───────────────────────▶ │  Bridge进程  │
│              │     (can_use_tool)       │              │
└──────────────┘                          └──────┬───────┘
                                                 │
                                                 │ 转发到服务器
                                                 ▼
                                          ┌──────────────┐
                                          │  CCR服务器   │
                                          └──────┬───────┘
                                                 │
                                                 │ 推送到远程客户端
                                                 ▼
                                          ┌──────────────┐
                                          │ Web/Mobile   │
                                          │  用户审批    │
                                          └──────┬───────┘
                                                 │
                                                 │ control_response
                                                 ▼
┌──────────────┐     stdin JSON         ┌──────────────┐
│  子进程CLI   │ ◀───────────────────── │  Bridge进程  │
│  执行/拒绝   │                        │              │
└──────────────┘                        └──────────────┘
```

### 5.2 权限响应类型

```typescript
type BridgePermissionResponse = {
  behavior: 'allow' | 'deny'
  updatedInput?: Record<string, unknown>      // 修改后的工具输入
  updatedPermissions?: PermissionUpdate[]     // 权限更新建议
  message?: string                            // 说明信息
}
```

## 六、JWT认证机制

### 6.1 Token刷新调度器

```typescript
export function createTokenRefreshScheduler({
  getAccessToken,
  onRefresh,
  label,
  refreshBufferMs = 5 * 60 * 1000,  // 提前5分钟刷新
}): {
  schedule: (sessionId: string, token: string) => void
  cancel: (sessionId: string) => void
  cancelAll: () => void
}
```

### 6.2 刷新策略
- **刷新缓冲**: 在token过期前5分钟主动刷新
- **失败重试**: 最多3次连续失败后放弃
- **回退间隔**: 无法获取新token时，30分钟后再试

## 七、传输层架构

### 7.1 v1 vs v2对比

| 特性 | v1 (HybridTransport) | v2 (SSETransport + CCRClient) |
|------|----------------------|-------------------------------|
| 读取协议 | WebSocket | SSE |
| 写入端点 | Session-Ingress | CCR /worker/events |
| 认证方式 | OAuth 或 JWT | 仅JWT |
| 心跳 | 无内置 | 定期心跳 |
| 状态报告 | 无 | PUT /worker/state |

## 八、启用条件

### 8.1 必须满足的条件

| 条件 | 说明 |
|------|------|
| `feature('BRIDGE_MODE')` | 编译时特性开关 |
| `isClaudeAISubscriber()` | 必须通过OAuth登录claude.ai |
| `hasProfileScope()` | Token必须有`user:profile` scope |
| 组织UUID | 必须能获取用户所属组织 |
| GrowthBook门控 | `tengu_ccr_bridge` flag必须为true |
| 策略限制 | 组织策略`allow_remote_control`必须允许 |

### 8.2 限制说明

**认证限制**:
- 不支持Bedrock/Vertex/Foundry部署
- 不支持API Key认证
- 不支持Console API登录

**功能限制**:
- 单会话模式会话结束后bridge退出
- 权限代理需要远程用户在超时内响应

## 九、IDE扩展通信

### 9.1 支持的IDE类型

```typescript
type IdeType =
  | 'cursor' | 'windsurf' | 'vscode'    // VSCode系列
  | 'pycharm' | 'intellij' | 'webstorm'  // JetBrains系列
  // ... 更多
```

### 9.2 通信协议

IDE扩展通过CLI的MCP机制间接交互：

```
┌─────────────┐     MCP Protocol     ┌─────────────┐
│  IDE扩展    │ ◀──────────────────▶ │   CLI进程   │
└─────────────┘                      └──────┬──────┘
                                           │
                                           │ Bridge Protocol
                                           ▼
                                    ┌─────────────┐
                                    │ CCR服务器   │
                                    └─────────────┘
```

## 十、关键文件路径

| 文件 | 职责 |
|------|------|
| `src/bridge/bridgeMain.ts` | Bridge主循环 |
| `src/bridge/bridgeMessaging.ts` | 消息协议处理 |
| `src/bridge/bridgePermissionCallbacks.ts` | 权限回调 |
| `src/bridge/replBridge.ts` | REPL会话Bridge |
| `src/bridge/jwtUtils.ts` | JWT认证工具 |
| `src/bridge/sessionRunner.ts` | 会话执行管理 |
| `src/bridge/bridgeEnabled.ts` | 启用条件检查 |