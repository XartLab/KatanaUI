// SPDX-License-Identifier: MIT
import { ParamSurfaceHeatmap } from '../../src/quant'
import { DEMO_SURFACE, money, ratio0 } from '../research-data'

export function ParamSurfaceHeatmapUsage() {
  return (
    <div className="gal-wide" data-gallery-surface="main" style={{ maxWidth: 820 }}>
      <ParamSurfaceHeatmap
        points={DEMO_SURFACE}
        params={[
          { key: 'fast', name: '快线周期' },
          { key: 'slow', name: '慢线周期' },
          { key: 'stop', name: '止损 %' },
        ]}
        metrics={[
          { key: 'sharpe', name: '夏普比率', format: (v) => v.toFixed(2), goal: 'max' },
          {
            key: 'net',
            name: '净利润',
            format: money,
            goal: 'max',
            formatSpread: (v) => Math.round(v).toLocaleString('en-US'),
          },
          { key: 'drawdown', name: '最大回撤', format: (v) => `${(v * 100).toFixed(1)}%`, goal: 'min' },
        ]}
        label="示例：快线与慢线周期的参数曲面（止损固定）"
        spikeBelow={0.6}
        formatRatio={ratio0}
        labels={{
          xAxis: '横轴',
          yAxis: '纵轴',
          metric: '目标值',
          slice: '固定',
          best: '最优',
          spike: '孤峰',
          cell: '这一格',
          neighborhood: '最优格的邻域',
          neighbors: '邻格数',
          mean: '邻域均值',
          variance: '邻域方差',
          retention: '保留率（邻均值 ÷ 最优）',
          noValue: '没有结果',
          missing: '没有这组参数',
          idle: '移到一格上，看这组参数的全部指标',
          empty: '没有优化结果',
        }}
        source="来源 / 演示数据（固定种子合成，不是回测结果）"
      />
    </div>
  )
}
