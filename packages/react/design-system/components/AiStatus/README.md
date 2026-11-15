# AiStatus

一行：随状态变的小图标加状态文字（进行中带流光），可带细节与耗时。换状态时图标缩放着换、文字上下滑着换、整行宽度弹簧伸缩。学自 rare-ui。

## Provide

`*` marks a required prop.

### AiStatus

整行是 role=status，状态变了读屏播报。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `state` * | `AiStatusState` | — | The state; the first three are in progress. |
| `label` * | `string` | — | Status text (required, in the UI language); change the string when the state changes. |
| `detail` | `string` | — | Gray detail after the text, such as which source is being read. |
| `elapsed` | `number` | — | Elapsed seconds; shown only for in-progress states, written like "12s" or "1m 05s". |
| `className` | `string` | — | Extra class name on the root. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { AiStatus } from '@katana-ui/react'

export function AiStatusUsage() {
  return <AiStatus state="thinking" label="Thinking" elapsed={12} />
}
```

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
