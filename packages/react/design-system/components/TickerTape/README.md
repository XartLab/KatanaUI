# TickerTape

一排品种（徽标 + 代码 + 最新价 + 涨跌幅，可带走势）横向无缝循环滚动：同一排画两遍、CSS 动画平移 -50%，速度按每秒像素算（默认 40）。悬停、聚焦或按右端暂停钮停住；点一项联动。系统「减少动态效果」或 mode="static" 时不动、可横向滚动。布局照 TradingView Ticker Tape 小组件。

## Provide

`*` marks a required prop.

### TickerTape

items 是 QuoteRow 加 logo / currency / series；价格文字由 formatPrice 写（可拿到这一项按品种定位数）。labels 必填：整条的读屏名、暂停与继续两种字，trend 给了才画走势。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `items` * | `readonly TickerItem[]` | — | The symbols, in order. |
| `labels` * | `TickerTapeLabels` | — | All text: region name, pause and resume, trend names. |
| `formatPrice` | `FormatPrice \| ((value: number, item: TickerItem) => string)` | — | Price text; the caller knows each symbol's precision. |
| `layout` | `'stacked' \| 'inline'` | `'stacked'` | stacked: two lines per item with an optional trend (TradingView's current tape); inline: one compact line. |
| `mode` | `'scroll' \| 'static'` | `'scroll'` | scroll (default) loops; static stands still and scrolls by hand. |
| `speed` | `number` | `40` | Scroll speed in pixels per second; default 40. |
| `paused` | `boolean` | — | Paused from outside (controlled); the pause button then calls onPausedChange. |
| `onPausedChange` | `(paused: boolean) => void` | — | Called when the pause button is pressed. |
| `onSelect` | `(item: TickerItem) => void` | — | Clicking an item (link to a chart, a watchlist); items become buttons when given. |
| `className` | `string` | — | Extra class name on the root. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { TickerTape, type TickerItem } from '@katana-ui/react/quotes'

// 演示数据（固定，不是行情）：走势是写死的几段。
export const TICKER_ITEMS: readonly TickerItem[] = [
  {
    id: 'spx',
    symbol: 'SPX500',
    last: 7355.1,
    change: 8.1,
    changePct: 0.11,
    currency: 'USD',
    series: [7310, 7322, 7318, 7340, 7336, 7355],
  },
  {
    id: 'ndx',
    symbol: 'NAS100',
    last: 27154.5,
    change: 110.8,
    changePct: 0.41,
    currency: 'USD',
    series: [26990, 27050, 27010, 27100, 27120, 27154],
  },
  {
    id: 'dji',
    symbol: 'US30',
    last: 50689.7,
    change: -76.1,
    changePct: -0.15,
    currency: 'USD',
    series: [50800, 50760, 50790, 50720, 50700, 50690],
  },
  {
    id: 'eur',
    symbol: 'EURUSD',
    last: 1.09679,
    change: -0.003,
    changePct: -0.27,
    series: [1.0998, 1.099, 1.0985, 1.0978, 1.0972, 1.0968],
  },
  {
    id: 'btc',
    symbol: 'BTCUSD',
    last: 63978,
    change: -902,
    changePct: -1.39,
    currency: 'USD',
    series: [64900, 64700, 64800, 64300, 64100, 63978],
  },
  {
    id: 'eth',
    symbol: 'ETHUSD',
    last: 1794.6,
    change: -27.9,
    changePct: -1.53,
    currency: 'USD',
    series: [1822, 1815, 1818, 1805, 1799, 1794.6],
  },
]

const DIGITS: Readonly<Record<string, number>> = { EURUSD: 5, BTCUSD: 0 }

export function TickerTapeUsage({ paused }: { paused?: boolean }) {
  const [picked, setPicked] = useState<string>('')
  return (
    <div style={{ width: 720, display: 'grid', gap: 8 }} data-gallery-ticker data-picked={picked}>
      <TickerTape
        items={TICKER_ITEMS}
        labels={{
          region: '行情跑马灯',
          pause: '暂停滚动',
          resume: '继续滚动',
          trend: (item) => `${item.symbol} 近期走势`,
        }}
        formatPrice={(value, item) =>
          value.toLocaleString('en-US', {
            minimumFractionDigits: DIGITS[item.symbol] ?? 1,
            maximumFractionDigits: DIGITS[item.symbol] ?? 1,
          })
        }
        paused={paused}
        onSelect={(item) => setPicked(item.symbol)}
      />
      <TickerTape
        items={TICKER_ITEMS}
        layout="inline"
        mode="static"
        labels={{ region: '行情条（不滚动）', pause: '暂停滚动', resume: '继续滚动' }}
      />
    </div>
  )
}
```

## States

- 滚动（scroll）：整条匀速左移，循环接缝看不出；第二遍 aria-hidden + inert。
- 停住：指针在条上、焦点在条里或按了暂停钮；暂停钮换成「继续」。
- 静止（static，或系统减少动态效果）：只画一遍，没有暂停钮，条可以横向滚动（键盘可聚焦）。
- 某项悬停：底色提到 surface-raised。价变了只闪变了的尾数（FlashPrice）。

## Don't

- 不要去掉暂停钮：自动动、超过 5 秒、跟别的内容并排就要能停（WCAG 2.2.2）。
- 不要用颜色以外没有符号的方式表达涨跌：涨跌幅带 + / − 号。
- 不要放几十项：一遍超过三四屏宽时用 Watchlist。

## Composition

```
TickerTape（section）
  滚动区
    轨道（两遍）
      项（button 或 span）：SymbolMark · 代码 · FlashPrice · 币种 · ChangeText · Sparkline
  暂停 / 继续钮
```

## Keyboard

- `Tab`：走到各项（只走第一遍）与暂停钮；焦点在条里时停住
- `Enter / Space`：选这一项（给了 onSelect）；在暂停钮上切暂停 / 继续
- `← / →`：静止时滚动区有焦点，横向滚
