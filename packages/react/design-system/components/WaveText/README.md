# WaveText

每个字依次上下起伏，一道波在文字里循环走，表示「正在实时」。起伏高度、一个周期的时长、字与字的间隔都可调。

## Provide

`*` marks a required prop.

### WaveText

整句放在 sr-only，逐字是 aria-hidden。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `amplitude` | `number` | `8` | How far a character rises above its baseline, in pixels. |
| `children` * | `string` | — | The text to show. |
| `className` | `string` | — | Extra class names for the root element. |
| `duration` | `number` | `1.2` | Duration of one wave cycle for a character, in seconds. |
| `staggerDelay` | `number` | `0.05` | Delay between one character and the next, in seconds. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { WaveText } from '@katana-ui/react'

export function WaveTextUsage() {
  return <WaveText>Live market</WaveText>
}
```

## States

- 一直循环，没有静止态。

## Don't

- 不要放在密集的表格里：一整屏的字都在起伏会盖过数据本身。

## Composition

```
WaveText
  span.sr-only
  motion.span（一个字，aria-hidden）
```
