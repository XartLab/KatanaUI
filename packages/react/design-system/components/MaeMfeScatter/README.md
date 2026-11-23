# MaeMfeScatter

每笔交易一个点：横轴是持仓期间的最大浮亏（MAE）或最大浮盈（MFE）的大小，纵轴是这笔最终盈亏，赢是圆、亏是方（不只靠颜色），可切百分比与金额。看 MAE：赢单从没亏多深、亏单一路亏穿，止损就能收紧；看 MFE：亏单曾浮盈很多，止盈放得太远。每笔的 MAE、MFE 两套单位由调用方给（件不算，要逐笔行情）；移到点上或方向键走点，读数区写这一笔，底下是赢亏两侧的平均偏移。新做；参照 MultiCharts 的 Strategy Performance Report，演示数据是固定种子合成的。

## Provide

`*` marks a required prop.

### MaeMfeScatter

文字与数值写法全由 props 传。横轴与单位都可受控（axis / unit + 回调），不给用内部状态。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `trades` | `ExcursionTrade[]` | — | { id, pnl, pnlPct, mae, maePct, mfe, mfePct }：金额与百分比（小数）两套都要；mae ≤ 0、mfe ≥ 0，画图取绝对值。 |
| `label` | `string` | — | 整张图的读屏名。 |
| `axis / onAxisChange` | `'mae' \| 'mfe'` | `mae` | 横轴看哪个。 |
| `unit / onUnitChange` | `'amount' \| 'percent'` | `percent` | 金额还是百分比。 |
| `formatAmount / formatPercent` | `(value: number) => string` | — | 两种单位的写法（带不带币种、正负号）。 |
| `labels` | `MaeMfeScatterLabels` | — | 开关、纵轴名、赢亏、平均偏移、空读数的文字。 |
| `actionLabels / tableLabel / tableHead / source / onExport / onFullscreen` | `ChartViewProps` | — | 同其他图：三个图工具的名字、表格视图、来源一行、导出与全屏的回调。 |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { MaeMfeScatter } from '@katana-ui/react/quant'
import { DEMO_EXCURSIONS, money, pct1 } from '../research-data'

export function MaeMfeScatterUsage() {
  return (
    <div className="gal-wide" data-gallery-maemfe="main" style={{ maxWidth: 720 }}>
      <MaeMfeScatter
        trades={DEMO_EXCURSIONS}
        label="示例：140 笔交易的最大浮亏与最终盈亏"
        formatAmount={money}
        formatPercent={pct1}
        labels={{
          axisGroup: '横轴',
          mae: '最大浮亏 MAE',
          mfe: '最大浮盈 MFE',
          unitGroup: '单位',
          amount: '金额',
          percent: '百分比',
          pnl: '最终盈亏',
          win: '盈利',
          loss: '亏损',
          meanWin: '盈利单平均',
          meanLoss: '亏损单平均',
          idle: '移到一个点上，看这一笔',
        }}
        actionLabels={{ group: '图的操作', table: '表格视图', exportCsv: '导出 CSV', fullscreen: '全屏' }}
        tableLabel="MAE / MFE 逐笔表"
        tableHead={['交易', '偏移', '最终盈亏', '结果']}
        source="来源 / 演示数据（固定种子合成，不是回测结果）"
      />
    </div>
  )
}
```

## States

- 默认：横轴 MAE，百分比；赢是圆、亏是方，持平是空心圆。
- 悬停或聚焦后方向键：选中最近的点，白环加粗，读数区写这一笔的盈亏、MAE、MFE（金额与百分比）。
- 切横轴或单位：选中清空，点与刻度重算。
- 某一侧没有单（比如全是赢单）：那一侧的平均偏移不写。

## Don't

- 不要在件里算 MAE / MFE：它要逐笔行情，由回测内核给。
- 不要只靠颜色分赢亏：形状不同，读数里也有数。
- 不要超过几千笔：每笔是一个 SVG 元素，更多的先在调用方聚合。

## Composition

```
MaeMfeScatter
  头（横轴开关 · 单位开关 · 赢亏图例与笔数 · 表格视图/导出/全屏）
  svg role=group（网格 · 零线 · 点）
  读数区（选中那一笔）· 赢亏平均偏移
  来源行
```

## Keyboard

- `Tab`：进图
- `← →`：沿横轴走到上一个 / 下一个点
- `Home / End`：到最左 / 最右的点
- `Esc`：取消选中
