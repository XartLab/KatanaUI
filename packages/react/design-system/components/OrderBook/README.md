# OrderBook

买卖挂单的阶梯：买卖并列（卖在上买在下，中间一行是最新价与价差）、只看买、只看卖三种模式；档位按 tick 合并（选项由调用方给，合并在 model 里按整数算：买盘向下取整、卖盘向上取整，同档的量十进制精确相加，不会出现 0.30000000000000004）；每行底下一条累计量深度条；底部买卖占比条（买量 /（买 + 卖），保留一位小数，两个数相加恒为 100）；点一行回调 onPriceSelect(价, 买或卖)，下单面板拿去回填价格，件不认下单面板。变了量的档位闪一下涨跌色（共用层 live.ts）。只吃 props，快照与增量由调用方合并好整份传，不连交易所。

## Provide

`*` marks a required prop.

### OrderBook

priceDecimals / sizeDecimals 由调用方按品种给，价格与数量按它换成整数再算。模式与档位都可受控（mode / tick）也可不受控（defaultMode / defaultTick）。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `bids` * | `readonly BookLevel[]` | — | Bid levels in any order; a level with size 0 is treated as gone. |
| `asks` * | `readonly BookLevel[]` | — | Ask levels in any order. |
| `priceDecimals` * | `number` | — | Decimal places of a price, from the instrument's tick size; all price math is done on integers at this scale. |
| `sizeDecimals` * | `number` | — | Decimal places of a size, from the instrument's lot size. |
| `labels` * | `OrderBookLabels` | — | Texts. |
| `tickOptions` | `readonly number[]` | `[]` | Merge ticks to offer (0.1, 0.5, 1, 10); no switch is drawn when empty. |
| `tick` | `number` | — | Selected merge tick (controlled); defaults to the first option, or the smallest price step. |
| `defaultTick` | `number` | — | Uncontrolled: the merge tick at first. |
| `onTickChange` | `(tick: number) => void` | — | Called when the merge tick is switched. |
| `mode` | `OrderBookMode` | — | Selected mode (controlled): both sides, bids only or asks only. |
| `defaultMode` | `OrderBookMode` | `'both'` | Uncontrolled: the mode at first; defaults to both. |
| `onModeChange` | `(mode: OrderBookMode) => void` | — | Called when the mode is switched. |
| `depth` | `number` | `DEFAULT_DEPTH` | Rows per side in both mode (a single-side mode shows twice as many); default 10. |
| `last` | `number` | — | Last traded price, drawn between the ladders; its changed trailing digits flash. |
| `lastTone` | `'up' \| 'down'` | — | Direction of the last move, colors the last price. |
| `onPriceSelect` | `(price: number, side: BookSide) => void` | — | Called with the merged price and the side of the clicked row (the caller decides what order that means); rows are not clickable without it. |
| `formatPrice` | `(price: number) => string` | — | How a price is written; defaults to fixed priceDecimals places. |
| `formatSize` | `(size: number) => string` | — | How a size or cumulative size is written; defaults to fixed sizeDecimals places. |
| `className` | `string` | — | Extra class name on the root. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { OrderBook } from '@katana-ui/react/blocks'

// 演示数据：编出来的，不是行情。
const BIDS = [
  { price: 99.99, size: 1.2 },
  { price: 99.98, size: 0.8 },
  { price: 99.95, size: 2.4 },
  { price: 99.9, size: 3.1 },
]
const ASKS = [
  { price: 100.01, size: 0.9 },
  { price: 100.02, size: 1.6 },
  { price: 100.05, size: 2 },
  { price: 100.1, size: 2.7 },
]

export function OrderBookUsage() {
  return (
    <div style={{ maxWidth: 360 }}>
      <OrderBook
        bids={BIDS}
        asks={ASKS}
        priceDecimals={2}
        sizeDecimals={3}
        tickOptions={[0.01, 0.05, 0.1]}
        depth={4}
        last={100}
        lastTone="up"
        onPriceSelect={(price, side) => console.log(price, side)}
        labels={{
          list: '订单簿',
          modes: { group: '显示模式', both: '买卖', bids: '只看买', asks: '只看卖' },
          tick: '合并档位',
          columns: { price: '价格', size: '数量', total: '累计' },
          bid: '买',
          ask: '卖',
          spread: '价差',
          share: (bid, ask) => `买盘占 ${bid}，卖盘占 ${ask}`,
          empty: '没有档位',
        }}
      />
    </div>
  )
}
```

## States

- 买卖并列：卖盘最远的在上、最优价贴着中间行，买盘最优价紧接在下；每侧 depth 行（默认 10）。
- 只看买 / 只看卖：行数翻倍，中间行贴着那一侧的最优价；底部占比仍只数并列模式能看到的前 depth 行，数不随模式跳。
- 合并档位：切到 0.5 时卖盘价都是 0.5 的整数倍（向上取整），买盘向下取整；行数随之变少。
- 深度条：这一行累计量占显示行里最大累计量的比例，买盘走涨色、卖盘走跌色。
- 占比条：买占比与卖占比各占条宽的一部分，写一位小数；买卖都没有量时不画。
- 没给 onPriceSelect：行不是按钮，不可点。没有任何档位：画 labels.empty。

## Don't

- 不要在件里拼价格字符串或做数量加法：合并、累计、占比都用 model 的整数算法，要换写法传 formatPrice / formatSize。
- 不要把增量一条条塞进来：调用方先合并成当前整簿再传，量为 0 的档就是已经撤光。
- 点价回调只说「点了哪个价、哪一侧」，不要在回调里假设这是买单还是卖单：点卖盘可以是想买（吃单）也可以是想挂卖。

## Composition

```
OrderBook
  ToggleGroup（模式）· ToggleGroup（合并档位）
  列头（价格 | 数量 | 累计）
  卖盘 list：行（深度条 + 价 + 量 + 累计）
  中间行：FlashPrice（最新价）· 价差
  买盘 list：行
  占比条（买 | 卖）
```

## Keyboard

- `Tab`：在模式、档位切换与可点的行之间走
- `Enter / 空格`：点选聚焦的行（回调 onPriceSelect）
