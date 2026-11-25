// SPDX-License-Identifier: MIT
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vite-plus/test'
import {
  DistributionBars,
  distributionBarHeight,
  distributionTotals,
  type DistributionBin,
} from './distribution-bars.tsx'

// #109：分档分布柱。9 档（跌停…涨停），柱顶家数、底部汇总；档名与汇总的名字由调用方传。
const BINS: DistributionBin[] = [
  { key: 'b0', label: 'L', count: 10, tone: 'down' },
  { key: 'b1', label: '-3', count: 400, tone: 'down' },
  { key: 'b2', label: '-1', count: 1200, tone: 'down' },
  { key: 'b3', label: '0', count: 300, tone: 'muted' },
  { key: 'b4', label: '+1', count: 900, tone: 'up' },
  { key: 'b5', label: '+3', count: 600, tone: 'up' },
  { key: 'b6', label: 'H', count: 50, tone: 'up' },
]

describe('DistributionBars', () => {
  it('每档一列：色调、柱顶家数（千分位）、柱高按最大档归一；档名在柱区下面', () => {
    expect(distributionBarHeight(1200, 1200, 96)).toBe(80)
    expect(distributionBarHeight(600, 1200, 96)).toBe(40)
    expect(distributionBarHeight(1, 1200, 96)).toBe(1)
    expect(distributionBarHeight(0, 1200, 96)).toBe(0)
    expect(distributionBarHeight(null, 1200, 96)).toBe(0)
    const html = renderToStaticMarkup(<DistributionBars bins={BINS} label="dist" />)
    expect(html.match(/data-slot="distribution-bin"/g)).toHaveLength(7)
    expect(html).toContain('data-key="b2" data-tone="down"')
    expect(html).toContain('<span class="k-dist-count">1,200</span><i class="k-dist-fill" style="height:80px"></i>')
    expect(html).toContain('<i class="k-dist-fill" style="height:40px"></i>')
    expect(html).toContain('<span class="k-dist-label">-3</span>')
    expect(html).toContain('aria-label="dist"')
  })

  it('底部汇总：按色调加家数，名字由调用方传，没传的那项不出现', () => {
    expect(distributionTotals(BINS)).toEqual({ up: 1550, muted: 300, down: 1610 })
    const html = renderToStaticMarkup(
      <DistributionBars bins={BINS} label="d" totals={{ up: 'U', muted: 'M', down: 'D' }} />,
    )
    expect(html).toContain('data-slot="distribution-totals"')
    expect(html).toContain('<span data-tone="up">U <b>1,550</b></span>')
    expect(html).toContain('<span data-tone="muted">M <b>300</b></span>')
    expect(html).toContain('<span data-tone="down">D <b>1,610</b></span>')
    const part = renderToStaticMarkup(<DistributionBars bins={BINS} label="d" totals={{ up: 'U' }} />)
    expect(part).not.toContain('data-tone="down">D')
    expect(renderToStaticMarkup(<DistributionBars bins={BINS} label="d" />)).not.toContain('distribution-totals')
  })

  it('没有数据显示空态，不画样本；没有数的档不画柱', () => {
    const empty = renderToStaticMarkup(<DistributionBars bins={[]} label="d" empty="没有数据" />)
    expect(empty).toContain('data-empty="true"')
    expect(empty).toContain('没有数据')
    expect(empty).not.toContain('k-dist-fill')
    const allNull = renderToStaticMarkup(
      <DistributionBars bins={[{ key: 'x', label: 'x', count: null, tone: 'up' }]} label="d" />,
    )
    expect(allNull).toContain('data-empty="true"')
    const some = renderToStaticMarkup(
      <DistributionBars
        bins={[
          { key: 'x', label: 'x', count: null, tone: 'up' },
          { key: 'y', label: 'y', count: 5, tone: 'up' },
        ]}
        label="d"
      />,
    )
    expect(some).toContain('<span class="k-dist-count">—</span><i class="k-dist-fill" style="height:0"></i>')
  })

  it('formatCount 换家数的写法', () => {
    const html = renderToStaticMarkup(<DistributionBars bins={BINS} label="d" formatCount={(n) => `${n}家`} />)
    expect(html).toContain('>1200家<')
  })
})
