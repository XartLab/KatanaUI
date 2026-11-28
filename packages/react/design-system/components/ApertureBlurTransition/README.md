# ApertureBlurTransition

一圈光从中心像光圈一样扩开，带细微的边缘起伏与颗粒，约 0.76 秒，是几个着色器过场里最短的。适合对话框式的内容整体换一页；颜色取主题 token。

## Provide

`*` marks a required prop.

### ApertureBlurTransition

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
import { ApertureBlurTransition, Button } from '@katana-ui/react'

export function ApertureBlurTransitionUsage() {
  const [view, setView] = useState<'positions' | 'orders'>('positions')
  return (
    <>
      <Button onClick={() => setView(view === 'positions' ? 'orders' : 'positions')}>Switch view</Button>
      <ApertureBlurTransition transitionKey={view}>
        <div style={{ padding: 16 }}>{view === 'positions' ? 'Positions: 12' : 'Orders: 3 working'}</div>
      </ApertureBlurTransition>
    </>
  )
}
```

## States

- 静止：不画。
- 播放：约 0.76 秒，进度到 0.48 换内容。
- WebGL 不可用：普通淡入淡出。

## Don't

- 不要用在盘中行情区。
- 不要同时放几个：每个过场件占一个 WebGL 上下文，浏览器对上下文数有上限。

## Composition

```
ApertureBlurTransition
  div（内容层）
  canvas（aria-hidden，WebGL）
```
