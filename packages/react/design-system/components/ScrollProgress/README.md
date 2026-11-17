# ScrollProgress

读长文（研报、新闻正文、策略报告）时指示读到哪了：条、环、数字、分段四种；值经弹簧平滑，不跟着滚轮的颗粒抖。自己读滚动位置（窗口，或 container 指定的滚动容器），不用传值。与 Progress 的分工：Progress 是受控的任务进度，这个读滚动。

## Provide

`*` marks a required prop.

### ScrollProgress

role=progressbar，aria-valuenow 是百分比；label 必填。position=top 或 bottom 时是 sticky，钉在滚动容器的边上。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `label` * | `string` | — | Accessible name, for example "Reading progress". |
| `variant` | `'bar' \| 'ring' \| 'number' \| 'segments'` | `'bar'` | How the progress is drawn. |
| `container` | `RefObject<HTMLElement \| null>` | — | Scroll container to follow; the window when omitted. |
| `position` | `'top' \| 'bottom' \| 'inline'` | `'top'` | sticky pins it to the top or bottom edge of its scroll container; inline leaves it where you put it. |
| `thickness` | `number` | `4` | Bar height, ring and segment stroke, in pixels. |
| `color` | `string` | `'var(--accent)'` | Any CSS colour; defaults to the accent. |
| `size` | `number` | `56` | Diameter of the ring in pixels. |
| `segments` | `number` | `8` | Number of pills in the segments variant. |
| `showValue` | `boolean` | `false` | Print the percentage next to or inside the indicator. |
| `smooth` | `boolean` | `true` | Spring-smooth the value. |
| `className` | `string` | — | Extra class name on the root. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { useRef } from 'react'
import { ScrollProgress } from '@katana-ui/react'

export function ScrollProgressUsage() {
  const box = useRef<HTMLDivElement>(null)
  return (
    <div ref={box} style={{ height: 120, overflow: 'auto' }}>
      <ScrollProgress label="Reading progress" container={box} />
      <div style={{ height: 600 }}>Long report body</div>
    </div>
  )
}
```

## States

- bar：顶边一条，前端带亮头。
- ring：圆环，showValue 时中间写百分比。
- number：只有大数字。
- segments：一排胶囊依次填满。

## Don't

- 不要用它表示任务进度：那是 Progress 的事。
- 不要在内容短到不滚动的页面放：它永远是 0。

## Composition

```
ScrollProgress
  div（role=progressbar）
    motion.div / svg / span / 胶囊
```
