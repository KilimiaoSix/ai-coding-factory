# Claude Code 终端UI系统架构

## 一、系统概述

Claude Code 的终端UI系统是一个基于React的自定义渲染框架，核心是定制版的Ink渲染器。该系统将React组件树转换为终端可显示的ANSI转义序列。

## 二、架构层次

```
┌─────────────────────────────────────────────────────────────┐
│                    React Application Layer                   │
│                 (Components, Hooks, Context)                 │
├─────────────────────────────────────────────────────────────┤
│                    React Reconciler Layer                    │
│              (src/ink/reconciler.ts - 自定义宿主配置)          │
├─────────────────────────────────────────────────────────────┤
│                      DOM Abstraction                         │
│              (src/ink/dom.ts - 虚拟DOM节点)                   │
├─────────────────────────────────────────────────────────────┤
│                    Layout Engine (Yoga)                      │
│           (src/ink/layout/ - Flexbox布局计算)                 │
├─────────────────────────────────────────────────────────────┤
│                     Renderer Layer                           │
│          (src/ink/renderer.ts, render-node-to-output.ts)     │
├─────────────────────────────────────────────────────────────┤
│                    Terminal I/O Layer                        │
│              (src/ink/termio/, terminal.ts)                   │
└─────────────────────────────────────────────────────────────┘
```

## 三、Ink渲染器核心

### 3.1 React Reconciler配置

**文件**: `src/ink/reconciler.ts`

关键宿主配置方法：
- **`createInstance`**: 创建DOM元素节点（`ink-box`, `ink-text`等）
- **`createTextInstance`**: 创建文本节点
- **`appendChildNode`/`removeChildNode`**: DOM树操作
- **`commitUpdate`**: React 19风格的属性更新
- **`resetAfterCommit`**: 提交后触发布局计算和渲染

### 3.2 DOM抽象层

**文件**: `src/ink/dom.ts`

**节点类型**:
| 类型 | 说明 |
|------|------|
| `ink-root` | 根节点 |
| `ink-box` | 容器节点（类似`<div>`） |
| `ink-text` | 文本容器 |
| `ink-virtual-text` | 嵌套文本节点 |
| `ink-link` | 链接节点 |
| `ink-raw-ansi` | 原始ANSI内容 |

**脏标记机制**: `markDirty()`标记节点及其祖先为需要重新渲染。

### 3.3 布局引擎

**文件**: `src/ink/layout/yoga.ts`

使用Facebook的Yoga布局引擎实现Flexbox布局：
- `flexDirection`: row, column, row-reverse, column-reverse
- `flexGrow`, `flexShrink`, `flexBasis`
- `alignItems`, `justifyContent`
- `padding`, `margin`, `gap`
- `position`: relative, absolute
- `overflow`: visible, hidden, scroll

### 3.4 样式系统

**支持的样式属性**:
- 布局: `flexDirection`, `flexWrap`, `flexGrow`, `alignItems`
- 尺寸: `width`, `height`, `minWidth`, `maxHeight`
- 间距: `margin`, `padding`, `gap`
- 边框: `borderStyle`, `borderColor`
- 文本: `textWrap` (wrap, truncate, truncate-middle等)

**颜色系统**:
```typescript
type Color = RGBColor | HexColor | Ansi256Color | AnsiColor
// 支持: rgb(255,0,0), #ff0000, ansi256(196), ansi:red
```

## 四、核心组件

### 4.1 Box组件

**文件**: `src/ink/components/Box.tsx`

基础布局容器，类似HTML的`<div style="display: flex">`。

**特性**:
- 完整的Flexbox布局属性
- 事件处理: `onClick`, `onFocus`, `onBlur`, `onKeyDown`
- Tab导航: `tabIndex`属性
- 自动聚焦: `autoFocus`属性

### 4.2 Text组件

**文件**: `src/ink/components/Text.tsx`

**特性**:
- 颜色: `color`, `backgroundColor`
- 样式: `bold`, `italic`, `underline`, `strikethrough`
- 换行模式: `wrap` (支持truncate-*多种模式)

### 4.3 ScrollBox组件

**文件**: `src/ink/components/ScrollBox.tsx`

可滚动容器，支持虚拟滚动。

**命令式API**:
```typescript
type ScrollBoxHandle = {
  scrollTo: (y: number) => void
  scrollBy: (dy: number) => void
  scrollToElement: (el: DOMElement, offset?: number) => void
  scrollToBottom: () => void
  getScrollTop: () => number
  getScrollHeight: () => number
  isSticky: () => boolean
}
```

**性能优化**:
- 绕过React状态更新，直接操作DOM节点的`scrollTop`
- 使用`queueMicrotask`合并多次滚动操作

### 4.4 AlternateScreen组件

**文件**: `src/ink/components/AlternateScreen.tsx`

进入终端的备用屏幕缓冲区，用于全屏应用。

**功能**:
- 进入/退出alt-screen (DEC 1049)
- 可选的鼠标追踪 (SGR模式)
- 保存/恢复主屏幕内容

## 五、主题系统

### 5.1 主题定义

**文件**: `src/utils/theme.ts`

```typescript
type Theme = {
  claude: string          // 品牌橙色
  permission: string      // 权限相关
  text: string           // 文本颜色
  success: string        // 成功状态
  error: string          // 错误状态
  warning: string        // 警告状态
  diffAdded: string      // Diff添加
  diffRemoved: string    // Diff删除
}
```

**预置主题**:
- `dark` / `light`: 标准深色/浅色主题
- `dark-daltonized` / `light-daltonized`: 色盲友好主题
- `dark-ansi` / `light-ansi`: 16色ANSI主题

### 5.2 ThemeProvider

支持'auto'自动跟随系统主题，通过OSC 11查询监听终端背景色变化。

## 六、Vim模式实现

### 6.1 状态机设计

**文件**: `src/vim/types.ts`

采用类型驱动的状态机设计：

```typescript
type VimState =
  | { mode: 'INSERT'; insertedText: string }
  | { mode: 'NORMAL'; command: CommandState }

type CommandState =
  | { type: 'idle' }
  | { type: 'count'; digits: string }
  | { type: 'operator'; op: Operator; count: number }
  | { type: 'find'; find: FindType; count: number }
  // ... 更多状态
```

### 6.2 支持的操作

| 类别 | 操作 |
|------|------|
| 移动 | h, l, j, k, w, b, e, W, B, E, 0, ^, $, G, gg |
| 操作符 | delete, change, yank |
| 模式切换 | i, a, o, O, v, V |

## 七、Keybindings系统

### 7.1 上下文系统

```typescript
type KeybindingContextName =
  | 'Global' | 'Chat' | 'Autocomplete' | 'Settings'
  | 'Confirmation' | 'Scroll' | 'Help' | 'Footer'
  | 'MessageActions' | 'DiffDialog'
```

### 7.2 默认绑定示例

```typescript
{
  context: 'Global',
  bindings: {
    'ctrl+c': 'app:interrupt',
    'ctrl+d': 'app:exit',
    'ctrl+l': 'app:redraw',
  },
},
{
  context: 'Chat',
  bindings: {
    'escape': 'chat:cancel',
    'enter': 'chat:submit',
    'ctrl+x ctrl+k': 'chat:killAgents',  // 和弦序列
  },
}
```

### 7.3 解析逻辑

**文件**: `src/keybindings/resolver.ts`

- 取消和弦序列（Escape）
- 检查是否可能是更长和弦的前缀
- 匹配完整绑定

## 八、React 19特性使用

### 8.1 useEffectEvent

用于创建"事件处理程序"样式的回调：

```typescript
const onSettingsChange = useEffectEvent((source: SettingSource) => {
  applySettingsChange(source, store.setState)
})
```

### 8.2 useSyncExternalStore

用于订阅外部状态(AppState):

```typescript
export function useAppState<T>(selector: (state: AppState) => T): T {
  const store = useAppStore()
  return useSyncExternalStore(store.subscribe, selector, selector)
}
```

### 8.3 useInsertionEffect

用于在DOM变化前同步执行副作用（进入alt-screen）。

## 九、性能优化策略

### 9.1 渲染优化

1. **脏标记传播**: 只重新渲染变化子树
2. **双缓冲**: `frontFrame`/`backFrame`实现diff渲染
3. **字符缓存池**: `StylePool`, `charPool`复用对象
4. **Yoga缓存**: 布局结果缓存

### 9.2 滚动优化

1. **命令式API**: 绕过React状态更新
2. **微任务合并**: `queueMicrotask`合并连续滚动
3. **虚拟滚动**: 只渲染可见区域

### 9.3 事件处理优化

1. **稳定监听器位置**: `useEventCallback`保持EventEmitter顺序
2. **stopImmediatePropagation**: 阻止后续监听器

## 十、关键文件路径

| 功能 | 文件路径 |
|------|----------|
| React Reconciler | `src/ink/reconciler.ts` |
| DOM抽象 | `src/ink/dom.ts` |
| 布局引擎 | `src/ink/layout/yoga.ts` |
| 样式系统 | `src/ink/styles.ts` |
| 渲染器 | `src/ink/renderer.ts` |
| Box组件 | `src/ink/components/Box.tsx` |
| Text组件 | `src/ink/components/Text.tsx` |
| ScrollBox组件 | `src/ink/components/ScrollBox.tsx` |
| 主题系统 | `src/utils/theme.ts` |
| Vim模式 | `src/vim/types.ts`, `src/vim/transitions.ts` |
| Keybindings | `src/keybindings/resolver.ts` |