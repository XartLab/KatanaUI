# DotMatrix

4px 实、2px 空的方点，铺满一个面：本系统图表的签名，回撤面用它而不用实色。

## Provide

`*` marks a required prop.

### DotMatrix

返回一个 SVG pattern，放进 <svg><defs>，用 fill="url(#id)" 引用。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `id` * | `string` | — | Id of the pattern; it must differ for every chart on the same page. |
| `color` | `string` | `'var(--seq-300)'` | Fill color of the dots. |

### DOT_SIZE / DOT_PITCH

点的边长 4 与点距 6（像素），给要自己算对齐的图表用。

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { DotMatrix } from '@katana-ui/react'

export function DotMatrixUsage() {
  return (
    <svg width={120} height={40} role="img" aria-label="Dot pattern">
      <defs>
        <DotMatrix id="usage-dots" />
      </defs>
      <rect width={120} height={40} fill="url(#usage-dots)" />
    </svg>
  )
}
```

## States

- 静态纹理：4px 实、2px 空；颜色默认取中性，可传 token。

## Don't

- 不要用它代替需要读数的实色块；它只给面（回撤面等）。

## Composition

```
svg
  defs
    DotMatrix
  rect (fill="url(#id)")
```
