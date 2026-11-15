// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { SlopeChart, type SlopeItem } from '../../src/quant'

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

const WEIGHTS: readonly SlopeItem[] = [
  { id: 'a', label: '示例 A', before: 24, after: 18 },
  { id: 'b', label: '示例 B', before: 12, after: 15.5 },
  { id: 'c', label: '示例 C', before: 12.4, after: 12.4 },
  { id: 'd', label: '示例 D', before: 8, after: 10 },
  { id: 'e', label: '示例 E', before: 8.3, after: 9.6 },
  { id: 'f', label: '示例 F', before: 15, after: 14 },
  { id: 'g', label: '示例 G', before: 10, after: 9.1 },
  { id: 'h', label: '示例 H', before: 10.3, after: 11.4 },
]

/** 同 8 个示例品种的因子得分，按得分排名看升降。 */

const SCORES: readonly SlopeItem[] = WEIGHTS.map((item, index) => ({
  ...item,
  before: [3.1, 2.4, 2.9, 0.5, 1.2, 1.8, -0.4, 0.9][index]!,
  after: [3.2, 3.3, 2.5, 1.9, 0.2, 2.8, 1.1, 0.1][index]!,
}))

export function SlopeChartUsage() {
  const [picked, setPicked] = useState('')
  return (
    <>
      <div className="gal-wide" data-gallery-slope="value">
        <SlopeChart
          {...view(['名称', '前', '后', '说明'], '前后对比表')}
          items={WEIGHTS}
          label="示例：再平衡前后权重"
          columns={{ before: '调整前', after: '调整后' }}
          formatValue={(value) => `${value} %`}
          describe={(item, change) =>
            `${item.label}：${item.before}% 到 ${item.after}%，${change > 0 ? '加仓' : change < 0 ? '减仓' : '不变'} ${Math.abs(change).toFixed(1)} 个百分点`
          }
          onSelect={(item) => setPicked(item.label)}
          idle="悬停或用上下键选一项，Enter 选中"
        />
        <p data-gallery-slope-picked>{picked}</p>
      </div>

      <div className="gal-wide" data-gallery-slope="rank">
        <SlopeChart
          {...view(['名称', '前', '后', '说明'], '前后对比表')}
          mode="rank"
          items={SCORES}
          label="示例：因子得分名次变化"
          columns={{ before: '上月', after: '本月' }}
          formatValue={(value) => value.toFixed(1)}
          describe={(item, change) =>
            `${item.label}：得分 ${item.before} 到 ${item.after}，名次${change > 0 ? `升 ${change} 位` : change < 0 ? `降 ${-change} 位` : '不变'}`
          }
        />
      </div>
    </>
  )
}

/** 两个示例策略各 8 个月的 (波动 %, 收益 %)：写死的数。甲一路往高波动高收益漂，乙往低波动漂。 */
