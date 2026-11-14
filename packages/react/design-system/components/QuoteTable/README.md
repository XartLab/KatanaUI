# QuoteTable

上面一排页签（指数、自选、热门……），下面是当前这组的行情表：名称与代码、迷你图、最新价、涨跌幅。由 Tabs 与 Sparkline 组出来。

## Provide

### QuoteTable

页签值可受控（value / onValueChange）也可不受控（defaultValue，默认第一组）。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `groups` | `{ id, label, rows: QuoteRow[] }[]` | — | 每组一个页签；QuoteRow 是 { id, name, symbol?, price, percent?, tone?, spark?, sparkLabel? }。 |
| `columns` | `{ name, trend, price, change }` | — | 表头四列的字。 |
| `empty` | `string` | — | 这一组没有行时写的字。 |
| `label` | `string` | — | 页签条的读屏名。 |
| `onRow` | `(row: QuoteRow) => void` | — | 给了行可点、可聚焦，回车触发。 |

## States

- 默认：第一组页签选中，下面是该组行情表。
- 行可点：悬停提亮，键盘 Tab 到行、Enter 触发。
- 空组：写调用方给的说明，不画表头。
- 没有迷你图数据的行：走势列留空。

## Don't

- 不要在包里写死列名与空态文案，由调用方传。
- 不要把几十个品种塞进一组不分页：这是总览，不是完整自选表。

## Composition

```
QuoteTable
  Tabs
    TabsList > TabsTrigger（一组一个）
    TabsContent
      table（表头 · 行：名称 · Sparkline · 价 · 涨跌幅）
```

## Keyboard

- `← →`：在页签间移动（Radix Tabs）
- `Tab / Enter`：到可点的行、触发
