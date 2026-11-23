// SPDX-License-Identifier: MIT
import { SmartRecommendation } from '../../src/index'

// 示例数据：风控 Agent 对一个持仓的止损建议，理由与置信度是手写的演示值。
export function SmartRecommendationUsage() {
  return (
    <div className="gal-wide" style={{ maxWidth: 420 }} data-gallery-srec="main">
      <SmartRecommendation
        title="止损建议（示例）"
        options={[
          {
            id: 'raise',
            label: '把止损上移到 1820',
            reason: '近 5 日低点逐日抬高，原止损离现价 9%',
            signal: 2,
            source: '来源：风控 Agent · 波动止损规则',
          },
          { id: 'trail', label: '改成 5% 跟踪止损', reason: '波动大时会被扫出去', signal: 1 },
          { id: 'keep', label: '不动', reason: '原计划持有到财报', signal: 1 },
        ]}
        labels={{
          signal: (signal) => ['没把握', '把握不大', '较有把握', '很有把握'][signal]!,
          recommended: '推荐',
          alternatives: '其他选项',
          accept: '采用',
          undo: '撤销',
          accepted: (label) => `已采用：${label}`,
        }}
      />
    </div>
  )
}
