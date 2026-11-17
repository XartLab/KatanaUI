# RollingText

里程表式的数字滚动：变了的那几位像里程表一样把中间的数字依次转过去（7 到 9 会看到 8 掠过），涨往上、跌往下，整串闪一下涨色或跌色。转得越远用得越久，最远 300ms。

## Provide

`*` marks a required prop.

### RollingText

旧字只在样式里画，不进文本：复制、读屏拿到的只有当前的完整数字。ramp（并入 SmoothUI rolling-text 的做法）让品种代码这类字母位转过几个中间字再落下，默认 0 不转。stagger（SmoothUI price-flow）让变了的位从个位起一位一位错开；boxed（number-flow）给每一位一格带边的小窗；resize（digit-roll）让位数变了时变了的位淡入，三者默认都关。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `text` * | `string` | — | The whole string to show, including thousands separators and the decimal point. |
| `value` * | `number` | — | The same number as a value, used to decide the direction of the change. |
| `animate` * | `boolean` | — | When false the text is replaced without rolling. |
| `ramp` | `number` | `0` | How many intermediate characters a changed non-digit slot (a letter in a ticker code) rolls through before landing; 0 swaps it directly. |
| `stagger` | `number` | `0` | Milliseconds between changed digits, starting from the last one; 0 rolls them all together. |
| `boxed` | `boolean` | `false` | Draws every character in its own small bordered cell, like a counter. |
| `resize` | `boolean` | `false` | When the number of characters changes (999 to 1,000) fade the changed characters in instead of swapping them. |

### rollSlots

纯函数 (text, from, rolling)：每一位的当前字，和滚出去的旧字。

### rollStrip

纯函数 (char, out, direction, ramp)：一位从旧字转到新字时转轮上经过的字（一行一个）与格数；9 到 0 走一格；不是数字的位默认只走一格，给了 ramp 的字母位会再转过 ramp 个中间字。

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { RollingText } from '@katana-ui/react'

export function RollingTextUsage() {
  return <RollingText text="106,977.40" value={106977.4} animate />
}
```

## States

- 值没变：静止。
- 值变了：变了的那几位滚动，涨往上、跌往下，整串闪一下涨色或跌色。
- stagger：个位先转，十位、百位依次晚一拍。
- resize：位数变了（999 到 1,000），变了的位淡入并从涨跌方向滑一小段。

## Don't

- 值没变时不要滚；价格、盈亏的变化只用它给的一次闪，不再加别的动效。

## Composition

```
RollingText
```
