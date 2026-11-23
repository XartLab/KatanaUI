# SplitButton

一个按钮两个动作：左半执行主动作，右半的箭头开一份同类动作的菜单。下单「买入 · 限价」加菜单（市价、条件单），持仓「平仓」加菜单（平一半、反手），顶栏「保存」加菜单（另存为、重命名）。菜单里选了谁、主按钮就换成谁（TradingView 画图工具条的分组按钮那样）由调用方在 onSelect 里改 children 与 onClick。按主动作时整组一起缩，箭头开着时转 180°。改自 Arc split-button（MIT）。

## Provide

`*` marks a required prop.

### SplitButton

两半都是我们的 Button，variant 与 size 同一份；菜单是 DropdownMenu（align=end），项的 danger、disabled、shortcut 照它的行。labels.menu 必填：箭头那半没有字，读屏靠它。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `children` * | `ReactNode` | — | Content of the main half. |
| `onClick` * | `() => void` | — | Called when the main half is pressed. |
| `actions` * | `readonly SplitButtonAction[]` | — | Entries of the menu half, in order. |
| `labels` * | `SplitButtonLabels` | — | Texts: menu (required, names the arrow half). |
| `variant` | `'default' \| 'primary' \| 'danger'` | `'default'` | Look of both halves: default, primary (solid) or danger. |
| `size` | `'sm' \| 'md'` | `'md'` | Height of both halves: md is 30px (default), sm is 26px. |
| `disabled` | `boolean` | — | Disable both halves. |
| `className` | `string` | — | Extra class name on the root. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { SplitButton } from '@katana-ui/react'

export function SplitButtonUsage() {
  return (
    <SplitButton
      variant="primary"
      labels={{ menu: 'More order types' }}
      onClick={() => {}}
      actions={[
        { key: 'market', label: 'Market', onSelect: () => {} },
        { key: 'stop', label: 'Stop order', onSelect: () => {} },
      ]}
    >
      Buy · Limit
    </SplitButton>
  )
}
```

## States

- 静止：两半拼成一个，中缝一条边（primary 是一条 18% 字色的细线）。
- 按主动作：整组缩到 0.97；箭头那半按下只变色。
- 菜单开着：箭头转 180°，那半停在按下底。
- 没有菜单项：箭头那半灰掉，主按钮照常。
- 禁用：两半都灰。

## Don't

- 菜单里不要放跟主动作无关的东西：那是 DropdownMenu 或工具条的事。
- 不要拿它做不可撤的主动作（全平、全撤）：那些用 HoldToConfirm；拆分按钮按一下就执行。
- 只有一个动作时用 Button。

## Composition

```
SplitButton
  DropdownMenu
    div.k-split
      Button（主动作）
      DropdownMenuTrigger → Button（箭头）
    DropdownMenuContent
      DropdownMenuItem × n（图标、字、DropdownMenuShortcut）
```

## Keyboard

- `Enter / Space`：主按钮上：执行主动作；箭头上：开菜单
- `Alt + ↓`：主按钮上也开菜单（原生拆分按钮的键位）
- `↑ ↓ / Enter / Esc`：菜单里走、选、关（关上后焦点回箭头）
