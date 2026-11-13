# PnlText

盈亏文字：字由调用方格式化好（币种、位数、符号都由调用方定），本件只按方向着色，颜色规则同 ChangeText。

## Provide

### PnlText

其余属性透传给 span。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `value` | `number \| string \| null \| undefined` | — | 只用来定方向；0、空、解析不了的算「平」。 |
| `tone` | `'up' \| 'down' \| 'flat'` | — | 方向不是由 value 的符号推出来时（例：亏损额写成正数）盖掉。 |
| `arrow` | `boolean` | `false` | 文字前加 ▲ / ▼。 |
| `as` | `'span' \| 'strong'` | `'span'` | 渲染成哪个元素。 |

## States

- 盈：pnl-up；亏：pnl-down；零或没有值：不着色。
- 亏损额写成正数时传 tone="down"。

## Don't

- 不要在件里拼币种与位数，由调用方传。
- 不要用颜色以外没有符号或箭头的写法表达盈亏。

## Composition

```
PnlText（内部：ToneText）
```
