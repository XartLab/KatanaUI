# SdfBlobTransition

圆、扭环、两球相融、放射圆簇与全部叠加五种距离场形状，从中间长大，遮住的那一刻换内容。和 ShaderReveal 共用同一个 WebGL 引擎，形状更柔，适合首页与引导页的切换；盘中视图用更克制的 ShaderReveal 的 wipe。

## Provide

`*` marks a required prop.

### SdfBlobTransition

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `className` | `string` | — | Extra classes for the wrapper. |
| `children` * | `ReactNode` | — | Content shown after the transition; swapped at the midpoint of the playback. |
| `duration` | `number` | — | Total length in milliseconds; defaults to the preset of the transition. |
| `onRest` | `() => void` | — | Called once the transition has finished and the new content is in place. |
| `transitionKey` * | `string \| number` | — | When this value changes, the transition plays and `children` replaces the old content. |
| `colors` | `readonly string[]` | — | Up to four colors (CSS colors or var(--token)); read when each transition starts. |
| `variant` | `SdfBlobVariant` | `'final'` | Shape of the blobs: one circle, a warped ring, two merging blobs, a radial cluster, or all of them. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { Button, SdfBlobTransition } from '@katana-ui/react'

export function SdfBlobTransitionUsage() {
  const [view, setView] = useState<'positions' | 'orders'>('positions')
  return (
    <>
      <Button onClick={() => setView(view === 'positions' ? 'orders' : 'positions')}>Switch view</Button>
      <SdfBlobTransition variant="merge" transitionKey={view}>
        <div style={{ padding: 16 }}>{view === 'positions' ? 'Positions: 12' : 'Orders: 3 working'}</div>
      </SdfBlobTransition>
    </>
  )
}
```

## States

- 静止：不画。
- 播放：约 1.1 秒，过半换内容。
- WebGL 不可用：普通淡入淡出。

## Don't

- 不要用在高频切换的视图上。
- 不要拿它盖住需要立刻读的数据。

## Composition

```
SdfBlobTransition
  div（内容层）
  canvas（aria-hidden，WebGL）
```
