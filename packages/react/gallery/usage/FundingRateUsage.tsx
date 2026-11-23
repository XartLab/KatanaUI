// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { FundingRate, type FundingPoint, type FundingRateLabels } from '../../src/blocks'

// 演示数据：费率与历史都是编出来的（闭式公式）；每 8 小时结算一次，倒计时的终点是挂载后 2 小时 13 分 7 秒。
const EIGHT_HOURS = 8 * 3600 * 1000
export const FUNDING_HISTORY: readonly FundingPoint[] = Array.from({ length: 24 }, (_, i) => ({
  time: Date.UTC(2026, 10, 15) + i * EIGHT_HOURS,
  rate: +(0.012 * Math.sin(i / 2.2) + 0.004 * Math.cos(i * 1.3) - 0.001).toFixed(4),
}))

export const FUNDING_LABELS: FundingRateLabels = {
  region: '资金费率（演示数据）',
  current: '当前费率',
  predicted: '预测费率',
  nextSettlement: '下次结算',
  history: '历史费率',
  payer: { up: '多头付空头', down: '空头付多头', flat: '不收付' },
  due: '结算中',
  bar: (point, rate) => `${new Date(point.time).toISOString().slice(5, 16).replace('T', ' ')} ${rate}`,
}

export function FundingRateUsage() {
  const [settlement] = useState(() => Date.now() + (2 * 3600 + 13 * 60 + 7) * 1000)
  return (
    <div style={{ width: '100%', maxWidth: 560 }}>
      <FundingRate
        rate={0.01}
        predictedRate={0.0082}
        nextSettlement={settlement}
        history={FUNDING_HISTORY}
        labels={FUNDING_LABELS}
      />
    </div>
  )
}
