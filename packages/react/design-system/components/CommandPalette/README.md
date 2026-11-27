# CommandPalette

CommandDialog 加「最近」分组：选过的命令放最前（去重、最多 5 条），没输入时显示；记录可受控、存 localStorage 或只在页内存。照 TradingView 的 Ctrl/Cmd+K 快速搜索。行可带灰色说明与「2 步」这类徽标；命令声明 steps 后，选中它面板不关、进步骤页（头部句子、多选清单、脚栏），交互借 Jamie Merrill 的 Command menu。

## Provide

`*` marks a required prop.

### CommandPalette

命令 PaletteCommand：id、label、group、keywords、shortcut、icon、description（灰色说明）、meta（徽标，带 steps 时默认 labels.steps(n)）、steps、runLabel、disabled、onSelect。onRun(commandId, selections) 在最后一步主操作后调用（selections 是 { 步 id: id 串 }），随后面板关闭。labels.steps 放徽标、已选数、换步时读屏念的「第几步，共几步」（stepOf）、返回 / 下一步 / 执行、全选的字，没传的退回英文。

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
| `onRun` | `(commandId: string, selections: StepSelections) => void` | — | Called when the primary button of the last step is pressed, with the command id and the chosen ids per step id; the palette closes after it. |

### PaletteStep

一步：kind: "checklist"（options: id、label、description、keywords、disabled；selectAllLabel）或 kind: "custom"（render 与 tags 由调用方给）；共有 id、joiner（头部句子里接在标签前的字）、heading、placeholder、actionLabel、required（默认 true，没选主操作禁用）。

### pushRecent / recentCommands

最近列表的纯函数：放最前去重截断；id 换成还在的命令。

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { Button, CommandPalette, useHotkeys, type PaletteCommand } from '@katana-ui/react'

const MARKETS = [
  { id: 'us', label: 'US', description: '312 symbols' },
  { id: 'hk', label: 'Hong Kong', description: '148 symbols' },
]
const FIELDS = [
  { id: 'ohlc', label: 'OHLC' },
  { id: 'volume', label: 'Volume' },
]

const COMMANDS: readonly PaletteCommand[] = [
  { id: 'reset', label: 'Reset chart', group: 'Chart', onSelect: () => {} },
  { id: 'snapshot', label: 'Take snapshot', group: 'Chart', onSelect: () => {} },
  { id: 'theme', label: 'Switch theme', group: 'Settings', keywords: ['dark'], onSelect: () => {} },
  {
    id: 'export',
    label: 'Bulk export',
    group: 'Data',
    description: 'By market',
    // Two steps: "2 steps" badge on the row; selecting it opens the step page, the palette stays open.
    steps: [
      { kind: 'checklist', id: 'market', joiner: 'from', heading: 'Select market', options: MARKETS },
      { kind: 'checklist', id: 'fields', joiner: 'with', heading: 'Select fields', options: FIELDS },
    ],
  },
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
        onRun={(commandId, selections) => console.log(commandId, selections)}
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
- 步骤页：头部句子「命令名 + 每步的 joiner 与已选标签」，每步最多 3 个标签、其余折成 +N；脚栏左「已选 N 项」，右「返回」「主操作」。
- 全选行三态：可见的可选项全勾 aria-checked=true、部分 mixed、全无 false；筛选时只动可见的行。

## Don't

- 不要把最近的命令再塞进别的分组：最近只在没输入时出。
- 不要在包里写占位与标题文字。
- 不要拿 cmdk 的行（aria-selected 是高亮）当勾选行：步骤页的清单是多选 listbox，option 的 aria-selected 才是「已选」。
- 步骤别超过三步；超过就该是一个页面或表单。

## Composition

```
CommandPalette
  CommandDialog
    CommandInput
    CommandList
      CommandEmpty
      CommandGroup（最近）
      CommandGroup × 分组
        CommandItem（图标、名字、灰色说明、Tag 徽标、CommandShortcut）
    CommandSteps（选了带 steps 的命令后换上）
      头部句子（命令名、joiner、Tag）
      筛选框
      清单（多选 listbox：全选行、选项行 role=option）或调用方的内容
      脚栏（已选 N 项、返回、主操作）
```

## Keyboard

- `Mod+K`：（调用方用 useHotkeys 登记）打开
- `↑ ↓ / Enter`：移动高亮 / 执行并记进最近
- `Esc`：关闭，焦点回原处（步骤页里也是直接关）
- `步骤页 ↑ ↓ / Home / End`：移动高亮（全选行在最前，首尾相接）
- `步骤页 Enter`：勾选或取消高亮的行
- `步骤页 Mod+Enter`：主操作（下一步或执行；没有选择时无效）
- `步骤页 Tab / Enter`：Tab 到「返回」「下一步」按 Enter 即点击；custom 步里的控件（输入框、多行框）自己管 Home / End / Enter
- `步骤页 Backspace（输入为空）`：退回上一步；第一步退回命令列表，选择清空
