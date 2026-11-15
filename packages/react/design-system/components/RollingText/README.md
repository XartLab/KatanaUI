# RollingText

里程表式的数字滚动：变了的那几位像里程表一样把中间的数字依次转过去（7 到 9 会看到 8 掠过），涨往上、跌往下，整串闪一下涨色或跌色。转得越远用得越久，最远 300ms。

## Provide

`*` marks a required prop.

### RollingText

旧字只在样式里画，不进文本：复制、读屏拿到的只有当前的完整数字。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `text` * | `string` | — | The whole string to show, including thousands separators and the decimal point. |
| `value` * | `number` | — | The same number as a value, used to decide the direction of the change. |
| `animate` * | `boolean` | — | When false the text is replaced without rolling. |

### rollSlots

纯函数 (text, from, rolling)：每一位的当前字，和滚出去的旧字。

### rollStrip

纯函数 (char, out, direction)：一位从旧字转到新字时转轮上经过的字（一行一个）与格数；9 到 0 走一格，不是数字的位只走一格。

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

## Don't

- 值没变时不要滚；价格、盈亏的变化只用它给的一次闪，不再加别的动效。

## Composition

```
RollingText
```
