# CommandPalette

CommandDialog 加「最近」分组：选过的命令放最前（去重、最多 5 条），没输入时显示；记录可受控、存 localStorage 或只在页内存。照 TradingView 的 Ctrl/Cmd+K 快速搜索。

## Provide

`*` marks a required prop.

### CommandPalette

命令 PaletteCommand：id、label、group、keywords、shortcut、icon、disabled、onSelect。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `open` * | `boolean` | — | Whether the palette is open (controlled). |
| `onOpenChange` * | `(open: boolean) => void` | — | Called when the palette opens or closes; selecting a command closes it. |
| `commands` * | `readonly PaletteCommand[]` | — | All commands. |
| `labels` * | `CommandPaletteLabels` | — | Texts written by the caller. |
| `recent` | `readonly string[]` | — | Recent command ids, newest first (controlled). |
| `onRecentChange` | `(next: string[]) => void` | — | Called with the new recent list after a command is selected. |
| `recentKey` | `string` | — | localStorage key to keep the recent list when it is not controlled. |
| `recentLimit` | `number` | `5` | How many recent commands to keep and show. |

### pushRecent / recentCommands

最近列表的纯函数：放最前去重截断；id 换成还在的命令。

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { Button, CommandPalette, useHotkeys, type PaletteCommand } from '@katana-ui/react'

const COMMANDS: readonly PaletteCommand[] = [
  { id: 'reset', label: 'Reset chart', group: 'Chart', onSelect: () => {} },
  { id: 'snapshot', label: 'Take snapshot', group: 'Chart', onSelect: () => {} },
  { id: 'theme', label: 'Switch theme', group: 'Settings', keywords: ['dark'], onSelect: () => {} },
]

export function CommandPaletteUsage() {
  const [open, setOpen] = useState(false)
  const [recent, setRecent] = useState<readonly string[]>(['snapshot'])
  useHotkeys([
    { id: 'palette', combo: 'Mod+K', label: 'Command palette', allowInInput: true, handler: () => setOpen(true) },
  ])
  return (
    <>
      <Button onClick={() => setOpen(true)}>Commands</Button>
      <CommandPalette
        open={open}
        onOpenChange={setOpen}
        commands={COMMANDS}
        recent={recent}
        onRecentChange={setRecent}
        labels={{
          title: 'Command palette',
          description: 'Search commands',
          placeholder: 'Search…',
          empty: 'No command matches',
          recent: 'Recent',
        }}
      />
    </>
  )
}
```

## States

- 没输入：最近（有记录时）+ 各分组。
- 有输入：按全部命令过滤，不显示最近。
- 没有匹配：空态文字。

## Don't

- 不要把最近的命令再塞进别的分组：最近只在没输入时出。
- 不要在包里写占位与标题文字。

## Composition

```
CommandPalette
  CommandDialog
    CommandInput
    CommandList
      CommandEmpty
      CommandGroup（最近）
      CommandGroup × 分组
        CommandItem（图标、名字、CommandShortcut）
```

## Keyboard

- `Mod+K`：（调用方用 useHotkeys 登记）打开
- `↑ ↓ / Enter`：移动高亮 / 执行并记进最近
- `Esc`：关闭，焦点回原处
