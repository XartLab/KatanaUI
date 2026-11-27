// SPDX-License-Identifier: MIT
import { CompsTable } from '../../src/quant'
import { DEMO_COMPS_GROUPS, DEMO_COMPS_METRICS, DEMO_COMPS_ROWS } from '../fundamentals-data'

export function CompsTableUsage() {
  return (
    <div className="gal-wide" data-gallery-comps="main" style={{ maxWidth: 760 }}>
      <CompsTable
        rows={DEMO_COMPS_ROWS}
        metrics={DEMO_COMPS_METRICS}
        groups={DEMO_COMPS_GROUPS}
        labels={{
          table: '示例：同业对比',
          symbol: '公司',
          groups: '指标组',
          median: '中位数',
          mean: '均值',
          subject: '本公司',
          empty: '没有同业',
        }}
        source="来源 / 演示数据（虚构公司，固定种子合成）"
      />
    </div>
  )
}
