// SPDX-License-Identifier: MIT
import { WalkForwardMatrix } from '../../src/quant'
import { DEMO_WALK_FORWARD, dateText, pct1, ratio0 } from '../research-data'

export const WALK_FORWARD_LABELS = {
  modeGroup: '窗口模式',
  rolling: '滚动',
  anchored: '锚定',
  window: '窗口',
  timeline: '时间轴',
  inSample: '样本内',
  outSample: '样本外',
  params: '选中参数',
  outPerformance: '样本外收益',
  result: '结果',
  pass: '通过',
  fail: '未通过',
  windows: '窗口数',
  passed: '通过窗口',
  profitable: '样本外盈利占比',
  inAnnualized: '样本内年化',
  outAnnualized: '样本外年化',
  efficiency: '步进效率',
  noValue: '–',
  empty: '没有步进窗口',
} as const

export function WalkForwardMatrixUsage() {
  return (
    <div className="gal-wide" data-gallery-walkforward="main" style={{ maxWidth: 900 }}>
      <WalkForwardMatrix
        modes={DEMO_WALK_FORWARD}
        label="示例：八个步进窗口"
        formatDate={dateText}
        formatPercent={pct1}
        formatRatio={ratio0}
        labels={WALK_FORWARD_LABELS}
        source="来源 / 演示数据（固定种子合成，不是回测结果；通过 = 样本外收益大于 1%，演示用）"
      />
    </div>
  )
}
