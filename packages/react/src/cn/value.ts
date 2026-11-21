// SPDX-License-Identifier: MIT
// 第 0 层（#110）：「取不到写 —」规则的公共写法。数可以带上取不到的原因（悬停时写），不写 0（KATANAview decisions.md 2026-11-11）。

/** 一个读数：数，或取不到（null / undefined），或带原因的数。 */
export type CnValue = number | null | undefined | { value: number | null | undefined; reason?: string }

/** 拆成数与原因；非有限数当作取不到。 */
export function readCnValue(input: CnValue): { value: number | null; reason: string | undefined } {
  const raw = typeof input === 'object' && input !== null ? input.value : input
  const reason = typeof input === 'object' && input !== null ? input.reason : undefined
  return { value: typeof raw === 'number' && Number.isFinite(raw) ? raw : null, reason }
}

export const DASH = '—'
