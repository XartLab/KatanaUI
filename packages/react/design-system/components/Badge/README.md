# Badge

品种名后的上标小字（板块、风险标记）：次要文字色，不抢品种名；悬停写全称。

## Provide

`*` marks a required prop.

### BadgeGroup

没有徽标时什么都不画。每个徽标是一个 role=img，名字是全称，读屏读「科创板：涨跌幅 20%」。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `items` * | `readonly BadgeItem[]` | — | The badges: label is the one-character mark, text is the full name (accessible name and hover hint). |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { BadgeGroup } from '@katana-ui/react'

export function BadgeUsage() {
  return <BadgeGroup items={[{ id: 'star', label: 'S', text: 'STAR market: 20% daily limit' }]} />
}
```

## States

- 次要文字色的上标小字；悬停写全称。

## Don't

- 不要用它放必须读的信息：它在品种名旁边，是次要的。

## Composition

```
BadgeGroup
```
