# ValuationBand

价格线叠估值分位带（PE / PB Band，KATANAview #2395）：每条带 = 当期每股盈利 × 历史分位倍数（默认 10 / 25 / 50 / 75 / 90），最外两档之间一层很淡的面不盖住价格线；带线是中性灰浓度，越近中位越亮，价格线 2px 主墨色；右上读出当前分位与当前倍数。负倍数（亏损期）不进分布，那一段带线断开。坐标、十字线、LCD 读数与表格视图同 QuantileLayers。参照理杏仁、Wind 的 PE Band（只取画法）。

## Provide

`*` marks a required prop.

### ValuationBand

数与文字全由 props 传；颜色只用语义 token，不用涨跌色。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `prices` | `(number \| null)[]` | — | 价格序列。 |
| `multiples` | `(number \| null)[]` | — | 与 prices 同长的估值倍数；负数与空不进分布。 |
| `quantiles` | `number[]` | `[0.1, 0.25, 0.5, 0.75, 0.9]` | 分位档（0..1，从低到高）。 |
| `formatPrice / formatMultiple / formatX` | `function` | — | 价格、倍数、横轴的写法。 |
| `labels` | `ValuationBandLabels` | — | 读屏名、图右上三件、表头、带名、当前分位、空态。 |
| `title / source` | `ReactNode` | — | 标题与来源行。 |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { ValuationBand } from '@katana-ui/react/quant'
import { DEMO_BAND } from '../fundamentals-data'

export function ValuationBandUsage() {
  return (
    <div className="gal-wide" data-gallery-band="main" style={{ maxWidth: 820 }}>
      <ValuationBand
        prices={DEMO_BAND.prices}
        multiples={DEMO_BAND.pe}
        title="示例 · PE Band · 周线 5 年"
        formatPrice={(value) => value.toFixed(2)}
        formatMultiple={(value) => `${value.toFixed(1)}x`}
        formatX={(index) => DEMO_BAND.dates[index] ?? ''}
        labels={{
          chart: '示例：估值带',
          actions: { group: '图表操作', table: '表格视图', exportCsv: '导出 CSV', fullscreen: '全屏' },
          table: '估值带表格',
          x: '日期',
          price: '价格',
          multiple: 'PE',
          band: (q, level) => `P${Math.round(q * 100)}${level === null ? '' : ` · ${level.toFixed(1)}x`}`,
          percentile: (p) => `当前分位 P${Math.round(p * 100)}`,
          empty: '没有可用的倍数（亏损期 PE 为负，不进分布）',
        }}
        source="来源 / 演示数据（虚构公司，固定种子合成；中间一段亏损，带线断开）"
      />
    </div>
  )
}
```

## States

- 默认：价格线、五条带、淡面，右上当前分位。
- 扫读：十字线与 LCD 读数列价格、倍数与各带的价位。
- 亏损期：带线断开，价格线照画。
- 没有可用倍数：空态一行字，不画图。
- 表格视图：同一份数写成表。

## Don't

- 不要用涨跌色画带：带只表示估值档位，不是涨跌。
- 不要把负倍数算进分位。
- 不要让面盖住价格线。

## Composition

```
ValuationBand
  头（标题 · 当前分位读数 · 图右上三件）
  图（淡面 · 带线 · 价格线 · 尾标）
  表格视图 · 来源行
```

## Keyboard

- `Tab`：进图
- `← →`：逐点扫读
- `Shift + ← →`：跳三点
- `Esc`：清除扫读点
