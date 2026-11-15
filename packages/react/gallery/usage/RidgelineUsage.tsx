// SPDX-License-Identifier: MIT
import { Ridgeline } from '../../src/quant'

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

function seeded(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** 正态分布样本（Box-Muller），均值与标准差自己给。 */

function gaussians(seed: number, count: number, mean: number, sd: number): number[] {
  const next = seeded(seed)
  const out: number[] = []
  while (out.length < count) {
    const u = Math.max(next(), 1e-9)
    const v = next()
    const r = Math.sqrt(-2 * Math.log(u))
    out.push(mean + sd * r * Math.cos(2 * Math.PI * v))
    if (out.length < count) out.push(mean + sd * r * Math.sin(2 * Math.PI * v))
  }
  return out
}

const LAYERS = [-1.2, -0.4, 0.1, 0.7, 1.5].map((mean, i) => ({
  id: `q${i + 1}`,
  label: `第 ${i + 1} 层`,
  values: gaussians(100 + i, 400, mean, 1.8),
}))

export function RidgelineUsage() {
  return (
    <>
      <div className="gal-wide" data-gallery-ridge="layers">
        <Ridgeline
          {...view(['分层', '说明'], '分层收益分布表')}
          groups={LAYERS}
          label="示例：因子分层的日收益分布"
          baseline={0}
          formatValue={(value) => `${value} %`}
          describe={(group, stats) =>
            `${group.label}：中位数 ${stats.median.toFixed(2)} %，均值 ${stats.mean.toFixed(2)} %，${stats.n} 个`
          }
          idle="悬停或用上下键选一层"
        />
      </div>

      <div className="gal-wide" data-gallery-ridge="plain">
        <Ridgeline
          {...view(['分层', '说明'], '分层收益分布表')}
          groups={LAYERS.slice(0, 3)}
          label="示例：前三层（无基准线）"
          rowHeight={28}
          overlap={1.5}
          describe={(group, stats) => `${group.label}：中位数 ${stats.median.toFixed(2)} %`}
        />
      </div>
    </>
  )
}

/** 8 个示例品种的再平衡前后权重（%）：写死的表，几项故意挨得很近（12.0 与 12.4、8.0 与 8.3），用来看标签防重叠。 */
