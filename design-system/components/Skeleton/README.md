# Skeleton

等数据的那一块：500ms 内到了什么也不画；超过了出点阵骨架，2s 说「仍在加载」，10s 转琥珀条加重试。不脉冲、不转圈。

## Provide

### Skeleton

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `label` | `string` | — | 读屏读的话（必填）。 |
| `lines` | `number` | — | 画几行。 |
| `rows` | `boolean` | `false` | 撑满面板主体时每行占一个表格行高。 |

### Loading

pending 为真时 children 不挂载；骨架出过的内容用 2px 模糊揭示，没出过的直接出现。只管显示，不管取数。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `texts` | `LoadingTexts` | — | 全部文字（包里不带文字）。 |
| `pending` | `boolean` | — | 在等吗。 |
| `what / source` | `string` | — | caption「加载 <what> · <source>」的两段；source 没有就省。 |
| `lines` | `number` | `3` | 不知道可见高度时画几行。 |
| `fill` | `boolean` | `false` | 撑满父级，行数按容器高度量。 |
| `header` | `ReactNode` | — | 已经知道的真表头，骨架只占它下面。 |
| `onRetry` | `() => void` | — | 给了，10 秒后的琥珀条上才有重试。 |
| `label` | `string` | — | 骨架的读屏名，不给用 texts.skeleton。 |

### LoadingBoundary

Suspense 的写法：等的是 React.lazy 或 use() 的 promise；属性同 Loading，没有 pending、source、header。

### LoadingView

只管画「在等」这一块，计时与量高度不在这里；通常不直接用。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `phase` | `'loading' \| 'slow' \| 'timeout' \| null` | — | 当前这一段；null 什么也不画。 |
| `texts` | `LoadingTexts` | — | 文字。 |
| `rows / measured / fill` | `number / boolean / boolean` | — | 骨架行数；行数是否量出来的；是否撑满。 |

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
