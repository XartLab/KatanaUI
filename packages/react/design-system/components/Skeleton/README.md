# Skeleton

等数据的那一块：500ms 内到了什么也不画；超过了出点阵骨架，2s 说「仍在加载」，10s 转琥珀条加重试。不脉冲、不转圈。

## Provide

`*` marks a required prop.

### Skeleton

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `label` * | `string` | — | What screen readers read (required). |
| `lines` * | `number` | — | How many lines to draw. |
| `rows` | `boolean` | `false` | Fill the panel body with one table row height per line. |

### Loading

pending 为真时 children 不挂载；骨架出过的内容用 2px 模糊揭示，没出过的直接出现。只管显示，不管取数。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `texts` * | `LoadingTexts` | — | All the text (the package ships none). |
| `pending` * | `boolean` | — | Whether we are waiting. |
| `label` | `string` | — | Accessible name of the skeleton; defaults to texts.skeleton. |
| `what` | `string` | — | What is loading, shown in the caption "loading <what> · <source>". |
| `source` | `string \| null` | — | Where it loads from, the second part of the caption; omitted when absent. |
| `lines` | `number` | `3` | How many lines to draw when the visible height is unknown. |
| `fill` | `boolean` | `false` | Fill the parent; the line count is measured from the container height. |
| `header` | `ReactNode` | — | The real header when it is already known; the skeleton only covers what is below it. |
| `onRetry` | `() => void` | — | When given, the amber bar after 10 seconds offers a retry button. |
| `children` * | `ReactNode` | — | The content shown once loading is done. |

### LoadingBoundary

Suspense 的写法：等的是 React.lazy 或 use() 的 promise；属性同 Loading，没有 pending、source、header。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `texts` * | `LoadingTexts` | — | All the text (the package ships none). |
| `label` | `string` | — | Accessible name of the skeleton. |
| `what` | `string` | — | What is loading, shown in the caption. |
| `lines` | `number` | `3` | How many lines to draw when the visible height is unknown. |
| `fill` | `boolean` | `false` | Fill the parent; the line count is measured from the container height. |
| `onRetry` | `() => void` | — | When given, the amber bar after 10 seconds offers a retry button. |
| `children` * | `ReactNode` | — | The content that suspends. |

### LoadingView

只管画「在等」这一块，计时与量高度不在这里；通常不直接用。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `phase` * | `LoadingPhase \| null` | — | The current phase; null draws nothing. |
| `texts` * | `LoadingTexts` | — | All the text. |
| `label` | `string` | — | Accessible name of the skeleton. |
| `what` | `string` | — | What is loading, shown in the caption. |
| `source` | `string \| null` | — | Where it loads from; omitted when absent. |
| `rows` * | `number` | — | Number of skeleton rows. |
| `measured` * | `boolean` | — | The row count was measured (fill mode): each row takes one table row height. |
| `fill` * | `boolean` | — | Fill the parent. |
| `header` | `ReactNode` | — | The real header when it is already known. |
| `areaRef` | `Ref<HTMLDivElement>` | — | Ref to the area whose height is measured. |
| `onRetry` | `() => void` | — | When given, the amber bar offers a retry button. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { Skeleton } from '@katana-ui/react'

export function SkeletonUsage() {
  return <Skeleton label="Loading" lines={3} />
}
```

## States

- 500ms 内：什么也不画。
- 超过 500ms：点阵骨架；2s：说「仍在加载」；10s：琥珀条加重试。
- 数据到了：骨架出过的内容用 2px 模糊揭示，没出过的直接出现。

## Don't

- 不要脉冲、不要转圈。
- 表头与外框已知时保留，骨架只占内容区。

## Composition

```
Loading
  LoadingWait（计时）
    LoadingView
      Led
      Button（重试）
      Skeleton
```

## Keyboard

- `Tab`：10 秒后的重试按钮可聚焦；Enter / Space 触发
