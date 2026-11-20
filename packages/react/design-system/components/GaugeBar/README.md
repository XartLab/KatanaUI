# GaugeBar

上面一行名字、数和档位词，中间一条进度条标出数的位置，下面一句说明数是怎么来的。取不到时不画填充，数那里写原因。从应用的分析视图提来。

## Provide

`*` marks a required prop.

### GaugeBar

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `label` * | `ReactNode` | — | The name. |
| `value` * | `ReactNode` | — | The already formatted number. |
| `unavailable` | `boolean` | — | The number could not be fetched: write the reason where the number goes, in a muted color. |
| `share` | `number \| null` | `null` | Position of the number between the minimum and maximum (0 to 1, clamped to the ends); null draws no fill. |
| `segments` | `readonly GaugeSegment[]` | — | Multi-segment proportion bar (up · flat · down; limit-up · broken · limit-down): the track is split by the segment values and the labels are written under it. |
| `level` | `ReactNode` | — | The level word (a whole node supplied by the caller, often a badge). |
| `note` | `ReactNode` | — | A line of explanation underneath. |
| `classes` | `GaugeBarClasses` | `{}` | Extra class names per part, written after the package ones. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { GaugeBar } from '@katana-ui/react'

export function GaugeBarUsage() {
  return <GaugeBar label="Ratio" value="72.00%" share={0.72} level="Hot" note="a / (a + b)" />
}
```

## States

- 有位置：填充占轨道的 share，宽度按 snappy 弹簧变。
- 取不到（share 为 null）：不画填充，数换成弱色小字并写原因。
- 越界的 share 按边画。
- 分段（给了 segments）：轨道按各段的量切成色块（色调只有 up / down / muted / accent），段间 1px 缝，标签（含家数）写在条下面；不看 share。

## Don't

- 不要用单段的 share 表达多值：多值给 segments。
- 不要省掉说明一句：数怎么来的要写在 note 里。
- 不要给 segments 传色值：只选色调名。

## Composition

```
GaugeBar
  figcaption（label · value · level）
  div（轨道）
    span（填充）| span × n（分段）
  ul（分段标签）
  p（note）
```
