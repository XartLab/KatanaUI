# Loading

加载态的唯一入口：给 pending 等数据，不给 pending 当 Suspense 边界，给 phase 钉在某一段直接画。500ms 内到了什么也不画；超过了出点阵骨架，出了至少留 500ms，2s 说「仍在加载」，10s 转琥珀条加重试。

## Provide

`*` marks a required prop.

### Loading

pending 为真时 children 不挂载；骨架出过的内容用 2px 模糊揭示，没出过的直接出现。只管显示，不管取数。文字全在 labels（LoadingLabels，原 texts）。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `labels` | `LoadingLabels` | — | All the text (the package ships none); required unless the deprecated texts is given. |
| `texts` | `LoadingLabels` | — | Old name kept for one release. |
| `pending` | `boolean` | — | Whether we are waiting for data. |
| `phase` | `LoadingPhase` | — | Pin one phase and draw it at once, without timers and without mounting children (docs, tests, screenshots). |
| `label` | `string` | — | Accessible name of the skeleton; defaults to labels.skeleton. |
| `what` | `string` | — | What is loading, shown in the caption "loading <what> · <source>". |
| `source` | `string \| null` | — | Where it loads from, the second part of the caption; omitted when absent (and always in Suspense mode). |
| `lines` | `number` | — | How many lines to draw when the visible height is unknown. |
| `fill` | `boolean` | — | Fill the parent; the line count is measured from the container height. |
| `header` | `ReactNode` | — | The real header when it is already known; the skeleton only covers what is below it. |
| `onRetry` | `() => void` | — | When given, the amber bar after 10 seconds offers a retry button. |
| `children` | `ReactNode` | — | The content shown once loading is done. |

### LoadingBoundary

@deprecated：等于不给 pending 的 Loading（Suspense 边界），留一个版本。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `fill` | `boolean` | — | Fill the parent; the line count is measured from the container height. |
| `children` | `ReactNode` | — | The content shown once loading is done. |
| `label` | `string` | — | Accessible name of the skeleton; defaults to labels.skeleton. |
| `labels` | `LoadingLabels` | — | All the text (the package ships none); required unless the deprecated texts is given. |
| `texts` | `LoadingLabels` | — | Old name kept for one release. |
| `what` | `string` | — | What is loading, shown in the caption "loading <what> · <source>". |
| `lines` | `number` | — | How many lines to draw when the visible height is unknown. |
| `onRetry` | `() => void` | — | When given, the amber bar after 10 seconds offers a retry button. |

### LoadingView

@deprecated：等于给 phase 的 Loading（只画、不计时），留一个版本。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `phase` * | `LoadingPhase \| null` | — | The current phase; null draws nothing. |
| `labels` | `LoadingLabels` | — | All the text; required unless the deprecated texts is given. |
| `texts` | `LoadingLabels` | — | Old name kept for one release. |
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
import { useState } from 'react'
import { Loading, type LoadingLabels } from '@katana-ui/react'

const LABELS: LoadingLabels = {
  skeleton: 'Loading',
  content: 'content',
  noResponse: 'No response',
  loadingLed: 'Loading',
  retry: 'Retry',
  loading: (name, source) => (source ? `Loading ${name} · ${source}` : `Loading ${name}`),
  slow: (source) => (source ? `Still loading · ${source}` : 'Still loading'),
  timeout: (source) => (source ? `Retry · ${source} silent for 10s` : 'Retry · silent for 10s'),
}

export function LoadingUsage() {
  const [pending, setPending] = useState(true)
  return (
    <>
      <button type="button" onClick={() => setPending((p) => !p)}>
        {pending ? 'Data arrived' : 'Wait again'}
      </button>
      <Loading labels={LABELS} pending={pending} what="limit-up pool" source="local service">
        <p>Data arrived.</p>
      </Loading>
    </>
  )
}
```

## States

- 500ms 内：什么也不画。
- 超过 500ms：caption（亮强调色灯 +「加载 <内容> · <来源>」）加点阵骨架；2s：说「仍在加载」。
- 10s：琥珀条（warn 灯 + 文案 + 重试），骨架留着、降到半透明；没给 onRetry 就没有重试钮。
- 数据到了：骨架出过的内容用 2px 模糊揭示，没出过的直接出现。
- 最短停留：骨架出了至少留 500ms 再交出内容（510ms 到的数据，骨架留到 1000ms）；只管 pending 模式，Suspense 模式没有。

## Don't

- 不要脉冲、不要转圈。
- 表头与外框已知时保留（header），骨架只占内容区。
- 不要再拼 LoadingView / LoadingBoundary：一个 Loading 全包了，按 pending 与 phase 选用法。
- 错误文案每句不超过 12 字，先说怎么办（「点重试」），再说原因。

## Composition

```
Loading
  LoadingWait（计时，内部）
    caption：Led + 文案 / 琥珀条：Led + 文案 + Button（重试）
    Skeleton
```

## Keyboard

- `Tab`：10 秒后的重试按钮可聚焦；Enter / Space 触发
