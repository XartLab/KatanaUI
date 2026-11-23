// SPDX-License-Identifier: MIT
// 稳健性门的纯逻辑：一条判定 = 实测值 对 阈值 的比较，汇总通过与否。阈值与比较方向全由调用方给，这里没有任何写死的数字。不带 React 与 DOM。

export type GateOp = 'gte' | 'gt' | 'lte' | 'lt'

export type GateCheck = {
  id: string
  name: string
  /** 实测值；还没有（没跑到、没数据）是 null，判为「未知」，不算通过也不算失败。 */
  value: number | null
  threshold: number
  /** 怎样算过：gte 实测 ≥ 阈值，lte 实测 ≤ 阈值，gt / lt 不含等号。 */
  op: GateOp
}

export type GateState = 'pass' | 'fail' | 'unknown'

export function evaluateCheck(check: Pick<GateCheck, 'value' | 'threshold' | 'op'>): GateState {
  const { value, threshold, op } = check
  if (value === null || !Number.isFinite(value) || !Number.isFinite(threshold)) return 'unknown'
  const ok =
    op === 'gte'
      ? value >= threshold
      : op === 'gt'
        ? value > threshold
        : op === 'lte'
          ? value <= threshold
          : value < threshold
  return ok ? 'pass' : 'fail'
}

export type GateSummary = {
  total: number
  passed: number
  failed: number
  unknown: number
  /** 全部通过才算过；只要有一条失败或未知就不过（未知不能当通过放行）。没有判定条时不过。 */
  open: boolean
}

export function summarizeGate(checks: readonly GateCheck[]): GateSummary {
  const states = checks.map(evaluateCheck)
  const count = (state: GateState) => states.filter((s) => s === state).length
  const passed = count('pass')
  return {
    total: checks.length,
    passed,
    failed: count('fail'),
    unknown: count('unknown'),
    open: checks.length > 0 && passed === checks.length,
  }
}

/**
 * 判定条的画法：条长表示实测值，阈值是一根刻线。横轴上限取 实测与阈值 里较大者的 1.25 倍（给刻线后面留一点），
 * 都不是正数时退成 1。返回实测与阈值在条上的位置（0..1）。
 */
export function gateBar(check: Pick<GateCheck, 'value' | 'threshold'>): { value: number | null; threshold: number } {
  const top = Math.max(check.value ?? 0, check.threshold, 0) * 1.25 || 1
  const at = (n: number) => Math.min(1, Math.max(0, n / top))
  return {
    value: check.value === null || !Number.isFinite(check.value) ? null : at(check.value),
    threshold: at(check.threshold),
  }
}

/** 比较符号的文字（给读屏与图例；包里不带语言，符号是数学符号）。 */
export const OP_SYMBOL: Record<GateOp, string> = { gte: '≥', gt: '>', lte: '≤', lt: '<' }
