# ExpandableNavbar

一排入口，悬停或点击一个，条的下沿长出一块面板把条撑高；在入口间移动时面板按方向横向交叉淡入，高度跟着内容变。

## Provide

`*` marks a required prop.

### ExpandableNavbar

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `items` * | `readonly ExpandableNavbarItem[]` | — | The entries to show. |
| `label` * | `string` | — | What screen readers call this navigation (required). |
| `openId` | `string \| null` | — | Id of the open panel (controlled); null means closed. |
| `onOpenChange` | `(id: string \| null) => void` | — | Called with the id of the open panel, or null when closed. |
| `openOnHover` | `boolean` | `true` | Open on hover as well as click. |
| `closeDelay` | `number` | `200` | Wait this long in ms after the pointer leaves before closing. |
| `width` | `number \| string` | `640` | Width in px, or any CSS width. |
| `className` | `string` | — | Extra classes for the root element. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { ExpandableNavbar } from '@katana-ui/react'

export function ExpandableNavbarUsage() {
  return (
    <ExpandableNavbar
      label="Workspaces"
      width={420}
      items={[
        { id: 'markets', label: 'Markets', panel: 'Watchlists, heatmaps and the news wire.' },
        { id: 'research', label: 'Research', panel: 'Backtests, factor library and notes.' },
      ]}
    />
  )
}
```

## States

- 关闭：一排入口。
- 打开：面板高度用弹簧撑开。
- 换入口：面板按方向横向交叉淡入，高度过渡到新内容。
- Esc、点外面、焦点移出：收起；指针离开延迟 closeDelay 收起。

## Don't

- 不要在面板里放要填写的表单：指针离开会收起。
- 入口多到一行放不下时不要用它。

## Composition

```
ExpandableNavbar
  nav
    ul > li > button（入口）
    motion.div（高度）
      role=region（面板）
```

## Keyboard

- `Tab`：在入口间走
- `Enter / Space`：开合面板
- `Esc`：收起
