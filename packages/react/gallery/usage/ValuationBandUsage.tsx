// SPDX-License-Identifier: MIT
import { ValuationBand } from '../../src/quant'
import { DEMO_BAND } from '../fundamentals-data'

export function ValuationBandUsage() {
  return (
    <div className="gal-wide" data-gallery-band="main" style={{ maxWidth: 820 }}>
      <ValuationBand
        prices={DEMO_BAND.prices}
        multiples={DEMO_BAND.pe}
        title="示例 · PE Band · 周线 5 年"
        formatPrice={(value) => value.toFixed(2)}
        formatMultiple={(value) => `${value.toFixed(1)}x`}
        formatX={(index) => DEMO_BAND.dates[index] ?? ''}
        labels={{
          chart: '示例：估值带',
          actions: { group: '图表操作', table: '表格视图', exportCsv: '导出 CSV', fullscreen: '全屏' },
          table: '估值带表格',
          x: '日期',
          price: '价格',
          multiple: 'PE',
          band: (q, level) => `P${Math.round(q * 100)}${level === null ? '' : ` · ${level.toFixed(1)}x`}`,
          percentile: (p) => `当前分位 P${Math.round(p * 100)}`,
          empty: '没有可用的倍数（亏损期 PE 为负，不进分布）',
        }}
        source="来源 / 演示数据（虚构公司，固定种子合成；中间一段亏损，带线断开）"
      />
    </div>
  )
}
