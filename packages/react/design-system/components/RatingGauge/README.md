# RatingGauge

半圆分五段（强烈卖出到强烈买入），一根指针转到分数那一段，圆心下面写档位词，下面可再放卖出 / 中性 / 买入各几个。

## Provide

### RatingGauge

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `score` | `number` | — | −1（强烈卖出）到 +1（强烈买入），平分五段；越界夹到边，不是有限数当 0。 |
| `zones` | `[string × 5]` | — | 五段的名字，从卖到买，档位词也取自这里。 |
| `label` | `string` | — | 读屏名，必填。 |
| `children` | `ReactNode` | — | 档位词下面再写点什么（个数统计）。 |

### ratingZone(score) / ratingAngle(score)

落在第几段（0 到 4）；指针转角（度，−90 到 +90）。

## States

- 五段之一高亮，其余淡显；指针用 gentle 弹簧转到分数。
- 分数越界夹到边，不是有限数当 0（中性）。
- 可在档位词下放个数统计。

## Don't

- 不要在包里决定评级怎么算：分数与五个档位名由调用方传。
- 不要把中间一段当没有信号：中性是一个有效档位。

## Composition

```
RatingGauge
  svg（五段弧 · 指针 · 圆心）
  figcaption（档位词）
  div（children）
```
