// SPDX-License-Identifier: MIT
import { HistoryIcon } from 'lucide-react'
import { ChangeSummary } from '../../src/quant'

// 示例数据：一周的策略指标变化，文字由调用方写好；回撤变大是「坏」，箭头照样朝上。
export function ChangeSummaryUsage() {
  return (
    <div className="gal-wide" style={{ maxWidth: 360 }} data-gallery-changes="main">
      <ChangeSummary
        title="本周变化（示例）"
        period="11-16 → 11-22"
        icon={<HistoryIcon />}
        changes={[
          { id: 'pnl', label: '周盈亏', change: '+1.8%', tone: 'good', direction: 'up' },
          { id: 'sharpe', label: '滚动夏普', change: '1.12 → 1.38', tone: 'good', direction: 'up' },
          { id: 'mdd', label: '最大回撤', change: '8.1% → 9.4%', tone: 'bad', direction: 'up' },
          { id: 'turnover', label: '换手', change: '持平', tone: 'neutral' },
        ]}
      />
    </div>
  )
}
