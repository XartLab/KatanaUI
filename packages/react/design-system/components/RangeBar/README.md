# RangeBar

一条横线从最低到最高，标记指着现价在区间里的位置，两端写最低与最高。用来看当日区间、52 周区间。

## Provide

### RangeBar

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `low / high / value` | `number` | — | 最低、最高、现价。现价在区间外贴边；最高不大于最低时不画标记。 |
| `format` | `(value: number) => string` | — | 数怎么写；不给最多两位小数。 |
| `label` | `string` | — | 读屏名（role=meter），必填。 |
| `lowLabel / highLabel` | `string` | — | 两端数上面的小标题。 |

### rangeShare(low, high, value)

现价在区间里的位置 0 到 1；算不出是 null。

## States

- 现价在区间内：标记停在对应位置，标记按弹簧滑动。
- 现价在区间外：标记贴边。
- 最高不大于最低或数不是有限数：不画标记，只留两端的数。

## Don't

- 不要拿它画没有上下界的量。
- 不要省略 label：它是 role=meter，读屏要名字。

## Composition

```
RangeBar role=meter
  span（最低）
  span（轨道：填充 · 标记）
  span（最高）
```
