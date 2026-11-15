# Accordion

一组可展开收起的标题与内容；展开时高度从 0 长出来。

## Provide

`*` marks a required prop.

### Accordion

其余属性透传给 Radix Accordion.Root。

### AccordionItem

其余属性透传给 Radix Accordion.Item。

### AccordionTrigger / AccordionContent

标题行（带箭头）与展开的内容，透传 Radix 同名部件。

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
