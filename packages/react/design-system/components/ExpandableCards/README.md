# ExpandableCards

横排卡片，点一张它横向撑开、露出右边的详情，其余保持窄卡，再点收回。并排比较几个版本或方案（策略 v1 到 v4）。

## Provide

`*` marks a required prop.

### ExpandableCards

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `cards` * | `readonly ExpandableCard[]` | — | The cards, in order. |
| `label` * | `string` | — | What screen readers call the row of cards (required). |
| `selected` | `string \| null` | — | Id of the open card (controlled); null means none. |
| `onSelect` | `(id: string \| null) => void` | — | Called with the id of the opened card, or null when closed. |
| `collapsedWidth` | `number` | `180` | Width of a closed card in px. |
| `expandedWidth` | `number` | `460` | Width of the open card in px. |
| `height` | `number` | `220` | Height of every card in px. |
| `className` | `string` | — | Extra classes for the root element. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { ExpandableCards } from '@katana-ui/react'

export function ExpandableCardsUsage() {
  return (
    <ExpandableCards
      label="Strategy versions"
      cards={[
        { id: 'v1', title: 'v1', face: 'Sharpe 1.1', detail: 'First version: fixed 20-day lookback.' },
        { id: 'v2', title: 'v2', face: 'Sharpe 1.4', detail: 'Added a volatility filter.' },
      ]}
    />
  )
}
```

## States

- 全部收起：窄卡，只有标题与一行摘要。
- 展开一张：宽度弹开，详情带模糊淡入；点别的卡自动换开。
- 卡多了：横向滚动，点中的卡滚到中间。

## Don't

- 不要放超过一屏的详情：详情区自己滚，但长内容应另开页面。
- 不要放必须同时看见的内容：同时只展开一张。

## Composition

```
ExpandableCards
  div role=group
    motion.div（一张卡）
      h3 > button（标题，整张卡面可点）
      face
      detail（展开时）
```
