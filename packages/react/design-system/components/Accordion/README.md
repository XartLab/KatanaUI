# Accordion

一组可展开收起的标题与内容；展开时高度从 0 长出来。

## Provide

`*` marks a required prop.

### Accordion

其余属性透传给 UI SDK Accordion。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `type` * | `'single'` | — | One item open at a time. |
| `value` | `string` | — | The open item's value (controlled). |
| `defaultValue` | `string` | — | The open item's value at first (uncontrolled). |
| `onValueChange` | `(value: string) => void` | — | Called with the open item's value; an empty string once it closes. |
| `collapsible` | `boolean` | — | Lets the open item close itself. |

### AccordionItem

其余属性透传给 UI SDK AccordionItem。

### AccordionTrigger / AccordionContent

标题行（带箭头）与展开的内容，透传 UI SDK 同名部件。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `children` | `ReactNode` | — | The heading's content. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@katana-ui/react'

export function AccordionUsage() {
  return (
    <Accordion type="single" collapsible defaultValue="source">
      <AccordionItem value="source">
        <AccordionTrigger>Where does the data come from?</AccordionTrigger>
        <AccordionContent>Public market data; the reason is shown when it is unavailable.</AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
```

## States

- 展开、收起。
- 键盘 ↑ ↓ 在标题间走，Enter 或 Space 展开。

## Don't

- 不要把用户必须读的内容收起来。
- 只有一段可收起时用 Collapsible。
- 标题里不放按钮或链接，整行就是展开的触发。

## Composition

```
Accordion
  AccordionItem
    AccordionTrigger
    AccordionContent
```

## Keyboard

- `Enter / Space`：展开或收起
- `↑ ↓`：在标题之间走
- `Home / End`：跳到首、末标题
