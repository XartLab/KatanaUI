// SPDX-License-Identifier: MIT
import { AiDiff } from '../../src/index'

export function AiDiffUsage() {
  return (
    <AiDiff
      title="策略参数"
      lines={[
        { kind: 'removed', content: 'stop_loss: 0.05' },
        { kind: 'added', content: 'stop_loss: 0.035' },
      ]}
      labels={{
        accept: '接受',
        reject: '拒绝',
        accepted: '已接受',
        rejected: '已拒绝',
        added: '新增',
        removed: '删除',
        context: '未变',
      }}
      onAccept={() => undefined}
      onReject={() => undefined}
    />
  )
}
