// SPDX-License-Identifier: MIT
// 步进窗口矩阵的纯逻辑：年化、步进效率、汇总、时间轴上的条位置。不带 React 与 DOM。
// 窗口怎么切、每个窗口里选哪组参数是优化内核的事；件只汇总调用方给的每窗口结果。

export type WalkForwardMode = 'rolling' | 'anchored'

export type WalkForwardWindow = {
  id: string
  /** 样本内区间 [start, end]（毫秒）。锚定模式里每个窗口的 start 相同，滚动模式里 start 随窗口后移。 */
  inStart: number
  inEnd: number
  /** 样本外区间 [start, end]（毫秒）。 */
  outStart: number
  outEnd: number
  /** 这个窗口样本内选出的参数（已格式化的文字，键是参数名）。 */
  params: Readonly<Record<string, string>>
  /** 区间总收益（小数，0.08 即 8%）。 */
  inReturn: number
  outReturn: number
  /** 这个窗口算不算通过：判据（如样本外盈利、回撤不超限）是调用方的策略，件不判。 */
  passed: boolean
}

/** 一年的毫秒数（365 天）：年化只要两边口径一致，365 与 365.25 的差别在比值里消掉。 */
export const YEAR_MS = 365 * 86_400_000

/** 区间总收益年化：(1+r)^(一年/区间长度) − 1。区间长度非正、收益 ≤ -100% 返回 null。 */
export function annualize(totalReturn: number, spanMs: number): number | null {
  if (!(spanMs > 0) || !Number.isFinite(totalReturn) || totalReturn <= -1) return null
  return (1 + totalReturn) ** (YEAR_MS / spanMs) - 1
}

export type WalkForwardSummary = {
  windows: number
  passed: number
  /** 样本外收益为正的窗口占比（0..1）；没有窗口是 null。 */
  profitableShare: number | null
  /** 各窗口样本内、样本外年化收益的平均。 */
  inAnnualized: number | null
  outAnnualized: number | null
  /** 步进效率 = 样本外年化 / 样本内年化。样本内年化 ≤ 0 时没有意义，是 null。 */
  efficiency: number | null
}

const average = (values: readonly (number | null)[]): number | null => {
  const clean = values.filter((v): v is number => v !== null)
  return clean.length === 0 ? null : clean.reduce((a, b) => a + b, 0) / clean.length
}

/**
 * 汇总。取各窗口年化的平均而不是把区间首尾相接再复利：锚定模式的样本内区间互相重叠，复利会把同一段行情算很多遍。
 */
export function summarizeWindows(windows: readonly WalkForwardWindow[]): WalkForwardSummary {
  const inAnnualized = average(windows.map((w) => annualize(w.inReturn, w.inEnd - w.inStart)))
  const outAnnualized = average(windows.map((w) => annualize(w.outReturn, w.outEnd - w.outStart)))
  return {
    windows: windows.length,
    passed: windows.filter((w) => w.passed).length,
    profitableShare: windows.length === 0 ? null : windows.filter((w) => w.outReturn > 0).length / windows.length,
    inAnnualized,
    outAnnualized,
    efficiency:
      inAnnualized === null || outAnnualized === null || !(inAnnualized > 0) ? null : outAnnualized / inAnnualized,
  }
}

/** 所有窗口覆盖的时间范围（样本内起点到样本外终点）；没有窗口是 null。 */
export function windowSpan(windows: readonly WalkForwardWindow[]): { start: number; end: number } | null {
  if (windows.length === 0) return null
  return {
    start: Math.min(...windows.map((w) => w.inStart)),
    end: Math.max(...windows.map((w) => w.outEnd)),
  }
}

/** 一个区间在时间轴上的位置，百分比（左边界与宽度）；范围退化时占满。 */
export function barBox(
  start: number,
  end: number,
  span: { start: number; end: number },
): { left: number; width: number } {
  const total = span.end - span.start
  if (!(total > 0)) return { left: 0, width: 100 }
  return { left: ((start - span.start) / total) * 100, width: Math.max(0.5, ((end - start) / total) * 100) }
}

/** 窗口所有选出的参数名（按首次出现的顺序），表头与比较用。 */
export function paramNames(windows: readonly WalkForwardWindow[]): string[] {
  const names: string[] = []
  for (const w of windows) for (const name of Object.keys(w.params)) if (!names.includes(name)) names.push(name)
  return names
}
