// SPDX-License-Identifier: MIT
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vite-plus/test'
import { guidanceOf } from '../guidance'
import { SeasonalChartDemo } from './tv-widgets.tsx'

// KatanaUI #147：SeasonalChart 文档站页的「怎么用 / 无障碍」与演示要写清这次搬过来的做法。

describe('SeasonalChart 的文档站页', () => {
  it('「怎么用 / 无障碍」写了 366 格、年初基准与改了数、读数「—」、表格视图、受控、520px 与键位', () => {
    const guide = guidanceOf('seasonal-chart')
    const use = (guide.use ?? []).join('\n')
    const a11y = (guide.a11y ?? []).join('\n')
    expect(use).toContain('366 格日历')
    expect(use).toContain('3 月 1 日总是第 60 格')
    expect(use).toContain('上一年最后一个收盘价')
    expect(use).toMatch(/#147 起.*涨跌幅都会变/)
    expect(use).toContain('今年过了最后一个点写「—」')
    expect(use).toContain('表格视图')
    expect(use).toContain('hidden 与 onHiddenChange')
    expect(use).toContain('窄于 520px')
    expect(a11y).toContain('PageUp / PageDown')
    expect(a11y).toContain('第一下 ← / → 落在今年最后一个点')
  })

  it('演示：两张带图操作（表格视图），一张受控 hidden（起始隐去 2022、2023），还有空态', () => {
    const html = renderToStaticMarkup(<SeasonalChartDemo />)
    const figures = html.split('<figure').slice(1)
    expect(figures).toHaveLength(4)
    expect(html.match(/data-slot="chart-actions"/g)?.length).toBe(2)
    expect(figures[1]).not.toContain('chart-actions')
    expect(figures[1]!.match(/aria-pressed="false"/g)?.length).toBe(2)
    expect(html).toMatch(/隐去的年：(<!-- -->)?2022、2023/)
    expect(figures[3]).toContain('seasonal-empty')
  })
})
