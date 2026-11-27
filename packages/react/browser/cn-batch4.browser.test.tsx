// SPDX-License-Identifier: MIT
// A-share pieces, third batch (#260): one screenshot per component, from the gallery usage demos (demo data). Test name = file name.
// A 股件按 A 股的涨跌约定截：根上 data-updown="cn"（红涨绿跌），这个文件跑完还原。
import { afterAll, beforeAll, describe, expect, test } from 'vite-plus/test'
import { page } from 'vite-plus/test/browser'
import { GroupedTableUsage } from '../gallery/usage/GroupedTableUsage.tsx'
import { IntradaySeriesUsage } from '../gallery/usage/IntradaySeriesUsage.tsx'
import { MatrixHeatUsage } from '../gallery/usage/MatrixHeatUsage.tsx'
import { ValuationBandUsage } from '../gallery/usage/ValuationBandUsage.tsx'
import { DistributionBars, type DistributionBin } from '../src/quant/index.ts'
import { mount } from './render.tsx'
import { settled } from './settle.ts'

// 窄柱下的档名（#260）：300px 里 11 档，区间档名在区间符后断成上下两行；最后三档用 lines 总是上下叠。示例家数，不是行情。
const NARROW_BINS: DistributionBin[] = [
  { key: 'd0', label: '跌停', count: 38, tone: 'down' },
  { key: 'd1', label: '<-7%', count: 120, tone: 'down' },
  { key: 'd2', label: '-7~-5', count: 210, tone: 'down' },
  { key: 'd3', label: '-5~-3', count: 480, tone: 'down' },
  { key: 'd4', label: '-3~-1', count: 920, tone: 'down' },
  { key: 'd5', label: '平', count: 260, tone: 'muted' },
  { key: 'd6', label: '1~3', count: 1180, tone: 'up' },
  { key: 'd7', label: '3~5', count: 640, tone: 'up' },
  { key: 'd8', label: 'x', lines: ['5%', '7%'], count: 310, tone: 'up', title: '5% ~ 7%' },
  { key: 'd9', label: '>7%', count: 140, tone: 'up' },
  { key: 'd10', label: '涨停', count: 62, tone: 'up' },
]

const items: Record<string, React.ReactNode> = {
  'distribution-bars': (
    <div style={{ width: 300 }}>
      <DistributionBars bins={NARROW_BINS} label="示例涨跌幅分布（窄）" />
    </div>
  ),
  'intraday-series': <IntradaySeriesUsage />,
  'grouped-table': <GroupedTableUsage />,
  'matrix-heat': <MatrixHeatUsage />,
  'valuation-band': <ValuationBandUsage />,
}

beforeAll(() => {
  document.documentElement.dataset.updown = 'cn'
})
afterAll(() => {
  delete document.documentElement.dataset.updown
})

for (const theme of ['graphite', 'console'] as const) {
  describe(theme, () => {
    for (const [name, node] of Object.entries(items)) {
      test(name, async () => {
        await page.viewport(960, 900)
        await mount(<div style={{ width: 720, display: 'flex', flexDirection: 'column', gap: 8 }}>{node}</div>, theme)
        await new Promise((r) => setTimeout(r, 250)) // let measuring and transitions finish
        await settled()
        await expect(page.getByTestId('frame')).toMatchScreenshot(`${theme}-cn-batch4-${name}`)
      })
    }
  })
}
