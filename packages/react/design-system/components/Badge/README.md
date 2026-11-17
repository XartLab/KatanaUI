# Badge

品种名后的上标小字（板块、风险标记）：次要文字色，不抢品种名；悬停写全称。

## Provide

`*` marks a required prop.

### BadgeGroup

没有徽标时什么都不画。每个徽标是一个 Tag（sm 档）、role=img，名字是全称，读屏读「科创板：涨跌幅 20%」。风险标记给 tone（warn、danger）。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `items` * | `readonly BadgeItem[]` | — | The badges: label is the one-character mark, text is the full name (accessible name and hover hint), tone colors a risk flag. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { BadgeGroup } from '@katana-ui/react'

export function BadgeUsage() {
  return <BadgeGroup items={[{ id: 'star', label: 'S', text: 'STAR market: 20% daily limit' }]} />
}
```

## States

- Tag 的 sm 档：micro 小字、行高 1、一块 neutral 的浅底，贴在品种名右上；悬停写全称，指针是 help。
- 风险标记：item.tone 给 warn 或 danger，字与底换成状态色。
- 没有徽标：什么都不画（不留空位）。

## Don't

- 不要用它放必须读的信息：它在品种名旁边，是次要的。
- 上标只放一个字：全称写在 text 里（读屏名与悬停）。
- 不要自己再画一种徽标：行内标记用 Tag，品种名后的上标用 BadgeGroup。

## Composition

```
BadgeGroup
  Tag（sm）× n
```
