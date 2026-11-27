# BorderBeam

沿元素边框跑一圈带拖尾的彗星光，SVG 描边实现；可多束、反向、悬停暂停、屏外暂停，圆角可用像素或连续圆角。适用「等你处理」的卡片：AI 建议待审批、风控告警未确认；处理完关掉（active=false）。

## Provide

`*` marks a required prop.

### BorderBeam

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `active` | `boolean` | `true` | Keep the beams travelling. |
| `beams` | `number` | `DEFAULT_BEAMS` | How many beams ride the border, evenly phase-offset around the loop. |
| `borderWidth` | `number` | `DEFAULT_BORDER_WIDTH` | Thickness of the border ring in pixels. |
| `children` | `ReactNode` | — | Content wrapped by the beam border. |
| `className` | `string` | — | Extra classes for the wrapper. |
| `colorFrom` | `string` | `'var(--accent)'` | Trailing colour of the beam gradient. |
| `colorTo` | `string` | `'color-mix(in oklab, var(--accent) 55%, white)'` | Leading colour of the beam gradient. |
| `delay` | `number` | `DEFAULT_DELAY` | Seconds to wait before the first lap. |
| `duration` | `number` | `DEFAULT_DURATION` | Seconds for one full lap of the border. |
| `pauseOnHover` | `boolean` | `false` | Pause the beams while a fine pointer hovers the element. |
| `radius` | `BorderBeamRadius` | `DEFAULT_RADIUS` | Corner geometry of both the ring and the travel path. |
| `reverse` | `boolean` | `false` | Travel counter-clockwise. |
| `size` | `number` | `DEFAULT_SIZE` | Arc length of each beam, in pixels measured along the border. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { BorderBeam } from '@katana-ui/react'

export function BorderBeamUsage() {
  return (
    <BorderBeam radius={4}>
      <div style={{ padding: 16 }}>AI suggestion awaiting approval</div>
    </BorderBeam>
  )
}
```

## States

- 运行：一圈约 6 秒，beams 束均匀错开。
- active=false：光束隐去，只剩一圈细边。
- 悬停（pauseOnHover）：精细指针下暂停。

## Don't

- 不要同时让几张卡都在跑：谁都在喊就没有谁在被看见。
- 不要用它代替状态文字：它只提示「有待办」，内容要自己写清。

## Composition

```
BorderBeam
  svg（aria-hidden，描边与彗星）
  children
```
