# Breadcrumb

路径导航：一节一节从左侧轻滑进来（错开 40ms），最后一节是当前页、不是链接；分隔符可换。

## Provide

`*` marks a required prop.

### Breadcrumb

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `items` * | `readonly BreadcrumbItem[]` | — | Steps from the root to the current page; the last one is the current page. |
| `label` * | `string` | — | What screen readers call this navigation (required). |
| `separator` | `ReactNode` | — | Replaces the chevron between steps. |
| `className` | `string` | — | Extra classes for the root element. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { Breadcrumb } from '@katana-ui/react'

export function BreadcrumbUsage() {
  return (
    <Breadcrumb
      label="Location"
      items={[{ label: 'Strategies', href: '#' }, { label: 'Momentum', href: '#' }, { label: 'Backtest 2026-11' }]}
    />
  )
}
```

## States

- 有 href 的节：链接，悬停提亮。
- 没有 href 的中间节：纯文字。
- 最后一节：aria-current="page"，ink 色。

## Don't

- 不要超过五节：太深的路径用折叠或换导航方式。
- 不要拿它当标签页：它只表达位置，不切换并列视图（那是 Tabs）。

## Composition

```
Breadcrumb
  nav
    ol
      li（每节）
        a / span
```
