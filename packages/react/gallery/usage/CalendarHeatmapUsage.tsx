// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { CalendarHeatmap, type CalendarDay, type CalendarEvent } from '../../src/quant'

export function seeded(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** 随机游走：从 start 起 count 个点，每步 ±step 内。 */

const CAL_FROM = '2025-11-15'

const CAL_TO = '2026-11-14'

const CAL_EVENTS: Record<string, CalendarEvent[]> = {
  '2026-09-30': [{ label: '300750 财报', kind: '财报' }],
  '2026-10-08': [{ label: '600519 分红', kind: '分红', tone: 'holding' }],
  '2026-10-09': [
    { label: '00700 财报', kind: '财报' },
    { label: '宏观数据', kind: '宏观' },
  ],
  '2026-10-13': [{ label: '002475 解禁', kind: '解禁', tone: 'high' }],
  '2026-10-15': [{ label: 'CPI', kind: '宏观' }],
  '2026-10-19': [
    { label: '300750 分红', kind: '分红' },
    { label: '宏观数据', kind: '宏观' },
    { label: '002475 解禁', kind: '解禁', tone: 'holding' },
  ],
  '2026-10-21': [{ label: '600519 财报', kind: '财报' }],
  '2026-10-27': [
    { label: 'A', kind: '财报' },
    { label: 'B', kind: '财报' },
    { label: 'C', kind: '分红' },
    { label: 'D', kind: '解禁', tone: 'high' },
    { label: 'E', kind: '宏观' },
  ],
}

const CAL_DAYS: CalendarDay[] = (() => {
  const next = seeded(7)
  const out: CalendarDay[] = []
  for (let ms = Date.UTC(2025, 10, 15); ms <= Date.UTC(2026, 10, 14); ms += 86_400_000) {
    const weekday = new Date(ms).getUTCDay()
    const date = new Date(ms).toISOString().slice(0, 10)
    const events = CAL_EVENTS[date]
    if (weekday === 0 || weekday === 6) out.push({ date, value: null, open: false, events })
    else out.push({ date, value: Math.round((next() - 0.46) * 2000), events })
  }
  return out
})()

const CAL_PROPS = {
  weekdayLabels: ['日', '一', '二', '三', '四', '五', '六'],
  monthLabels: Array.from({ length: 12 }, (_, i) => `${i + 1}月`),
  weekLabel: (week: number) => `W${week}`,
  closedLabel: '休',
  formatValue: (value: number) => (value > 0 ? '+' : '') + value,
  describe: (date: string, value: number | null) =>
    `${date}  ${value === null ? '休市或没有数据' : (value > 0 ? '+' : '') + value}`,
  legend: { down: '亏', up: '盈' },
  actionLabels: { group: '图工具', table: '表格视图', exportCsv: '导出 CSV', fullscreen: '全屏' },
  tableHeads: { date: '日期', value: '数值' },
} as const

export function CalendarHeatmapUsage() {
  const [view, setView] = useState<'pnl' | 'turnover' | 'events'>('pnl')
  const [picked, setPicked] = useState('')
  const month = CAL_DAYS.filter((day) => day.date.startsWith('2026-10'))
  const sum = month.reduce((t, day) => t + (day.date <= '2026-10-19' ? (day.value ?? 0) : 0), 0)
  return (
    <>
      <div className="gal-wide" data-gallery-calendar="month" style={{ maxWidth: 620 }}>
        <CalendarHeatmap
          {...CAL_PROPS}
          days={CAL_DAYS}
          month="2026-10"
          today="2026-10-19"
          view={view}
          label="示例收益日历 2026-10"
          total={{ text: `${sum > 0 ? '+' : ''}${sum}`, value: sum }}
          toolbar={
            <span className="gal-row" role="group" aria-label="视图">
              {(['pnl', 'turnover', 'events'] as const).map((v) => (
                <button key={v} type="button" aria-pressed={view === v} onClick={() => setView(v)} data-view={v}>
                  {v === 'pnl' ? '收益' : v === 'turnover' ? '换手' : '事件'}
                </button>
              ))}
              <span>2026-10 · 账户 A B F</span>
            </span>
          }
          onSelect={setPicked}
          onExport={() => {}}
        />
        <output data-gallery-calendar-picked>{picked ? `点了 ${picked}` : ''}</output>
      </div>
      <div className="gal-wide" data-gallery-calendar="year" style={{ maxWidth: 860 }}>
        <CalendarHeatmap
          {...CAL_PROPS}
          days={CAL_DAYS}
          mode="year"
          from={CAL_FROM}
          to={CAL_TO}
          label="示例：一年的每日盈亏"
        />
      </div>
    </>
  )
}
/** 演示用的日内收益（%）：四行各用一个闭式公式生成，一行 48 个点，页上写明是演示。 */
