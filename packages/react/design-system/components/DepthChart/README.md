# DepthChart

买卖累计量的阶梯面积图：买盘在中间价左边、卖盘在右边，中间价一条虚线分界，买卖价差处留空。可用 rangePct 把横轴限制在中间价上下各 x%（深处的大单不再把图压扁，纵轴跟着重新取整）。悬停读价格、累计量与距中间价的百分比（带符号），读数框贴着光标，靠右时翻到左边；键盘聚焦后左右方向键一档一档走，Esc 清掉。累计量按整数算，档位次序不限。只吃 props。

## Provide

`*` marks a required prop.

### DepthChart

档位与 OrderBook 同一个形状（{ price, size }），同一份数据可以喂两个件。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `bids` * | `readonly BookLevel[]` | — | Bid levels in any order; a level with size 0 is treated as gone. |
| `asks` * | `readonly BookLevel[]` | — | Ask levels in any order. |
| `priceDecimals` * | `number` | — | Decimal places of a price. |
| `sizeDecimals` * | `number` | — | Decimal places of a size. |
| `labels` * | `DepthChartLabels` | — | Texts. |
| `rangePct` | `number \| null` | — | Limit the horizontal domain to this many percent either side of the mid price; all levels when omitted. |
| `height` | `number` | `DEFAULT_HEIGHT` | Plot height in px; default 220. |
| `formatPrice` | `(price: number) => string` | — | How a price is written; defaults to fixed priceDecimals places. |
| `formatSize` | `(size: number) => string` | — | How a size is written; defaults to fixed sizeDecimals places. |
| `className` | `string` | — | Extra class name on the root. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { DepthChart } from '@katana-ui/react/blocks'

// 演示数据：编出来的，不是行情。
const BIDS = [
  { price: 99.99, size: 1.2 },
  { price: 99.97, size: 2.8 },
  { price: 99.93, size: 3.5 },
  { price: 99.85, size: 6 },
  { price: 99.7, size: 9 },
]
const ASKS = [
  { price: 100.01, size: 0.9 },
  { price: 100.04, size: 2.1 },
  { price: 100.09, size: 3.8 },
  { price: 100.18, size: 5.2 },
  { price: 100.3, size: 8 },
]

export function DepthChartUsage() {
  return (
    <div style={{ maxWidth: 480 }}>
      <DepthChart
        bids={BIDS}
        asks={ASKS}
        priceDecimals={2}
        sizeDecimals={3}
        rangePct={0.3}
        height={180}
        labels={{
          chart: '深度图',
          bid: '买盘',
          ask: '卖盘',
          mid: '中间价',
          total: '累计量',
          offset: '距中间价',
          empty: '没有档位',
        }}
      />
    </div>
  )
}
```

## States

- 默认：横轴是最远买价到最远卖价，纵轴取到刚好放下最大累计量的整齐刻度。
- rangePct：横轴限制在中间价 ±x%，范围外的档不画，纵轴最大值按范围内的重算。
- 悬停 / 方向键：十字线、曲线上的圆点与读数框（价格、累计量、距中间价）；读屏从 role=status 读同一句。
- 只有一侧或一档：横轴留一点宽度，不会宽为 0；一侧都没有写 labels.empty。

## Don't

- 不要在件外把档位累加成累计量再传：传原始档位，累计在 model 里按整数算。
- 不要用它读精确的下单价：读数落在鼠标位置的价上，要点价下单用 OrderBook 的 onPriceSelect。
- rangePct 要选合理：太小买卖两侧都画不出来，写 labels.empty 之外不会补假数据。

## Composition

```
DepthChart
  plot（role=group，可聚焦）
    svg：网格 · 买卖面积与描边 · 中间价虚线
    纵轴刻度 · 中间价标注
    十字线 · 圆点 · LcdTooltip（读数）
  横轴价格
  role=status 读数（视觉隐藏）
```

## Keyboard

- `← →`：读数在档位价上一档一档走（先聚焦图）
- `Esc`：清掉读数
