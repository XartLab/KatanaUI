# VintageSeries

宏观序列按发布时间（point-in-time）画，避免把后来修订的数当成当时已知（框架第十节的要求）。横轴是统计期，同一期有一串发布值（首次发布、每次修订）：一条实线是「当时已知值」（默认每期的首次发布值；给 asOf 就是截至那一刻已知的最后一次发布，那时还没发布的期不画），一条灰虚线是「最新修订值」，上面一排分段按钮切「当时已知值 / 最新修订值 / 两条都看」。每次发布画一个点（空心是当时已知，灰点是最新，更小的是中间的修订），同一期的点之间连细竖线，线长就是修订幅度；下面一条小图画每期修订了多少（最新 − 首次，涨跌发散阶，没修订过的期不画）。顶上四个读数：修订过的期数、平均绝对修订、平均修订方向（正是后来普遍上修）、最大一次。坐标、网格、十字线与 LCD 读数复用 SeriesExplorer 的那套，键位同它。演示数据是固定种子合成的虚构月度同比，页上与小标都写明。

## Provide

`*` marks a required prop.

### VintageSeries

文字与格式全由 props 传，件不认识任何统计口径。主图高 chartHeight，下面修订小图固定 64px；统计期不超过 72 个时才画发布点，更多只留线与修订竖线。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `observations` | `VintageObservation[]` | — | { period, releases: { at, value, note? }[] }。period 是统计期（毫秒，UTC），at 是这个值发布的时刻；不用排序，件整理（同一期给两次会合并，非有限数丢掉）。 |
| `labels` | `VintageSeriesLabels` | — | 全部文字：读屏名、三个切换项、修订小图名、读数行名、四个读数名、空态。 |
| `formatPeriod / formatAt` | `(ms) => string` | — | 统计期与发布时刻怎么写；时区与语言由调用方定。 |
| `formatValue / formatDelta` | `(number) => string` | — | 值与带正负号的变化怎么写。 |
| `asOf` | `number` | — | 「当时已知」取截至这一刻的最后一次发布；不给取每期首次发布值。「最新修订值」不受它影响（它就是事后看到的）。 |
| `defaultMode` | `'known' \| 'latest' \| 'both'` | `both` | 起始看哪条线。 |
| `chartHeight / badge` | `number / string` | `220` | 主图高（px）；右上小标，如「演示数据」。 |
| `actionLabels / tableLabel / tableHead / source / onExport / onFullscreen` | `ChartViewProps` | — | 同其他图；表格视图每次发布一行（五列：统计期、发布时刻、值、较上次、较首次）。 |

### normalizeVintages / knownAt / knownValue / revisionStats

整理发布值、取某一刻已知的值、统计修订的纯函数；调用方想在别处出同样的数可以直接调。只发布过一次的期修订是 null，不写成 0。

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { VintageSeries, type VintageObservation } from '@katana-ui/react/quant'

const DAY = 86_400_000

// 虚构的 12 个月同比：每期首次发布后有一次修订。
const OBSERVATIONS: VintageObservation[] = Array.from({ length: 12 }, (_, i) => {
  const period = Date.UTC(2025, i + 1, 0)
  const truth = 2.4 + Math.sin(i / 2)
  return {
    period,
    releases: [
      { at: period + 14 * DAY, value: Number((truth + 0.3).toFixed(2)), note: '首次发布' },
      { at: period + 45 * DAY, value: Number(truth.toFixed(2)), note: '第二次修订' },
    ],
  }
})

const pad = (n: number) => String(n).padStart(2, '0')
const month = (at: number) => `${new Date(at).getUTCFullYear()}-${pad(new Date(at).getUTCMonth() + 1)}`
const day = (at: number) => `${month(at)}-${pad(new Date(at).getUTCDate())}`

export function VintageSeriesUsage() {
  return (
    <div style={{ width: '100%', maxWidth: 880 }}>
      <VintageSeries
        observations={OBSERVATIONS}
        labels={{
          chart: '示例：某虚构指标同比，按发布时间',
          mode: '看哪条线',
          known: '当时已知值',
          latest: '最新修订值',
          both: '两条都看',
          revisions: '修订幅度（最新 − 首次）',
          revision: '累计修订',
          notYet: '还没发布',
          stats: { revised: '修订过的期', meanAbs: '平均绝对修订', bias: '平均修订方向', largest: '最大一次' },
          empty: '没有数据',
        }}
        formatPeriod={month}
        formatAt={day}
        formatValue={(value) => `${value.toFixed(2)}%`}
        formatDelta={(delta) => `${delta >= 0 ? '+' : ''}${delta.toFixed(2)}`}
        actionLabels={{ group: '图的操作', table: '表格视图', exportCsv: '导出 CSV', fullscreen: '全屏' }}
        tableLabel="发布值明细表"
        tableHead={['统计期', '发布时刻', '值', '较上次', '较首次']}
        badge="演示数据"
        source="来源 / 演示数据（虚构）"
      />
    </div>
  )
}
```

## States

- 只发布过一次的期：只有一个点，没有修订竖线，修订小图里没有它的柱。
- 给了 asOf：那一刻还没发布的期，「当时已知」线在那里断开，读数里写 labels.notYet。
- 修订小图：最新高于首次是涨色柱、低于是跌色柱，零线以上以下对称不拉伸；没有任何修订时是一条零线。
- 没有数据写 labels.empty。

## Don't

- 不要把「最新修订值」当成当时已知拿去回测或写成当时的判断：那是偷看未来。
- 不要只传最新值：件要的是每次发布的值与发布时刻。
- 不要把演示数据当真实统计。

## Composition

```
VintageSeries
  ToggleGroup（当时已知值 / 最新修订值 / 两条都看）· 小标 · 图右上三件
  dl（四个修订读数）
  role=slider 的图
    主图 svg（网格 · 修订竖线 · 两条线）· 纵轴刻度 · 发布点（HTML 小点）· 十字线 · LcdTooltip
    修订小图 svg（零线 · 柱）
  横轴 · 图例
```

## Keyboard

- `← / →`：逐期走，十字线与读数跟着
- `Shift + ← / →`：一次走三期
- `Home / End`：第一期 / 最后一期
- `Esc`：清掉十字线
