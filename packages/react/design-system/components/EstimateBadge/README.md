# EstimateBadge

琥珀色描边的小字标记（例如「按 K 线估算」），悬停写规则摘要；字与规则由调用方传。

## Provide

`*` marks a required prop.

### EstimateBadge

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `label` * | `string` | — | Text on the badge. |
| `title` | `string` | — | Hover hint. |
| `className` | `string` | — | Extra class name on the badge. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { EstimateBadge } from '@katana-ui/react/blocks'

export function EstimateBadgeUsage() {
  return <EstimateBadge label="Estimated" title="Fills are estimated from closed 1-minute bars." />
}
```

## States

- 只有一种样子：小标，悬停给出估算依据。

## Don't

- 不要在精确值上挂估算标记。
- 不要省略 title 里的依据。

## Composition

```
EstimateBadge
```
