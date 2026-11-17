# Skeleton

骨架条本身：12 高的点阵圆角条（bg-200 底、line-200 边），第一行 40%、最后一行 70%、中间满宽；不脉冲、不转圈。什么时候出、出多久由 Loading 管。

## Provide

`*` marks a required prop.

### Skeleton

role=status、aria-busy；读屏读 label（必填）。rows 为真时每行占一个表格行高（--row-base），撑满面板主体用；一般经 Loading 用，不单摆。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `label` * | `string` | — | What screen readers read (required). |
| `lines` * | `number` | — | How many lines to draw. |
| `rows` | `boolean` | `false` | Fill the panel body with one table row height per line. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { Skeleton } from '@katana-ui/react'

export function SkeletonUsage() {
  return <Skeleton label="Loading" lines={3} />
}
```

## States

- lines 行：第一行 40%、最后一行 70%、中间满宽；只有一行时 70%。
- rows：每行占一个表格行高，行数由 Loading 量。

## Don't

- 不要脉冲、不要转圈。
- 不要自己判断什么时候摆它：500ms 延迟与 2s / 10s 两段在 Loading 里。

## Composition

```
Skeleton（role=status）
  span.sr-only（label）
  span.k-loading-line × lines
```
