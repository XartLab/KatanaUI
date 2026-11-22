# PeriodReturnsTable

年 × 月的收益热力表，可切季与周，行尾是年度合计。调用方给细粒度的收益样本（日收益或逐笔），件按周期复利聚合（时区由调用方给，周按 ISO 周）。色阶是涨跌发散色，两端是发散色 token、零附近中性灰，没有彩虹色阶；涨跌色只给年度合计与读数的字。周视图格子窄，数字收进读数区与 title。日历热力图（CalendarHeatmap）是按日的月历格，没有年度合计也不聚合，所以这里新做一件，色用同一套发散 token。

## Provide

`*` marks a required prop.

### PeriodReturnsTable

文字与数值写法全由 props 传；周期可受控。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `samples` | `{ time, value }[]` | — | time 毫秒时刻，value 小数收益；件把同一周期的样本复利。 |
| `unit / onUnitChange` | `'month' \| 'quarter' \| 'week'` | `month` | 周期。 |
| `utcOffsetMinutes` | `number` | `0` | 时区相对 UTC 的分钟数（东八区 480）；决定样本落进哪个月。 |
| `formatPercent / formatPeriod` | `function` | — | 收益的写法、读数里一格的名字（如「2026 年 3 月」）。 |
| `scaleLimit` | `number` | — | 着色上限（绝对值，小数）；不给取表里最大格。固定它几张表可用同一把尺。 |
| `labels` | `PeriodReturnsLabels` | — | 开关、列头（月名、季名、第几周）、全年、空态的文字。 |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { PeriodReturnsTable, type PeriodUnit } from '@katana-ui/react/quant'
import { DEMO_RETURNS, pct2 } from '../research-data'

const MONTHS = ['1 月', '2 月', '3 月', '4 月', '5 月', '6 月', '7 月', '8 月', '9 月', '10 月', '11 月', '12 月']
const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4']

const formatPeriod = (year: number, unit: PeriodUnit, column: number) =>
  unit === 'month'
    ? `${year} 年 ${MONTHS[column]}`
    : unit === 'quarter'
      ? `${year} 年 ${QUARTERS[column]}`
      : `${year} 年第 ${column + 1} 周`

export function PeriodReturnsTableUsage() {
  return (
    <div className="gal-wide" data-gallery-period="main" style={{ maxWidth: 760 }}>
      <PeriodReturnsTable
        samples={DEMO_RETURNS}
        label="示例：按年与月的收益"
        utcOffsetMinutes={480}
        formatPercent={pct2}
        formatPeriod={formatPeriod}
        labels={{
          unitGroup: '周期',
          month: '月',
          quarter: '季',
          week: '周',
          year: '年',
          total: '全年',
          monthNames: MONTHS,
          quarterNames: QUARTERS,
          weekName: (week) => `${week}`,
          idle: '移到一格上，看这个周期的收益',
          empty: '没有收益数据',
        }}
        source="来源 / 演示数据（固定种子合成的日收益，按东八区复利聚合）"
      />
    </div>
  )
}
```

## States

- 默认：月视图，每格写收益，行尾加粗写全年合计。
- 没有样本的周期是空格（不是 0%）；收益在零附近的格子中性灰。
- 周视图：52 列放不下数字，格子只留颜色，表格自己横向滚动，数在读数区与 title。
- 悬停或聚焦一格：读数区写它的名字与收益。

## Don't

- 不要用彩虹色阶：只有涨跌两端和中间灰。
- 不要把年度合计画进色阶的上限：一年的合计会把月份压成灰。
- 不要在件里猜时区：样本归哪个月由 utcOffsetMinutes 定。

## Composition

```
PeriodReturnsTable
  头（月/季/周开关 · 色条）
  table（年 × 周期的格 · 行尾全年合计）
  读数区 · 来源行
```

## Keyboard

- `Tab`：进表，停在一格上
- `方向键`：在格间走
- `Home / End`：到行首 / 行尾
