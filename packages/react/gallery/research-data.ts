// SPDX-License-Identifier: MIT
// 研究报告件与优化结果件（#120）的演示数据：全部是固定种子合成的，不是回测结果也不是行情。文档站页与 usage 共用，e2e 也靠它的数值断言。
import type { EquityCurvePoint } from '../src/quant/equity-curve.tsx'
import type { ExcursionTrade } from '../src/quant/mae-mfe-model.ts'
import type { ReturnSample } from '../src/quant/period-returns-model.ts'
import type { SurfacePoint } from '../src/quant/param-surface-model.ts'
import type { UnderwaterPoint } from '../src/quant/underwater-model.ts'
import type { WalkForwardWindow } from '../src/quant/walk-forward-model.ts'

export function seeded(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const DAY = 86_400_000

// —— 日收益与权益：2024-01 到 2026-10 的工作日，中间夹一段回撤并在之后恢复 ——

const dayOf = (time: number) => new Date(time).toISOString().slice(0, 10)

const SERIES = (() => {
  const rand = seeded(120)
  const returns: ReturnSample[] = []
  let time = Date.UTC(2024, 0, 2, 12)
  for (; returns.length < 720; time += DAY) {
    const weekday = new Date(time).getUTCDay()
    if (weekday === 0 || weekday === 6) continue
    const n = returns.length
    // 基础漂移略正；第 230 到 300 个交易日一段回撤，之后一段修复。
    const drift = n >= 230 && n < 300 ? -0.0032 : n >= 300 && n < 420 ? 0.0021 : 0.0007
    returns.push({ time, value: Number((drift + (rand() - 0.5) * 0.017).toFixed(5)) })
  }
  return returns
})()

/** 日收益样本（小数）：周期收益表聚合它。 */
export const DEMO_RETURNS: readonly ReturnSample[] = SERIES

/** 周频的权益点（每 5 个交易日一个）：权益曲线与水下回撤图共用同一组，两张图的横轴因此一致。 */
const WEEKLY = (() => {
  let equity = 100_000
  let peak = equity
  const rows: { time: number; equity: number; drawdown: number }[] = []
  SERIES.forEach((sample, i) => {
    equity *= 1 + sample.value
    peak = Math.max(peak, equity)
    if (i % 5 === 4) rows.push({ time: sample.time, equity, drawdown: equity / peak - 1 })
  })
  return rows
})()

export const DEMO_UNDERWATER: readonly UnderwaterPoint[] = WEEKLY.map(({ time, drawdown }) => ({ time, drawdown }))

export const DEMO_EQUITY: readonly EquityCurvePoint[] = WEEKLY.map(({ time, equity, drawdown }, i) => ({
  time,
  equity,
  drawdown: drawdown * equity,
  title: `第 ${i + 1} 周 · ${dayOf(time)}`,
  equityText: Math.round(equity).toLocaleString('en-US'),
  drawdownText: `${(drawdown * 100).toFixed(1)}%`,
}))

export const DEMO_RANGE: readonly [number, number] = [WEEKLY[0]!.time, WEEKLY[WEEKLY.length - 1]!.time]

// —— 逐笔交易的 MAE / MFE ——

/** 140 笔：赢单 MAE 小、MFE 大；亏单 MAE 大，但有一部分曾经浮盈不少（止盈放得远）。每笔名义 20000，金额按它折。 */
export const DEMO_EXCURSIONS: readonly ExcursionTrade[] = (() => {
  const rand = seeded(1201)
  const notional = 20_000
  return Array.from({ length: 140 }, (_, i) => {
    const win = rand() < 0.46
    const mfePct = 0.004 + rand() * rand() * 0.07
    const maePct = -(0.002 + rand() * rand() * (win ? 0.025 : 0.06))
    const pnlPct = win ? mfePct * (0.35 + rand() * 0.55) : Math.max(maePct * (0.7 + rand() * 0.3), maePct)
    const money = (pct: number) => Math.round(pct * notional)
    return {
      id: `T${String(i + 1).padStart(3, '0')}`,
      pnl: money(pnlPct),
      pnlPct: Number(pnlPct.toFixed(4)),
      mae: money(maePct),
      maePct: Number(maePct.toFixed(4)),
      mfe: money(mfePct),
      mfePct: Number(mfePct.toFixed(4)),
    }
  })
})()

// —— 参数曲面：快线 × 慢线 × 止损三个参数，切片 止损 = 1 里有一根孤峰，止损 = 2 里是一片平台 ——

export const SURFACE_FAST = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14] as const
export const SURFACE_SLOW = [20, 30, 40, 50, 60, 70, 80, 90] as const
export const SURFACE_STOP = [1, 2, 3] as const
/** 孤峰的位置：快线 13、慢线 80、止损 1。 */
export const SPIKE = { fast: 13, slow: 80, stop: 1 } as const

export const DEMO_SURFACE: readonly SurfacePoint[] = (() => {
  const rand = seeded(1202)
  const points: SurfacePoint[] = []
  for (const stop of SURFACE_STOP)
    for (const fast of SURFACE_FAST)
      for (const slow of SURFACE_SLOW) {
        // 一座宽缓的山（中心快线 9、慢线 50），止损 2 时最高、1 与 3 时矮一些。
        const hill = Math.exp(-((fast - 9) ** 2 / 9 + (slow - 50) ** 2 / 500)) * (stop === 2 ? 1.0 : 0.7)
        const isSpike = fast === SPIKE.fast && slow === SPIKE.slow && stop === SPIKE.stop
        const sharpe = isSpike ? 1.95 : 0.18 + hill + (rand() - 0.5) * 0.12
        const net = (sharpe - 0.5) * 42_000
        points.push({
          id: `f${fast}-s${slow}-k${stop}`,
          params: { fast, slow, stop },
          metrics: {
            sharpe: Number(sharpe.toFixed(2)),
            net: Math.round(net),
            drawdown: Number((0.34 - sharpe * 0.1 + (rand() - 0.5) * 0.03).toFixed(3)),
          },
        })
      }
  return points
})()

// —— 步进窗口：2018 起，样本内两年、样本外半年，每次步进半年；滚动与锚定各一套 ——

const YEAR = 365 * DAY
const at = (year: number, month: number) => Date.UTC(year, month - 1, 1)

/** 八个窗口：样本外第 3、6 个窗口亏损。passed 的判据是演示用的：样本外收益 > 1%。 */
function walkForward(mode: 'rolling' | 'anchored'): WalkForwardWindow[] {
  const rand = seeded(mode === 'rolling' ? 1203 : 1204)
  const outcomes = [0.045, 0.062, -0.031, 0.08, 0.021, -0.012, 0.055, 0.038]
  return outcomes.map((out, i) => {
    const outStart = at(2020 + Math.floor(i / 2), i % 2 === 0 ? 1 : 7)
    const outEnd = outStart + 0.5 * YEAR
    const inEnd = outStart
    const inStart = mode === 'rolling' ? inEnd - 2 * YEAR : at(2018, 1)
    const years = (inEnd - inStart) / YEAR
    // 样本内收益约每年 18% 上下；锚定窗口越拉越长，总收益随之复利。
    const inReturn = Number((1.18 ** years * (1 + (rand() - 0.5) * 0.06) - 1).toFixed(3))
    return {
      id: `${mode}-${i + 1}`,
      inStart,
      inEnd,
      outStart,
      outEnd,
      params: {
        fast: String(8 + ((i * 3) % 6)),
        slow: String(40 + ((i * 10) % 40)),
        stop: `${1 + (i % 3)}%`,
      },
      inReturn,
      outReturn: out,
      passed: out > 0.01,
    }
  })
}

export const DEMO_WALK_FORWARD = { rolling: walkForward('rolling'), anchored: walkForward('anchored') } as const

// —— 格式化（演示里写中文）——

export const pct1 = (value: number) => `${value > 0 ? '+' : ''}${(value * 100).toFixed(1)}%`
export const pct2 = (value: number) => `${value > 0 ? '+' : ''}${(value * 100).toFixed(2)}%`
export const money = (value: number) =>
  `${value > 0 ? '+' : value < 0 ? '-' : ''}${Math.abs(value).toLocaleString('en-US')}`
export const ratio0 = (value: number) => `${(value * 100).toFixed(0)}%`
export const duration = (ms: number) => `${Math.round(ms / DAY)} 天`
export const dateText = (time: number) => dayOf(time)
