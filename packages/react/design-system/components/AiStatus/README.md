# AiStatus

一行：随状态变的小图标加状态文字（进行中带流光），可带细节与耗时。换状态时图标缩放着换、文字上下滑着换、整行宽度弹簧伸缩。学自 rare-ui。

## Provide

### AiStatus

整行是 role=status，状态变了读屏播报。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `state` | `'thinking' \| 'searching' \| 'writing' \| 'done' \| 'error'` | — | 状态；前三个是进行中。 |
| `label` | `string` | — | 状态文字（必填），状态变了就换这个字符串。 |
| `detail` | `string` | — | 文字后的灰色细节，如正在读哪个来源。 |
| `elapsed` | `number` | — | 已进行的秒数；只在进行中显示，写成「12s」「1m 05s」。 |

## States

- 按 state 换图标与文字；进行中带流光。
- 可带 detail 与耗时 elapsed。
- 换状态时图标缩放、文字上下滑、整行宽度弹簧伸缩。

## Don't

- 没有真实进展时不要显示进行中。

## Composition

```
AiStatus
  span（图标，按 state 换）
  span（文字，按 label 换）
  span（细节）
  span（耗时）
```
