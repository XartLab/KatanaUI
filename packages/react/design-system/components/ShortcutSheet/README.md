# ShortcutSheet

按作用域分组列出注册表里现在的快捷键，可搜索，冲突标出来，可接 ShortcutRecorder 改键。照 TradingView 的 Keyboard shortcuts 面板（Ctrl/Cmd+/）。件只是内容，放进 Dialog 或侧栏由调用方定。

## Provide

`*` marks a required prop.

### ShortcutSheet

读 useHotkeyEntries；文案（搜索、空态、或、冲突、作用域名、改键用的录键文案）全由调用方传。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `labels` * | `ShortcutSheetLabels` | — | Texts written by the caller. |
| `scopeOrder` | `readonly string[]` | `[]` | Scope order of the sections; scopes not listed follow in first-registered order. |
| `registry` | `HotkeyRegistry` | — | Registry to read; defaults to the one from HotkeysProvider or the module default. |
| `onComboChange` | `(id: string, combo: string \| null) => void` | — | Turns each row into a ShortcutRecorder; called with the action id and the new combo (null clears). |
| `className` | `string` | — | Extra class name. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { ShortcutSheet, useHotkeys } from '@katana-ui/react'

export function ShortcutSheetUsage() {
  useHotkeys([
    { id: 'search', combo: 'Mod+K', label: 'Quick search', handler: () => {} },
    { id: 'next', combo: ['ArrowDown', 'Space'], label: 'Next symbol', scope: 'watchlist', handler: () => {} },
    { id: 'flag', combo: 'Alt+Enter', label: 'Flag / unflag symbol', scope: 'watchlist', handler: () => {} },
  ])
  return (
    <div style={{ width: 360 }}>
      <ShortcutSheet
        labels={{
          search: 'Find shortcut',
          empty: 'No shortcut matches',
          or: 'or',
          conflict: (others) => `Conflicts with ${others}`,
          scope: (scope) => ({ global: 'General', watchlist: 'Watchlist' })[scope] ?? scope,
        }}
        scopeOrder={['global', 'watchlist']}
      />
    </div>
  )
}
```

## States

- 搜索：按名字、作用域、按键过滤；没有匹配显示空态。
- 冲突：名字下一行 warn 色小字。
- 改键：每行是 ShortcutRecorder。

## Don't

- 不要自己另写一份快捷键清单：总览读注册表，跟实际生效的一致。

## Composition

```
ShortcutSheet
  搜索框
  section × 作用域
    h3
    ul
      li（名字 | Kbd 或 ShortcutRecorder）
```

## Keyboard

- `打字`：在搜索框里过滤
- `Tab`：（改键时）在各行的录键框之间移动
