# CrossRates

对 TradingView 的 Forex Cross Rates 与 Forex Heatmap 小组件（KatanaUI #147）：行是基准货币、列是计价货币，每格一对。rates 模式写汇率与下面一行涨跌幅；heatmap 模式按涨跌幅七档上色（与 Treemap 同一套色阶，跟涨跌配色走）、只写涨跌幅，一眼看哪种货币强、哪种弱。对角线画斜线底不写数，缺报价的对写「—」。悬停或聚焦一格，它的行头与列头加亮；方向键在格子间走，Enter 或点击回调这一对。

## Provide

`*` marks a required prop.

### CrossRates

quotes 是 { base, quote, rate, changePct }（changePct 是百分数）；同一对给了几次取最后一次。汇率默认不小于 100 写两位、否则四位，别的位数给 formatRate。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `currencies` * | `readonly string[]` | — | Currency codes in row and column order (USD, EUR, JPY …). |
| `quotes` * | `readonly CrossRateQuote[]` | — | One quote per pair; pairs without a quote draw an em dash. |
| `mode` | `'rates' \| 'heatmap'` | `'rates'` | Rates writes the rate with the change under it; heatmap colors each cell by the change and writes the change. |
| `formatRate` | `(rate: number, base: string, quote: string) => string` | `plainRate` | Writes a rate as text; two decimals from 100 up, else four. |
| `limit` | `number` | `1` | Change in percent where the heatmap color scale ends; changes are cut at plus or minus this into seven steps. |
| `names` | `Readonly<Record<string, string>>` | — | Full names of the currencies, shown as the header tooltip. |
| `onSelect` | `(quote: CrossRateQuote) => void` | — | Called when a cell is clicked or Enter is pressed on it; never for the diagonal. |
| `labels` * | `CrossRatesLabels` | — | Texts for screen readers and the empty state, written by the caller (required). |
| `className` | `string` | — | Extra class name on the root. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { CrossRates } from '@katana-ui/react/quotes'

export function CrossRatesUsage() {
  return (
    <CrossRates
      currencies={['USD', 'EUR', 'JPY']}
      quotes={[
        { base: 'USD', quote: 'EUR', rate: 0.9234, changePct: -0.18 },
        { base: 'USD', quote: 'JPY', rate: 155.2, changePct: 0.42 },
        { base: 'EUR', quote: 'USD', rate: 1.083, changePct: 0.18 },
        { base: 'EUR', quote: 'JPY', rate: 168.08, changePct: 0.6 },
        { base: 'JPY', quote: 'USD', rate: 0.00644, changePct: -0.42 },
        { base: 'JPY', quote: 'EUR', rate: 0.00595, changePct: -0.6 },
      ]}
      mode="heatmap"
      onSelect={() => undefined}
      labels={{ table: 'Currency heatmap', empty: 'Not connected' }}
    />
  )
}
```

## States

- rates：汇率等宽右对齐，涨跌幅上涨跌色。
- heatmap：底色按 colorStep(changePct, limit) 七档，字按底色明暗选黑或白；没有报价的格用中性底。
- 悬停或聚焦：这一格描一圈，行头与列头灰底加亮。
- 没有货币：画 labels.empty。

## Don't

- 不要在件里算交叉汇率：每一对的 rate 与 changePct 由调用方给（各家报价口径不同）。
- 不要只靠颜色读热力：格子里写着涨跌幅。
- 货币多于十种左右时格子会挤，放进能横向滚动的容器（件本身 overflow-x: auto）。

## Composition

```
CrossRates
  table[role=grid]
    thead：角 · th（计价货币）× n
    tbody tr × n：th（基准货币）· td[role=gridcell] × n（汇率 · ChangeText | 涨跌幅）
```

## Keyboard

- `← → ↑ ↓`：在格子间走一格（到边停住）
- `Home / End`：到本行的头 / 尾
- `Ctrl + Home / Ctrl + End`：到整张的第一格 / 最后一格
- `Enter`：回调这一对（对角线与缺报价的格不回调）
