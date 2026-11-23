// SPDX-License-Identifier: MIT
import { HorizonChart, type HorizonRow } from '../../src/quant'

const HZ_POINTS = 48

const hz = (f: (i: number) => number) => Array.from({ length: HZ_POINTS }, (_, i) => +f(i).toFixed(3))

export const HORIZON_DEMO_ROWS: readonly HorizonRow[] = [
  { key: 'AAA', label: 'AAA', values: hz((i) => 3 * Math.sin(i / 3.8)) },
  { key: 'BBB', label: 'BBB', values: hz((i) => 1.2 * Math.sin(i / 3.8 + 1)) },
  { key: 'CCC', label: 'CCC', values: hz((i) => (i < HZ_POINTS / 2 ? 0.9 : -0.9)) },
  { key: 'DDD', label: 'DDD', values: hz((i) => -2 * Math.cos(i / 5)) },
]

const pctText = (value: number) => `${value > 0 ? '+' : ''}${value.toFixed(2)}%`

/** 图右上三件的文字（表格视图必须有，dataviz §4）。 */
const ACTIONS = { group: '图工具', table: '表格视图', exportCsv: '导出 CSV', fullscreen: '全屏' }

export function HorizonChartUsage() {
  return (
    <>
      <div className="gal-wide" data-gallery-horizon="shared" style={{ maxWidth: 560 }}>
        <HorizonChart
          rows={HORIZON_DEMO_ROWS}
          label="示例：四个品种的日内收益（共用刻度）"
          formatValue={pctText}
          formatX={(i) => `第 ${i + 1} 点`}
          actionLabels={ACTIONS}
          tableLabel="四个品种的日内收益（表格视图）"
          tableXHead="时点"
        />
      </div>
      <div className="gal-wide" data-gallery-horizon="row" style={{ maxWidth: 560 }}>
        <HorizonChart
          rows={HORIZON_DEMO_ROWS}
          label="示例：四个品种的日内收益（各自刻度）"
          formatValue={pctText}
          scale="row"
          actionLabels={ACTIONS}
          tableLabel="四个品种的日内收益（各自刻度，表格视图）"
          tableXHead="序号"
        />
      </div>
    </>
  )
}

/** 演示用的六个品种的价格走势：闭式公式，一条 40 个点。 */
