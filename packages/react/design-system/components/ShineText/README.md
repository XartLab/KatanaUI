# ShineText

一道高光循环扫过文字：背景渐变裁进字形，再平移。AI 在分析、数据在加载这类「进行中」的文字用它；底色默认次要文字色，高光默认主文字色，都可传 token。

## Provide

`*` marks a required prop.

### ShineText

就是一个 span；文字对读屏照常可读。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `baseColor` | `string` | `'var(--ink-300)'` | Text color away from the highlight; any CSS color, defaults to the quiet ink token. |
| `children` * | `string` | — | The text to show. |
| `className` | `string` | — | Extra class names for the root element. |
| `duration` | `number` | `2.5` | Duration of one sweep, in seconds. |
| `repeatDelay` | `number` | `0.6` | Pause between sweeps, in seconds. |
| `shineColor` | `string` | `'var(--ink-100)'` | Color of the sweeping highlight band; defaults to the strong ink token. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { ShineText } from '@katana-ui/react'

export function ShineTextUsage() {
  return <ShineText>Analyzing filings</ShineText>
}
```

## States

- 一直循环：每次扫过 duration 秒，之间停 repeatDelay 秒。

## Don't

- 不要给已经完成的状态用：流光表示「还在进行」，完成了就换成普通文字。

## Composition

```
ShineText
  motion.span（背景渐变裁到字形）
```
