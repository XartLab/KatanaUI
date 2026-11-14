# EstimateBadge

琥珀色描边的小字标记（例如「按 K 线估算」），悬停写规则摘要；字与规则由调用方传。

## Provide

### EstimateBadge

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `label` | `string` | — | 标记上的字。 |
| `title` | `string` | — | 悬停提示。 |

## States

- 只有一种样子：小标，悬停给出估算依据。

## Don't

- 不要在精确值上挂估算标记。
- 不要省略 title 里的依据。

## Composition

```
EstimateBadge
```
