# MiniKCardGrid

选股结果的卡片网格：一行 2 / 3 / 4 只（columns，默认 3；容器放不下时每张最少 140px，自动少排几列），每张卡是名称与代码、一个小 K 线（包里自带的轻量 SVG 蜡烛，实体加影线、涨红跌绿只用语义色调跟 data-updown）、最新价与涨跌幅。蜡烛、最新价、涨跌幅都由调用方给（涨跌幅不给就用最后两根收盘算，最新价不给取最后一根收盘），取不到写「—」；没有蜡烛写「暂无 K 线」。给了 onSelect 卡片是按钮。

## Provide

`*` marks a required prop.

### MiniKCardGrid

渲染一个 ul；每张卡一个 li。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `items` * | `readonly MiniKItem[]` | — | The picked stocks, in display order. |
| `columns` | `2 \| 3 \| 4` | `3` | Cards per row: 2, 3 or 4; 3 by default. |
| `onSelect` | `(item: MiniKItem) => void` | — | Called when a card is picked; without it the cards are plain. |
| `digits` | `number` | `2` | Price digits; 2 by default. |
| `labels` | `MiniKCardLabels` | `cnLabelsZh.miniK` | Text pack; the Simplified Chinese default is used when omitted. |
| `className` | `string` | — | Extra class names. |

### MiniKItem

一只票：code、name、candles（从旧到新），可选 price 与 change（百分数）。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `code` * | `string` | — | Stock code, unique within the grid. |
| `name` * | `string` | — | Stock name. |
| `candles` * | `readonly Candle[]` | — | Recent candles from oldest to newest; none writes a no-candles line. |
| `price` | `number \| null` | — | Latest price; the last close when omitted. |
| `change` | `number \| null` | — | Change in percent; computed from the last two closes when omitted. |

### Candle

一根蜡烛：open、high、low、close，可选 time。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `open` * | `number` | — | Opening price. |
| `high` * | `number` | — | Highest price. |
| `low` * | `number` | — | Lowest price. |
| `close` * | `number` | — | Closing price. |
| `time` | `string` | — | Date or time of the candle, for readers only. |

### candleShapes(candles, width, height, gap)

纯函数：蜡烛排进框里的几何（影线、实体、方向）；一根不画返回 null。

### candleDomain(candles)

纯函数：价格区间，上下各留 6%。

### candleTone(candle)

纯函数：收高于开 up、低于开 down、相等 flat。

### validCandles(candles)

纯函数：丢掉有取不到的数、或最高价低于最低价的蜡烛。

### lastChange(candles)

纯函数：最后一根相对前一根收盘的涨跌幅（百分数）；不够两根是 null。

### changeText(change)

纯函数：「+3.21%」「-1.05%」；取不到写「—」。

### gridColumns(columns)

纯函数：只认 2、3、4，别的取最近的合法值。

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { MiniKCardGrid } from '@katana-ui/react/cn'

const rise = (start: number) =>
  Array.from({ length: 12 }, (_, i) => {
    const open = start + i * 0.3
    return { open, high: open + 0.5, low: open - 0.2, close: open + (i % 3 === 2 ? -0.1 : 0.35) }
  })

export function MiniKCardGridUsage() {
  return (
    <MiniKCardGrid
      columns={3}
      items={[
        { code: '600101', name: 'Example A', candles: rise(12) },
        { code: '600102', name: 'Example B', candles: rise(20).reverse() },
        { code: '000103', name: 'Example C', candles: rise(8) },
      ]}
      onSelect={() => {}}
      labels={{
        region: 'Picked stocks',
        card: (name, code, change) => `${name} ${code}, ${change}`,
        chart: (count) => `Last ${count} candles`,
        noCandles: 'No candles',
        empty: 'Nothing picked',
        unavailable: 'Not available',
      }}
    />
  )
}
```

## States

- 默认：一行 3 只；columns 取 2 或 4 改一行几只，窄容器自动少排几列。
- 涨跌幅为正取涨色、为负取跌色（跟 data-updown），零或取不到是中性灰。
- 没有蜡烛：卡里写「暂无 K 线」，价格与涨跌幅写「—」。
- 给了 onSelect：卡片是按钮，可 Tab、Enter。
- 没有票：写一行空态文字。

## Don't

- 不要在卡里加指标线或成交量：这是缩略图，细看交给完整图表。
- 不要传色值：蜡烛的涨跌只靠语义色调。
- 不要在包里取行情：蜡烛由调用方给。

## Composition

```
MiniKCardGrid
  ul
    li · 卡（名称 · 代码 | 小 K 线 svg | 最新价 · 涨跌幅）
```

## Keyboard

- `Tab`：到下一张卡（给了 onSelect 时）
- `Enter / Space`：选中这张卡
