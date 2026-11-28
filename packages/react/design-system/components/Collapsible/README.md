# Collapsible

一个标题行加一块可收起的内容；内容高度从 0 长出来，箭头翻过来。成组、同时只开一项的用 Accordion。

## Provide

`*` marks a required prop.

### Collapsible

其余属性透传给 UI SDK Collapsible。

### CollapsibleTrigger / CollapsibleContent

标题行（带箭头）与展开的内容，透传 UI SDK 同名部件。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `children` | `ReactNode` | — | The heading's content. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@katana-ui/react'

export function CollapsibleUsage() {
  return (
    <Collapsible defaultOpen>
      <CollapsibleTrigger>Advanced parameters</CollapsibleTrigger>
      <CollapsibleContent>Slippage, commission and the rebalance calendar.</CollapsibleContent>
    </Collapsible>
  )
}
```

## States

- 收起、展开。
- 禁用：标题行降到 45% 不透明度，不响应。

## Don't

- 不要把用户必须读的内容收起来。
- 几项并列要互斥展开时用 Accordion。

## Composition

```
Collapsible
  CollapsibleTrigger
  CollapsibleContent
```

## Keyboard

- `Enter / Space`：展开或收起
