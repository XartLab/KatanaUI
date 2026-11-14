// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { SymbolGalaxy, type GalaxyNode } from '../../src/blocks'

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

const SECTORS = ['金融', '科技', '消费', '能源', '医药']

const MARKETS = ['主板', '创业板', '科创板']

const STATES = ['持仓', '自选']

/** 示例品种：大小取对数正态（均值 3、标准差 0.9，再取指数，单位「亿」，只为画出有大有小），涨跌取正态（均值 0、标准差 2.5%）；行业、市场、因子分位、状态由序号与种子定。 */

function galaxyNodes(count: number, seed: number): GalaxyNode[] {
  const next = seeded(seed)
  const sizes = gaussians(seed + 1, count, 3, 0.9)
  const changes = gaussians(seed + 2, count, 0, 0.025)
  return Array.from({ length: count }, (_, i) => ({
    id: `s${String(i).padStart(4, '0')}`,
    label: `示例 ${String(i + 1).padStart(4, '0')}`,
    size: Math.exp(sizes[i]!),
    change: changes[i]!,
    groups: {
      sector: SECTORS[Math.floor(next() * SECTORS.length)]!,
      market: MARKETS[Math.floor(next() * MARKETS.length)]!,
      quantile: `第 ${1 + Math.floor(next() * 5)} 层`,
      state: STATES[next() < 0.3 ? 0 : 1]!,
    },
  }))
}

const GALAXY_NODES = galaxyNodes(48, 7)

const GALAXY_MANY = galaxyNodes(2400, 9)

const GROUPINGS = [
  { id: 'sector', label: '行业' },
  { id: 'market', label: '市场' },
  { id: 'quantile', label: '因子分位' },
  { id: 'state', label: '状态' },
]

export function SymbolGalaxyUsage() {
  const [picked, setPicked] = useState<GalaxyNode | null>(null)
  const shared = {
    groupings: GROUPINGS,
    groupingLabel: '分组方式',
    ...view(['名称', '分组', '详情'], '品种表'),
    describe: (node: GalaxyNode) =>
      `${node.label}：市值 ${node.size.toFixed(1)} 亿，涨跌 ${node.change === null ? '—' : `${(node.change * 100).toFixed(2)} %`}`,
    groupText: (group: string, count: number) => `${group}，${count} 只`,
    legendText: (step: number) => ['大跌', '跌', '平', '涨', '大涨'][step + 2] ?? '',
    tooltip: (node: GalaxyNode) => ({
      title: node.label,
      rows: [
        { key: 'size', label: '市值', value: `${node.size.toFixed(1)} 亿` },
        {
          key: 'change',
          label: '涨跌',
          // 涨跌色只上数字（dataviz §2）。
          value: (
            <span style={{ color: (node.change ?? 0) >= 0 ? 'var(--pnl-up)' : 'var(--pnl-down)' }}>
              {node.change === null ? '—' : `${(node.change * 100).toFixed(2)} %`}
            </span>
          ),
        },
      ],
    }),
  }
  return (
    <>
      <div className="gal-wide" data-gallery-galaxy="svg">
        <SymbolGalaxy
          {...shared}
          nodes={GALAXY_NODES}
          label="示例：品种星系"
          onSelect={setPicked}
          selectedId={picked?.id ?? null}
          idle="悬停看详情，点一个点选中；Tab 在团间走，方向键在团内走"
        />
        <p data-gallery-galaxy-picked>{picked ? picked.label : ''}</p>
      </div>

      {/* canvas 是浏览器里画的，设计系统包的静态预览（服务端渲染）里画不出来，所以只在浏览器里摆这一行。 */}
      {typeof document !== 'undefined' && (
        <div className="gal-wide" data-gallery-galaxy="canvas">
          <SymbolGalaxy {...shared} nodes={GALAXY_MANY} label="示例：品种星系（2400 个）" defaultGroupBy="market" />
        </div>
      )}
    </>
  )
}

/** 5 层 31 期（2024-01 到 2026-07，每月一期）的示例累计超额收益（%）：期末值照卡 QuantileLayers 的量级（最高层约 +32、最低层约 -22）；第三层在「未通过」那一行故意压低到第二层之下。 */
