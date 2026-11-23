// SPDX-License-Identifier: MIT
import { MaeMfeScatter } from '../../src/quant'
import { DEMO_EXCURSIONS, money, pct1 } from '../research-data'

export function MaeMfeScatterUsage() {
  return (
    <div className="gal-wide" data-gallery-maemfe="main" style={{ maxWidth: 720 }}>
      <MaeMfeScatter
        trades={DEMO_EXCURSIONS}
        label="示例：140 笔交易的最大浮亏与最终盈亏"
        formatAmount={money}
        formatPercent={pct1}
        labels={{
          axisGroup: '横轴',
          mae: '最大浮亏 MAE',
          mfe: '最大浮盈 MFE',
          unitGroup: '单位',
          amount: '金额',
          percent: '百分比',
          pnl: '最终盈亏',
          win: '盈利',
          loss: '亏损',
          meanWin: '盈利单平均',
          meanLoss: '亏损单平均',
          idle: '移到一个点上，看这一笔',
        }}
        actionLabels={{ group: '图的操作', table: '表格视图', exportCsv: '导出 CSV', fullscreen: '全屏' }}
        tableLabel="MAE / MFE 逐笔表"
        tableHead={['交易', '偏移', '最终盈亏', '结果']}
        source="来源 / 演示数据（固定种子合成，不是回测结果）"
      />
    </div>
  )
}
