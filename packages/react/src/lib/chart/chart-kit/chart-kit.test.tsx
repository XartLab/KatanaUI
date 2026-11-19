// SPDX-License-Identifier: MIT
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vite-plus/test'
import { DotFill } from './dot-fill.tsx'
import { ChartActions } from './chart-actions.tsx'
import { ChartValue } from './chart-value.tsx'
import { EndMarker } from './end-marker.tsx'
import { LcdTooltip } from './lcd-tooltip.tsx'
import { assignSeries, divColor, divHotThreshold, quantile, seqColor } from './series-colors.ts'

describe('图表配色', () => {
  const keys = Array.from({ length: 9 }, (_, i) => `s${i + 1}`)

  it('类别按完整列表的次序取 series-1..7，第 8 个起是其他；筛选不改已分配的颜色', () => {
    const colors = assignSeries(keys)
    expect(colors.s1).toBe('var(--series-1)')
    expect(colors.s7).toBe('var(--series-7)')
    expect(colors.s8).toBe('var(--series-other)')
    expect(colors.s9).toBe('var(--series-other)')
    // 筛掉 s1 后，s2 仍是 series-2（调用方按完整列表分配，幸存者不重新上色）。
    expect(assignSeries(keys).s2).toBe(colors.s2)
  })

  it('大小用 seq-200..600，越界取两端', () => {
    expect(seqColor(0)).toBe('var(--seq-200)')
    expect(seqColor(4)).toBe('var(--seq-600)')
    expect(seqColor(-3)).toBe('var(--seq-200)')
    expect(seqColor(99)).toBe('var(--seq-600)')
  })

  it('正负用 div：0 是中点，-200 只给 hot；全饱和档不出现', () => {
    expect(divColor(0)).toBe('var(--div-mid)')
    expect(divColor(5)).toBe('var(--div-pos-100)')
    expect(divColor(5, true)).toBe('var(--div-pos-200)')
    expect(divColor(-5)).toBe('var(--div-neg-100)')
    expect(divColor(-5, true)).toBe('var(--div-neg-200)')
    for (const value of [-9, -1, 0, 1, 9]) expect(divColor(value, true)).not.toBe('var(--div-pos)')
  })

  it('80 分位按 |值| 算', () => {
    expect(quantile([1, 2, 3, 4, 5], 0.5)).toBe(3)
    expect(quantile([], 0.5)).toBe(0)
    expect(divHotThreshold([-10, 1, 2, 3, 4])).toBeCloseTo(5.2, 6)
  })
})

describe('图表底座的结构', () => {
  it('点阵纹理里同时画点阵与斜线两种形状，由变量定显示哪种', () => {
    const html = renderToStaticMarkup(
      <svg>
        <DotFill id="p" color="var(--ink-200)" />
      </svg>,
    )
    expect(html).toContain('k-fill-dot')
    expect(html).toContain('k-fill-hatch')
  })

  it('LCD tooltip 带标题与每行的标签和值', () => {
    const html = renderToStaticMarkup(
      <LcdTooltip title="2026-01-05" rows={[{ key: 'a', label: '净值', value: '1.23', swatch: 'var(--series-1)' }]} />,
    )
    expect(html).toContain('data-slot="lcd-tooltip"')
    expect(html).toContain('2026-01-05')
    expect(html).toContain('净值')
    expect(html).toContain('1.23')
  })

  it('末点是个圆点，给了数值就旁标', () => {
    expect(renderToStaticMarkup(<EndMarker x={500} y={10} value="9.9" />)).toContain('9.9')
    expect(renderToStaticMarkup(<EndMarker x={500} y={10} />)).not.toContain('k-ck-end-value')
  })

  it('图右上三件：表格视图总有，导出与全屏没给回调就不画', () => {
    const labels = { group: '图工具', table: '表格视图', exportCsv: '导出 CSV', fullscreen: '全屏' }
    const bare = renderToStaticMarkup(<ChartActions labels={labels} tableView={false} onTableView={() => {}} />)
    expect(bare).toContain('data-action="table"')
    expect(bare).not.toContain('data-action="export"')
    const full = renderToStaticMarkup(
      <ChartActions labels={labels} tableView onTableView={() => {}} onExport={() => {}} onFullscreen={() => {}} />,
    )
    expect(full).toContain('data-action="export"')
    expect(full).toContain('data-action="fullscreen"')
    expect(full).toContain('aria-pressed="true"')
    expect(full).not.toContain('data-action="copy-image"')
  })

  it('复制图：onCopyImage 与 labels.copyImage 都给了才画相机钮；这一组不进截图', () => {
    const labels = { group: '图工具', table: '表格视图', exportCsv: '导出 CSV', fullscreen: '全屏' }
    const noLabel = renderToStaticMarkup(
      <ChartActions labels={labels} tableView={false} onTableView={() => {}} onCopyImage={() => {}} />,
    )
    expect(noLabel).not.toContain('data-action="copy-image"')
    const html = renderToStaticMarkup(
      <ChartActions
        labels={{ ...labels, copyImage: '复制图片' }}
        tableView={false}
        onTableView={() => {}}
        onCopyImage={() => {}}
      />,
    )
    expect(html).toContain('data-action="copy-image"')
    expect(html).toContain('aria-label="复制图片"')
    expect(html).toContain('data-copy-image="skip"')
  })
})

describe('ChartValue', () => {
  it('字符串原样写；{ value, unit } 把单位放进次一级墨色的 span，中间一个空格', () => {
    expect(renderToStaticMarkup(<ChartValue text="12.0 %" />)).toBe('12.0 %')
    expect(renderToStaticMarkup(<ChartValue text={{ value: '12.0', unit: '%' }} />)).toBe(
      '12.0 <span class="k-ck-unit">%</span>',
    )
  })
})
