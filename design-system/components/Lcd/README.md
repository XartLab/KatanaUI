# Lcd

点阵小标签在上、LCD 数字在中、一行灰色小字在下的读数窗；没有数据显示「—」。

## Provide

### Lcd

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `label` | `string` | — | 点阵小标签。 |
| `value` | `string \| null` | — | 读数；没有数据传 null，显示「—」。 |
| `tone` | `'neutral' \| 'up' \| 'down' \| 'accent' \| 'warn'` | `'neutral'` | 数值颜色：中性、涨、跌、当前关注（橙）、警告（琥珀）。 |
| `note` | `string` | — | 数字下面一行 10px 小字（单位、口径）；不放第二个数值。 |
| `inline` | `boolean` | — | 标签与数字排成一行。 |
| `fill` | `boolean` | — | 撑满所在的格子（KPI 行里每格一个）；默认按内容收缩。 |

## States

- 有值：标签在上、数字在中、小字在下。
- 没有数据：数字位置写「—」，不写 0。
- 色调：up、down、accent、warn，或不着色。

## Don't

- 不要在没有数据时写 0。
- 不要在件里写死币种与位数，由调用方传。

## Composition

```
Lcd
```
