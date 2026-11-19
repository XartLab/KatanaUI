// SPDX-License-Identifier: MIT
import { AiApproval } from '../../src/index'

export function AiApprovalUsage() {
  return (
    <AiApproval
      question="AI 建议减仓 600519，是否下单？"
      facts={[
        { label: '标的', value: '贵州茅台 600519' },
        { label: '方向', value: '卖出', tone: 'down' },
        { label: '数量', value: '200 股' },
      ]}
      options={[
        { id: 'approve', label: '批准下单', hold: { hint: '按住约 2 秒批准下单' } },
        { id: 'reject', label: '拒绝', destructive: true },
      ]}
      onDecide={() => undefined}
    />
  )
}
