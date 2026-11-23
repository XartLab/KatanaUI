// SPDX-License-Identifier: MIT
import { EquityCurve, UnderwaterChart } from '../../src/quant'
import { DEMO_EQUITY, DEMO_RANGE, DEMO_UNDERWATER, dateText, duration, pct1 } from '../research-data'

const actions = { group: '图的操作', table: '表格视图', exportCsv: '导出 CSV', fullscreen: '全屏' }

/** 水下回撤图，单独一张。 */
export function UnderwaterChartUsage() {
  return (
    <div className="gal-wide" data-gallery-underwater="main" style={{ maxWidth: 760 }}>
      <UnderwaterChart
        points={DEMO_UNDERWATER}
        title="水下回撤"
        label="示例：权益距历史最高的回撤"
        xDomain={DEMO_RANGE}
        formatTime={dateText}
        formatPercent={pct1}
        formatDuration={duration}
        labels={{
          drawdown: '回撤',
          maxDrawdown: '最大回撤',
          fall: '前高到谷底',
          recovery: '恢复',
          notRecovered: '尚未恢复',
          noDrawdown: '没有回撤',
        }}
        actionLabels={actions}
        tableLabel="回撤表"
        tableHead={['日期', '回撤']}
        source="来源 / 演示数据（固定种子合成，不是回测结果）"
      />
    </div>
  )
}

/** 和权益曲线叠着放：同一对 xDomain、同一个 formatTime，横轴对齐。 */
export function UnderwaterWithEquityUsage() {
  return (
    <div className="gal-wide" data-gallery-underwater="stack" style={{ maxWidth: 760 }}>
      <EquityCurve
        points={DEMO_EQUITY}
        title="权益曲线"
        name="权益"
        label="示例：权益曲线"
        axis={(v) => v.toLocaleString('en-US')}
        formatTime={dateText}
        labels={{
          drawdown: '回撤',
          time: '时刻',
          scale: { group: '纵轴', linear: '线性', log: '对数' },
          brush: { start: '窗口起点', end: '窗口终点', window: '窗口位置' },
          actions,
        }}
      />
      <UnderwaterChart
        points={DEMO_UNDERWATER}
        title="水下回撤"
        label="示例：和权益曲线同一条时间轴的回撤"
        xDomain={DEMO_RANGE}
        formatTime={dateText}
        formatPercent={pct1}
        formatDuration={duration}
        labels={{
          drawdown: '回撤',
          maxDrawdown: '最大回撤',
          fall: '前高到谷底',
          recovery: '恢复',
          notRecovered: '尚未恢复',
          noDrawdown: '没有回撤',
        }}
        actionLabels={actions}
        tableLabel="回撤表"
        tableHead={['日期', '回撤']}
      />
    </div>
  )
}
