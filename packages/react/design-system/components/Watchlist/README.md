# Watchlist

照 TradingView 右侧自选栏（2026-11-15 实测）：列 Symbol / Last / Chg / Chg%，行首小旗标与字母圆徽标；最新价变动时只有变了的尾数闪涨跌色、约 1 秒落回；点列头排序（升序、降序、回原顺序）。价格怎么写由 formatPrice 定，数与文字由调用方传。

## Provide

### Watchlist

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `rows` | `WatchlistRow[]` | — | { key, code, name?, last, change, changePct, flagged?, logoSrc? }。 |
| `labels` | `WatchlistLabels` | — | { columns: { symbol, last, chg, chgPct }, list, empty, flag(row) }。 |
| `formatPrice` | `(n: number) => string` | `toFixed(2)` | 最新价与涨跌额怎么写；闪色按它写出来的文字比尾数。 |
| `sort / onSortChange` | `WatchlistSort \| null` | — | 排序（受控）；不给就自己记。 |
| `onRow / onFlag` | `callbacks` | — | 点行；点旗标（行 + 新状态）。 |

### changedTail(prev, next)

新旧价格文字从哪一位开始不同：返回 { head, tail }。

### nextSort / sortRows

列头点击的循环与排序，纯函数。

## States

- 最新价变大：变了的尾数起闪涨色；变小闪跌色；约 1 秒落回原色。
- 当前排序列的列头带 ▲ / ▼，th 的 aria-sort 跟着变。
- 旗标：悬停才显示，标上的常亮；没有行画空态。

## Don't

- 不要给整个价格闪色：只有变了的尾数。
- 不要放真实公司标志。

## Composition

```
Watchlist table
  thead：列头按钮 × 4
  tbody tr：旗标 · SymbolMark · 代码 | 最新价（尾数闪色）| 涨跌额 | 涨跌幅
```

## Keyboard

- `Tab / Enter`：列头排序、旗标
