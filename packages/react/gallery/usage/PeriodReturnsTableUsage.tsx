// SPDX-License-Identifier: MIT
import { PeriodReturnsTable, type PeriodUnit } from '../../src/quant'
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
