# GridLoader

3×3 像素点阵的转圈：几何小方块按图案亮起、呼吸（pulse）、依次点亮（stagger）或整图案轮换（sequence），带一点辉光。与 Loading 的分工：Loading 是「等数据时先出骨架」的整块门，GridLoader 是小的、不定长等待指示（按钮里、面板角上、AI 在想）。图案有 15 个常用的，也可传自己的 3×3 矩阵。

## Provide

`*` marks a required prop.

### GridLoader

role=status，label 必填。颜色是任意 CSS 颜色，默认当前文字色。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `label` * | `string` | — | Accessible name, for example "Loading quotes". |
| `pattern` | `GridLoaderPattern \| GridMatrix` | `'border'` | A preset name or your own 3×3 matrix of 0 and 1. |
| `mode` | `'pulse' \| 'stagger' \| 'sequence'` | `'pulse'` | pulse breathes every lit cell, stagger lights them one after another, sequence swaps the whole pattern each beat. |
| `sequence` | `readonly (GridLoaderPattern \| GridMatrix)[]` | — | Patterns the sequence mode steps through. |
| `speed` | `keyof typeof SPEEDS` | `'normal'` | Length of one beat: slow 1500ms, normal 800ms, fast 400ms. |
| `size` | `number` | `24` | Side of the grid in pixels. |
| `gap` | `number` | `2` | Gap between cells in pixels. |
| `color` | `string` | — | Any CSS colour, tokens included; defaults to the current text colour. |
| `rounded` | `boolean` | `false` | Round cells instead of square ones. |
| `still` | `boolean` | `false` | Draw the pattern once, without animation. |
| `className` | `string` | — | Extra class name on the root. |

### GRID_LOADER_PATTERNS

常量：15 个预置图案（3×3 的 0/1 矩阵）。

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { GridLoader } from '@katana-ui/react'

export function GridLoaderUsage() {
  return <GridLoader label="Loading quotes" pattern="border" mode="pulse" size={32} />
}
```

## States

- pulse：亮的格 0.4 到 1 之间呼吸。
- stagger：亮的格按顺序一个一个点亮再灭。
- sequence：每个周期换下一个图案。
- still：只画图案，不动。

## Don't

- 不要用来表示有进度的等待：有进度用 Progress。
- 不要在一屏里放超过三个：同时闪烁抢注意。

## Composition

```
GridLoader
  span（role=status）
    motion.span（一格）
```
