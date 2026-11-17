# EstimateBadge

琥珀色描边的小字标记（例如「按 K 线估算」），悬停写规则摘要；字与规则由调用方传。是 Tag 的 warn、描边、md 档。

## Provide

`*` marks a required prop.

### EstimateBadge

就是 <Tag tone="warn" outlined>：caption 500、左右 6px、1px 同色边、圆角 radius-sm。

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

- 只有一种样子：琥珀字、同色描边的小标。
- 悬停：title 写估算依据（浏览器原生提示）。

## Don't

- 不要在精确值上挂估算标记。
- 不要省略 title 里的依据。
- 别的语气的行内标记直接用 Tag，不要拿它改色。

## Composition

```
EstimateBadge
  Tag（warn · outlined · md）
```
