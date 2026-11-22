# DotMatrix

4px 实、2px 空的方点，铺满一个面：本系统图表的签名，回撤面用它而不用实色。

## Provide

`*` marks a required prop.

### DotMatrix

返回一个 SVG pattern，放进 <svg><defs>，用 fill="url(#id)" 引用。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `id` * | `string` | — | Id of the pattern; it must differ for every chart on the same page. |
| `color` | `string` | `'var(--k-heat-3)'` | Fill color of the dots. |

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

- 静态纹理：4px 实、2px 空；颜色默认 --k-heat-3（数据浓度的中间档），可传 token。
- 每张图一个 id：同页两张图共用一个 id 时后一张会读到前一张的颜色。

## Don't

- 不要用它代替需要读数的实色块；它只给面（回撤面等）。
- 不要传写死的颜色值：传 var(--token)，换主题才跟着换。
- 不要改点的大小与点距：4 / 6 是点阵签名，跟 MatrixOrb、Loading 骨架是同一套。

## Composition

```
svg
  defs
    DotMatrix
  rect (fill="url(#id)")
```
