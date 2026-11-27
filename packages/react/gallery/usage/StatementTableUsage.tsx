// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { StatementTable } from '../../src/quant'
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
