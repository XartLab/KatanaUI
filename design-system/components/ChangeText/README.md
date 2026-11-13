# ChangeText

百分数的涨跌幅文字，写成「+1.23%」；颜色只读 --pnl-up / --pnl-down，根上设 data-updown="cn" 就互换成红涨绿跌；零不着色。

## Provide

### ChangeText

其余属性透传给 span。四舍五入成 0 的小负数也按「平」处理，不带正负号。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `value` | `number` | — | 已经是百分数（1.5 就是 1.5%）。 |
| `digits` | `number` | `2` | 小数位。 |
| `arrow` | `boolean` | `false` | 文字前加 ▲ / ▼（平不加）：方向不只靠颜色。 |

## States

- 涨：带 + 号，颜色取 pnl-up；跌：带 - 号，颜色取 pnl-down。
- 平：舍入到 digits 位后是 0 就不带号、不着色，继承周围的字色。
- 根元素设 data-updown="cn" 时 pnl-up 与 pnl-down 互换（红涨绿跌），件不用改。

## Don't

- 不要自己写 is-up、is-down 类去着色。
- 不要把已经乘过 100 的值再乘一次。
- 没有行情时不要传 0，写 — 。

## Composition

```
ChangeText（内部：ToneText）
```
