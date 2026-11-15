// SPDX-License-Identifier: MIT
import { EquityCurve, type EquityCurvePoint } from '../../src/quant'

export function seeded(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** 随机游走：从 start 起 count 个点，每步 ±step 内。 */

const EQ_T0 = Date.UTC(2026, 9, 8, 1, 30)

const EQ_POINTS: EquityCurvePoint[] = (() => {
  const rand = seeded(1931)
  let time = EQ_T0
  let equity = 50_000
  let peak = equity
  return Array.from({ length: 90 }, (_, i) => {
    time += (3 + Math.floor(rand() * 40)) * 60_000
    equity += Math.round((rand() - 0.42) * 420 - (i > 40 && i < 58 ? 260 : 0))
    peak = Math.max(peak, equity)
    const dd = equity - peak
    return {
      time,
      equity,
      drawdown: dd,
      title: `第 ${i + 1} 笔 · ${new Date(time).toISOString().slice(0, 16).replace('T', ' ')}`,
      equityText: equity.toLocaleString('en-US'),
      drawdownText: dd.toLocaleString('en-US'),
    }
  })
})()

const EQ_BENCH = EQ_POINTS.map((_, i) => 50_000 + i * 38)

export function EquityCurveUsage() {
  return (
    <>
      <div className="gal-wide" data-gallery-equity style={{ maxWidth: 760 }}>
        <EquityCurve
          points={EQ_POINTS}
          title="权益曲线"
          hint="初始资金 + 已平净盈亏，每平一笔一个点，横轴是回放时间（演示）"
          name="权益"
          benchmark={{ name: '基准', values: EQ_BENCH }}
          label="权益曲线与镜像回撤"
          axis={(v) => v.toLocaleString('en-US')}
          formatTime={(t) => new Date(t).toISOString().slice(11, 16)}
          labels={{
            drawdown: '回撤',
            time: '时刻',
            scale: { group: '纵轴', linear: '线性', log: '对数' },
            brush: { start: '窗口起点', end: '窗口终点', window: '窗口位置' },
            actions: { group: '图工具', table: '表格视图', exportCsv: '导出 CSV', fullscreen: '全屏' },
          }}
          source="来源 / 演示数据（固定种子合成）"
          onExport={() => {}}
        />
      </div>
    </>
  )
}
