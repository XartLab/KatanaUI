// SPDX-License-Identifier: MIT
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vite-plus/test'
import { CompareBar, RangeBar } from './range-bar.tsx'
import { KeyStats } from './key-stats.tsx'
import { formatPerformance, PerformanceStrip } from './performance-strip.tsx'
import { changedTail, nextSort, sortRows } from './watchlist-model.ts'
import { Watchlist } from './watchlist.tsx'

describe('品种概览', () => {
  it('formatPerformance：千以上写 K%、M%，空值写「—」', () => {
    expect(formatPerformance(12.5)).toBe('+12.50%')
    expect(formatPerformance(-3)).toBe('-3.00%')
    expect(formatPerformance(1840.2)).toBe('+1.84K%')
    expect(formatPerformance(-2500000)).toBe('-2.50M%')
    expect(formatPerformance(null)).toBe('—')
  })

  it('PerformanceStrip：选中的格 aria-pressed，涨跌上色标记', () => {
    const out = renderToStaticMarkup(
      <PerformanceStrip
        label="p"
        value="b"
        items={[
          { key: 'a', label: 'A', change: 1 },
          { key: 'b', label: 'B', change: -1 },
        ]}
      />,
    )
    expect(out).toMatch(/data-key="b"[^>]*aria-pressed="true"/)
    expect(out).toContain('data-tone="down"')
  })

  it('changedTail：只取从第一位不同起的尾数', () => {
    expect(changedTail('212.40', '212.46')).toEqual({ head: '212.4', tail: '6' })
    expect(changedTail('1,044.10', '1,043.90')).toEqual({ head: '1,04', tail: '3.90' })
    expect(changedTail('99.99', '100.01').head).toBe('')
    expect(changedTail('5.00', '5.00').tail).toBe('')
  })

  it('nextSort 循环与 sortRows', () => {
    const asc = nextSort(null, 'last')
    expect(asc).toEqual({ key: 'last', dir: 'asc' })
    expect(nextSort(asc, 'last')).toEqual({ key: 'last', dir: 'desc' })
    expect(nextSort({ key: 'last', dir: 'desc' }, 'last')).toBeNull()
    const rows = [
      { code: 'B', last: 2, change: 0, changePct: 0 },
      { code: 'A', last: 3, change: 0, changePct: 0 },
      { code: 'C', last: 1, change: 0, changePct: 0 },
    ]
    expect(sortRows(rows, { key: 'last', dir: 'asc' }).map((r) => r.code)).toEqual(['C', 'B', 'A'])
    expect(sortRows(rows, { key: 'symbol', dir: 'asc' }).map((r) => r.code)).toEqual(['A', 'B', 'C'])
    expect(sortRows(rows, null).map((r) => r.code)).toEqual(['B', 'A', 'C'])
  })

  it('Watchlist / KeyStats / RangeBar / CompareBar 渲染结构', () => {
    const labels = {
      columns: { symbol: 'Symbol', last: 'Last', chg: 'Chg', chgPct: 'Chg%' },
      list: 'w',
      empty: 'none',
      flag: () => 'flag',
    }
    const w = renderToStaticMarkup(
      <Watchlist labels={labels} rows={[{ key: 'a', code: 'AAA', last: 1, change: 0.1, changePct: 1 }]} />,
    )
    expect(w).toContain('Chg%')
    expect(renderToStaticMarkup(<Watchlist labels={labels} rows={[]} />)).toContain('none')
    const k = renderToStaticMarkup(<KeyStats title="Key stats" items={[{ key: 'x', label: 'L', badge: 'Mega cap' }]} />)
    expect(k).toContain('Mega cap')
    expect(k).toContain('—')
    expect(
      renderToStaticMarkup(<RangeBar low={0} high={10} value={5} label="r" marker="triangle" title="T" />),
    ).toContain('data-marker="triangle"')
    expect(
      renderToStaticMarkup(
        <CompareBar a={{ label: 'a', value: 50, text: '50' }} b={{ label: 'b', value: 100, text: '100' }} label="c" />,
      ),
    ).toContain('--fill:0.5')
  })
})
