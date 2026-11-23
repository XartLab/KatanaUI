# ProgressiveBlur

叠几层带渐变遮罩的背景模糊，从一边向另一边（或由中心向外）模糊越来越重，盖在滚动列表的边缘，提示「下面还有」。模糊层不挡指针，也不进读屏。适用新闻流、日志、侧栏的边缘；表格要读的行不要被它盖住。

## Provide

`*` marks a required prop.

### ProgressiveBlur

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `blur` | `number` | `DEFAULT_BLUR` | Peak blur radius in pixels, reached by the last layer. |
| `children` | `ReactNode` | — | Optional content rendered above the blur stack. |
| `className` | `string` | — | Extra classes for the wrapper. |
| `direction` | `ProgressiveBlurDirection` | `'bottom'` | Edge the blur grows from. |
| `fadeIn` | `boolean` | `true` | Fade the stack in on mount. |
| `intensity` | `number` | `DEFAULT_INTENSITY` | Opacity applied to every layer, `0` to `1`. |
| `layers` | `number` | `DEFAULT_LAYERS` | Number of stacked layers. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { ProgressiveBlur } from '@katana-ui/react'

export function ProgressiveBlurUsage() {
  return (
    <div style={{ position: 'relative', height: 120, overflow: 'hidden' }}>
      <div style={{ padding: 16 }}>Headline one. Headline two. Headline three. Headline four. Headline five.</div>
      <ProgressiveBlur direction="bottom" blur={12} />
    </div>
  )
}
```

## States

- 挂载：整叠模糊淡入（fadeIn）。
- direction 决定向哪一边变重；radial 由中心向外。

## Don't

- 不要盖在需要点击的内容上：它不挡指针，用户看不清却点得到。
- 层数不要超过 12：每层是一个 backdrop-filter。

## Composition

```
ProgressiveBlur
  div（aria-hidden）
    div × layers（backdrop-filter 加渐变遮罩）
  div（children，可选）
```
