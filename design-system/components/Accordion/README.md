# Accordion

一组可展开收起的标题与内容；展开时高度从 0 长出来。

## Provide

### Accordion

其余属性透传给 Radix Accordion.Root。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `type` | `'single' \| 'multiple'` | — | 同时能展开一项还是多项（必填）。 |
| `collapsible` | `boolean` | — | single 时能不能把唯一展开的那项也收起。 |
| `defaultValue / value` | `string \| string[]` | — | 展开的项。 |

### AccordionItem

其余属性透传给 Radix Accordion.Item。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `value` | `string` | — | 这一项的值。 |

### AccordionTrigger / AccordionContent

标题行（带箭头）与展开的内容，透传 Radix 同名部件。

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
