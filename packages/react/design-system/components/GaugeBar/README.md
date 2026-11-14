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
| `share` * | `number \| null` | — | Position of the number between the minimum and maximum (0 to 1, clamped to the ends); null draws no fill. |
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

## Don't

- 不要用它表达多段或多值：它只标一个数在区间里的位置。
- 不要省掉说明一句：数怎么来的要写在 note 里。

## Composition

```
GaugeBar
  figcaption（label · value · level）
  div（轨道）
    span（填充）
  p（note）
```
