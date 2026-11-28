# ChromaBlurTransition

一道带色散的柔光帘子斜着扫过整块内容，约 1 秒；比光圈更柔、更慢。适合整页或整块视图的切换；颜色取主题 token。

## Provide

`*` marks a required prop.

### ChromaBlurTransition

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `children` * | `ReactNode` | — | Content shown after the transition; swapped at the midpoint of the playback. |
| `className` | `string` | — | Extra classes for the wrapper. |
| `duration` | `number` | — | Total length in milliseconds; defaults to the preset of the transition. |
| `onRest` | `() => void` | — | Called once the transition has finished and the new content is in place. |
| `transitionKey` * | `string \| number` | — | When this value changes, the transition plays and `children` replaces the old content. |
| `colors` | `readonly string[]` | — | Up to four colors (CSS colors or var(--token)); read when each transition starts. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { Button, ChromaBlurTransition } from '@katana-ui/react'

export function ChromaBlurTransitionUsage() {
  const [view, setView] = useState<'positions' | 'orders'>('positions')
  return (
    <>
      <Button onClick={() => setView(view === 'positions' ? 'orders' : 'positions')}>Switch view</Button>
      <ChromaBlurTransition transitionKey={view}>
        <div style={{ padding: 16 }}>{view === 'positions' ? 'Positions: 12' : 'Orders: 3 working'}</div>
      </ChromaBlurTransition>
    </>
  )
}
```

## States

- 静止：不画。
- 播放：约 1.04 秒，过半换内容。
- WebGL 不可用：普通淡入淡出。

## Don't

- 不要用在盘中行情区。
- 不要同时放几个：每个过场件占一个 WebGL 上下文。

## Composition

```
ChromaBlurTransition
  div（内容层）
  canvas（aria-hidden，WebGL）
```
