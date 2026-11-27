# StatementTable

三张报表的科目 × 期间表（KATANAview #2395）：科目成树，层级靠缩进与字重（小计加粗、合计上方一条细线），父科目能折叠；期间从早到晚做列，容器放不下时先收起最早的几期、最新一期最后收；工具条切原值 / 同比 / 环比，给了频率就再切季 / 年 / TTM（数据由调用方换，件不聚合）。更正过的格右上一个中性小点，悬停写第几版。表本身是 DataGrid：科目列粘左，复制与导出是原数。功能参照 TradingView 品种页 Financials 与 Koyfin FA。

## Provide

`*` marks a required prop.

### StatementTable

件只认科目的 parent 与 kind，不认科目名；数与文字全由 props 传。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `items` | `StatementItem[]` | — | 科目：id、label、parent（父科目 id）、kind（line / subtotal / total）。次序就是显示次序。 |
| `periods` | `{ id, label }[]` | — | 期间，从早到晚；id 是 values 里的键。 |
| `values` | `Record<科目, Record<期间, number \| null \| { value, revision, note }>>` | — | revision > 1 的格画更正标记。缺的格写「—」。 |
| `periodsPerYear` | `number` | `4` | 同比往前比几列：季报 4、年报 1。 |
| `formatValue` | `(value, item) => string` | `compact` | 原值的写法（亿、万由调用方定）。 |
| `mode / onModeChange` | `'value' \| 'yoy' \| 'qoq'` | `value` | 口径；不给受控用内部状态。 |
| `frequencies / frequency / onFrequencyChange` | `{ id, label }[]` | — | 频率开关（季 / 年 / TTM）；给了才画，换数据由调用方做。 |
| `defaultCollapsed` | `string[]` | — | 一开始收起的科目 id。 |
| `labels` | `StatementTableLabels` | — | 表名、列头、开关、折叠钮读屏名、更正提示、空态。 |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { StatementTable } from '@katana-ui/react/quant'
import { DEMO_STATEMENT_ITEMS, DEMO_STATEMENT_PERIODS, DEMO_STATEMENT_VALUES } from '../fundamentals-data'

const yi = (value: number) => `${(value / 1e8).toFixed(2)} 亿`

export function StatementTableUsage() {
  const [frequency, setFrequency] = useState<'q' | 'fy' | 'ttm'>('q')
  return (
    <div className="gal-wide" data-gallery-statement="main" style={{ maxWidth: 1040 }}>
      <StatementTable
        items={DEMO_STATEMENT_ITEMS}
        periods={DEMO_STATEMENT_PERIODS}
        values={DEMO_STATEMENT_VALUES}
        periodsPerYear={4}
        formatValue={yi}
        frequencies={[
          { id: 'q', label: '季' },
          { id: 'fy', label: '年' },
          { id: 'ttm', label: 'TTM' },
        ]}
        frequency={frequency}
        onFrequencyChange={setFrequency}
        labels={{
          table: '示例：利润表',
          item: '科目',
          modeGroup: '口径',
          value: '原值',
          yoy: '同比',
          qoq: '环比',
          frequencyGroup: '频率',
          collapse: (item) => `收起 ${item.label}`,
          expand: (item) => `展开 ${item.label}`,
          revised: (revision, note) => `第 ${revision} 版披露${note ? ` · ${note}` : ''}`,
          empty: '没有科目',
        }}
        source="来源 / 演示数据（虚构公司，固定种子合成；频率开关只演示控件，数据未换）"
      />
    </div>
  )
}
```

## States

- 默认：原值，全部展开。
- 同比 / 环比：格里写带符号的百分比，涨跌色只给变化率；分母为 0、缺数或前面没有可比期写「—」。
- 收起父科目：子科目不显示，导出的是看得见的行（跟 DataGrid 一致）。
- 更正过的格：右上 4px 中性小点，悬停写第几版与说明（更正是事实，不是错误，不用警示色）。
- 没有科目：空态一行字。

## Don't

- 不要画格子线：块与块之间靠细线和留白。
- 不要用框表示层级：缩进与字重就够。
- 不要在件里算 TTM 或年报：频率开关只发回调，数据由调用方换。
- 不要把更正标成红色或警示色。

## Composition

```
StatementTable
  工具条（原值/同比/环比 · 季/年/TTM）
  DataGrid（科目列粘左 · 期间列）
  来源行
```

## Keyboard

- `Tab`：进表；折叠钮可聚焦
- `Enter / Space`：在折叠钮上：展开或收起
- `方向键`：在格间走（DataGrid）
