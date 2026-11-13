# QuoteCard

一只品种一张卡：名字与代码、最新价（大）、涨跌与涨跌幅、可选的迷你图与底部一行；QuoteStrip 是一排小号的卡，放不下横向滚动。

## Provide

### QuoteCard

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `name / symbol` | `string` | — | 名字与代码。 |
| `price / change / percent` | `string` | — | 已格式化好的价、涨跌额、涨跌幅。 |
| `tone` | `'up' \| 'down' \| 'flat'` | `'flat'` | 涨跌三态。 |
| `spark / sparkLabel` | `number[] / string` | — | 迷你图的数与读屏名；不给 spark 就不画。 |
| `footer` | `ReactNode` | — | 卡下面一行，常放 RangeBar。 |
| `size` | `'md' \| 'sm'` | `'md'` | sm 是 148 宽的小卡，QuoteStrip 里用。 |
| `onSelect` | `() => void` | — | 给了整张卡渲染成一个按钮（悬停提亮、按下缩到 0.98）。 |

### QuoteStrip

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `label` | `string` | — | 读屏名，必填。 |
| `items` | `(QuoteCardProps & { id })[]` | — | 每张卡的属性加一个 id。 |

## States

- 默认：名字、价、涨跌；可带迷你图与底部一行。
- 可点：整张卡是按钮，悬停提亮、按下缩到 0.98、键盘焦点有环。
- 小号（QuoteStrip 里）：148 宽，放不下横向滚动。

## Don't

- 不要在卡里再放可点的子元素：给了 onSelect 整张卡已是按钮。
- 不要把一排卡折行成网格：一排就是横向滚动。

## Composition

```
QuoteCard
  span（名字 · 代码）
  span（价）
  span（三角 · 涨跌 · 涨跌幅）
  Sparkline
  span（footer）
QuoteStrip
  div role=list
    div role=listitem
      QuoteCard size=sm
```

## Keyboard

- `Tab / Enter`：有 onSelect 时到卡上、触发
