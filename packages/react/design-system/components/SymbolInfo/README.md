# SymbolInfo

一只品种的报价头（对 TradingView 的 Symbol Info 小组件，KatanaUI #147）：徽标、代码、名称与交易所、市场状态灯；大号最新价加单位、带符号的涨跌额与涨跌幅；下面一排区间条（常是当日与 52 周，标记指着最新价，TradingView 右栏的三角画法）。值是数，价格文字由 formatPrice 写，交易所、状态、区间标题都由调用方传。TradingView 页面没写这个小组件有哪些栏，排布照它的品种页页头，待核对。

## Provide

`*` marks a required prop.

### SymbolInfo

ranges 是 { id, title, low, high }，标记都指着 last；status 是 { tone, label }（开市 ok、盘前盘后 warn、休市 off）。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `symbol` * | `string` | — | Symbol code (AAPL, BTCUSDT, 600519). |
| `name` | `string` | — | Full name of the instrument; the code is shown alone when omitted. |
| `exchange` | `string` | — | Venue or exchange text after the name (NASDAQ, SSE), written by the caller. |
| `logoSrc` | `string` | — | Image address of the logo; letters are drawn when omitted or when it fails to load. |
| `last` * | `number` | — | Latest price. |
| `change` * | `number` | — | Change amount since the previous close, signed; decides the up, down or flat color. |
| `changePct` * | `number` | — | Change as a percentage (1.5 means +1.5%). |
| `unit` | `string` | — | Currency or unit after the price (USD, CNY), written by the caller. |
| `formatPrice` | `FormatPrice` | `plainPrice` | Writes a price as text; the caller knows the precision. |
| `status` | `SymbolInfoStatus` | — | Market status light and text; nothing is drawn when omitted. |
| `ranges` | `readonly SymbolInfoRange[]` | — | Ranges drawn below the quote, in order (usually the day range and the 52-week range); the marker points at last. |
| `footer` | `ReactNode` | — | Small line under the ranges (data time, delay note), written by the caller. |
| `live` | `boolean` | `false` | Live data: the price rolls when it changes and the change flashes the up or down color. |
| `label` * | `string` | — | Accessible name of the whole header, written by the caller. |
| `className` | `string` | — | Extra class name on the root. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { SymbolInfo } from '@katana-ui/react/quotes'

export function SymbolInfoUsage() {
  return (
    <div style={{ width: '100%', maxWidth: 480 }}>
      <SymbolInfo
        symbol="AAA"
        name="Alpha Devices"
        exchange="NASDAQ"
        last={212.4}
        change={-1.62}
        changePct={-0.76}
        unit="USD"
        status={{ tone: 'ok', label: 'Market open' }}
        ranges={[
          { id: 'day', title: "Day's range", low: 209.8, high: 215.35 },
          { id: '52w', title: '52 week range', low: 151.2, high: 238.9 },
        ]}
        label="Alpha Devices quote"
      />
    </div>
  )
}
```

## States

- 涨 / 跌 / 平：涨跌额与涨跌幅上涨跌色并带三角，方向由 change 定（没有 change 看 changePct）。
- live：价格变了用 RollingText 滚动，涨跌幅闪一次涨跌色。
- 给了 status：右上角一盏状态灯加文字。
- 给了 ranges：每个区间一条 RangeBar（role=meter），最新价在区间外时标记贴边。
- 名称或交易所过长：省略号截断。

## Don't

- 不要传写好的价格字符串：传数与 formatPrice，品种精度由调用方定。
- 不要只靠颜色表达涨跌：涨跌额带符号与三角。
- 不要在包里写交易所名与状态词：由调用方按界面语言传。

## Composition

```
SymbolInfo section[aria-label]
  div（SymbolMark · 代码 / 名称 · 交易所 · Led 状态）
  div（价 RollingText · 单位 · ToneText 涨跌额 · ChangeText 涨跌幅）
  div（RangeBar × n）
  p（footer）
```
