# AiToolCall

一次工具调用，默认一行：名字、右侧小注、状态环。环是一个会变脸的东西：排队呼吸、运行缺一口并转、成功画对勾、失败画叉。参数与结果展开才看。改自 SmoothUI。

## Provide

`*` marks a required prop.

### AiToolCall

args 与 result 是 ReactNode，原样渲染；都没有时整行不可展开。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `name` * | `string` | — | Tool name, e.g. |
| `labels` * | `AiToolCallLabels` | — | Texts in the UI language (required). |
| `status` | `AiToolCallStatus` | `'pending'` | Lifecycle state of the call. |
| `args` | `ReactNode` | — | Arguments the tool was called with, rendered as given. |
| `result` | `ReactNode` | — | What the tool returned, rendered as given. |
| `summary` | `string` | — | Short right-aligned note such as "3 hits" or "1.2s". |
| `defaultOpen` | `boolean` | `false` | Start expanded. |
| `className` | `string` | — | Extra class name on the root. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { AiToolCall } from '@katana-ui/react'

export function AiToolCallUsage() {
  return (
    <AiToolCall
      name="search_news"
      status="success"
      summary="3 条"
      labels={{
        status: { pending: '排队', running: '运行中', success: '完成', error: '失败' },
        args: '参数',
        result: '结果',
      }}
      args={'{ "query": "600519 下跌" }'}
      result="贵州茅台批发价连续下行"
    />
  )
}
```

## States

- pending 排队：环呼吸。
- running 运行：环缺一口并匀速转。
- success / error：环变绿 / 红并画出对勾 / 叉。

## Don't

- 状态读屏词在 labels.status，必传，别只靠颜色。
- 长结果别塞进 summary，放 result。

## Composition

```
AiToolCall
  button（状态环 + 名字 + 小注 + 箭头）
  div（参数 / 结果，展开时）
```

## Keyboard

- `Enter / Space`：展开或收起详情
