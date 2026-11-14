// SPDX-License-Identifier: MIT
import { ConnectedScatter, type ScatterSeries } from '../../src/quant'

const ACTIONS = { group: '图的操作', table: '表格视图', exportCsv: '导出 CSV', fullscreen: '全屏' }

const view = (tableHead: string[], tableLabel: string) => ({
  actionLabels: ACTIONS,
  tableLabel,
  tableHead,
  onExport: () => {},
  onFullscreen: () => {},
  source: '来源 / 演示数据 · 固定种子合成 · 非行情',
})

// #1918：分布与关系类的件的演示。下面所有数据都是演示用的示例（在这个展示页里写死或用固定种子构造，不是行情，也不是真实的连接状态），页上也写明了；应用里没有样本数据。

/** 固定种子的伪随机（mulberry32）：同样的种子永远同样的演示数据，e2e 的几何断言才稳。 */

const MONTHS = ['01', '02', '03', '04', '05', '06', '07', '08']

const path = (name: string, points: readonly (readonly [number, number])[]) =>
  points.map(([x, y], i) => ({ x, y, label: `${name} 2026-${MONTHS[i]}：波动 ${x} %，收益 ${y} %` }))

const STRATEGIES: readonly ScatterSeries[] = [
  {
    id: 'a',
    label: '示例策略甲',
    points: path('甲', [
      [8, 4],
      [9, 5],
      [10, 4.5],
      [11, 6],
      [12, 7],
      [13, 6.5],
      [14, 8],
      [15, 9],
    ]),
  },
  {
    id: 'b',
    label: '示例策略乙',
    points: path('乙', [
      [14, 6],
      [13, 6.5],
      [12, 5.5],
      [11, 5],
      [10, 5.5],
      [9, 4.5],
      [8, 4],
      [7, 4.2],
    ]),
  },
]

export function ConnectedScatterUsage() {
  return (
    <>
      <div className="gal-wide" data-gallery-scatter="two">
        <ConnectedScatter
          {...view(['轨迹', '时间点', '波动', '收益'], '轨迹点表')}
          series={STRATEGIES}
          label="示例：两个策略的波动与收益按月的轨迹"
          axes={{ x: '年化波动（%）', y: '年化收益（%）' }}
          formatX={(value) => `${value} %`}
          formatY={(value) => `${value} %`}
          idle="悬停或用方向键选一个月"
        />
      </div>

      <div className="gal-wide" data-gallery-scatter="one">
        <ConnectedScatter
          {...view(['轨迹', '时间点', '波动', '收益'], '轨迹点表')}
          series={STRATEGIES.slice(0, 1)}
          label="示例：策略甲的轨迹"
          axes={{ x: '年化波动（%）', y: '年化收益（%）' }}
        />
      </div>
    </>
  )
}
