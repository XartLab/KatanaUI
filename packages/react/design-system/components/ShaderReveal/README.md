# ShaderReveal

视图切换时，一层 WebGL 着色器的光带扫过，遮住的那一刻换内容，播完淡去；八种变体（noise、zoom、circle、wipe、luma、planetary、stripes、push）共用一个件。适用持仓、订单、成交这类整块视图的切换；表格里的行刷新不要用。颜色取主题 token，WebGL 不可用或标签页隐藏时退回普通淡入淡出。

## Provide

`*` marks a required prop.

### ShaderReveal

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `children` * | `ReactNode` | — | Content shown after the transition; swapped at the midpoint of the playback. |
| `className` | `string` | — | Extra classes for the wrapper. |
| `duration` | `number` | — | Total length in milliseconds; defaults to the preset of the transition. |
| `onRest` | `() => void` | — | Called once the transition has finished and the new content is in place. |
| `transitionKey` * | `string \| number` | — | When this value changes, the transition plays and `children` replaces the old content. |
| `colors` | `readonly string[]` | — | Up to four colors (CSS colors or var(--token)); read when each transition starts. |
| `variant` | `ShaderRevealVariant` | `'noise'` | Which shader effect plays between the two contents. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { Button, ShaderReveal } from '@katana-ui/react'

export function ShaderRevealUsage() {
  const [view, setView] = useState<'positions' | 'orders'>('positions')
  return (
    <>
      <Button onClick={() => setView(view === 'positions' ? 'orders' : 'positions')}>Switch view</Button>
      <ShaderReveal variant="wipe" transitionKey={view}>
        <div style={{ padding: 16 }}>{view === 'positions' ? 'Positions: 12' : 'Orders: 3 working'}</div>
      </ShaderReveal>
    </>
  )
}
```

## States

- 静止：画布全透明，不画、不占动画帧。
- 播放：transitionKey 一变就播，过半换内容，约 1 秒；播放中 data-transitioning=true。
- 被打断：新的 transitionKey 来了就取消上一次，从头再播。
- WebGL 不可用：旧内容淡出、换内容、新内容淡入，总时长不变。

## Don't

- 不要用在表格行或价格的刷新上：那是 LiveFlash 与 ReadoutFlash 的事。
- 不要在内容要读时反复触发：一次过场约 1 秒，用户切得比它快就取消上一次。
- 不要在动画期间依赖旧内容：换内容发生在过半时刻，之前读到的还是旧的。

## Composition

```
ShaderReveal
  div（内容层，换内容时淡出淡入的是它）
  canvas（aria-hidden，WebGL 光带）
```
