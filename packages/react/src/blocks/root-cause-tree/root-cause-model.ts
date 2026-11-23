// SPDX-License-Identifier: MIT
// 排查树的纯逻辑（KATANAview #1908）：故障在顶上，下面一层层假设；每个假设是 待查 / 在查 / 已排除 / 已确认。
// 已确认且没有子假设的是「根因」，从它到故障的一条路点亮。键盘照 APG 树：↑↓ 上下一行、← 回父、→ 到第一个子、Home / End 到头尾。不带 React 与 DOM。

/** Check state of one hypothesis. */
export type CauseStatus = 'open' | 'checking' | 'ruledOut' | 'confirmed'

/** How children cause their parent: or means one is enough, and means they must occur together. */
export type CauseGate = 'or' | 'and'

/** Proof behind a verdict. */
export type CauseEvidence = {
  /** Kind of proof, such as Log, Diff or Query. */
  kind: string
  /** The proof itself, shown as code. */
  content: string
}

/** One hypothesis of the tree. */
export type Cause = {
  /** Stable key. */
  id: string
  /** Hypothesis in one line. */
  title: string
  /** Check state; defaults to open. */
  status?: CauseStatus
  /** How the children cause this one; defaults to or. */
  gate?: CauseGate
  /** Verdict sentence once checked. */
  verdict?: string
  /** Proof once checked. */
  evidence?: CauseEvidence
  /** Files or sources involved. */
  files?: readonly string[]
  /** When it was checked, in milliseconds. */
  at?: number
  /** Narrower hypotheses. */
  children?: readonly Cause[]
}

/** The failure at the top of the tree. */
export type CauseFailure = {
  /** Stable key. */
  id: string
  /** What failed. */
  title: string
  /** One short detail line, such as how many bars are missing. */
  detail?: string
  /** How the top hypotheses cause the failure; defaults to or. */
  gate?: CauseGate
  /** Top hypotheses. */
  children: readonly Cause[]
}

/** One visible row: the failure (depth 0) or a hypothesis. */
export type CauseRow = {
  id: string
  depth: number
  parentId: string | null
  /** The failure row has no cause. */
  cause: Cause | null
  hasChildren: boolean
}

/** 前序展开成行：故障一行在最前（depth 0），子假设按给的次序。 */
export function flattenCauses(failure: CauseFailure): CauseRow[] {
  const rows: CauseRow[] = [
    { id: failure.id, depth: 0, parentId: null, cause: null, hasChildren: failure.children.length > 0 },
  ]
  const walk = (causes: readonly Cause[], depth: number, parentId: string) => {
    for (const cause of causes) {
      const children = cause.children ?? []
      rows.push({ id: cause.id, depth, parentId, cause, hasChildren: children.length > 0 })
      walk(children, depth + 1, cause.id)
    }
  }
  walk(failure.children, 1, failure.id)
  return rows
}

/** 根因：已确认，且没有更细的子假设。 */
export const isRootCause = (cause: Cause): boolean =>
  cause.status === 'confirmed' && (cause.children === undefined || cause.children.length === 0)

/** 点亮的路：每个根因与它到故障的所有祖先（含故障）。没有根因时是空集。 */
export function litPath(failure: CauseFailure): Set<string> {
  const lit = new Set<string>()
  const walk = (causes: readonly Cause[], trail: readonly string[]) => {
    for (const cause of causes) {
      const next = [...trail, cause.id]
      if (isRootCause(cause)) for (const id of next) lit.add(id)
      walk(cause.children ?? [], next)
    }
  }
  walk(failure.children, [failure.id])
  return lit
}

/** 各状态的个数（头里的「已排除 2 · 已确认 1」）。故障行不算。 */
export function countCauses(failure: CauseFailure): Record<CauseStatus, number> {
  const counts: Record<CauseStatus, number> = { open: 0, checking: 0, ruledOut: 0, confirmed: 0 }
  for (const row of flattenCauses(failure)) if (row.cause) counts[row.cause.status ?? 'open'] += 1
  return counts
}

/**
 * 键盘移动焦点：返回下一行的 id；这个键不归树管返回 undefined（调用方不 preventDefault）。
 * ↑↓ 上一行 / 下一行（到头不动）；← 父行（故障行不动）；→ 第一个子行（没有子不动）；Home 故障行；End 最后一行。
 */
export function moveCause(rows: readonly CauseRow[], currentId: string, key: string): string | undefined {
  const index = rows.findIndex((row) => row.id === currentId)
  if (index < 0 || rows.length === 0) return undefined
  const row = rows[index]!
  switch (key) {
    case 'ArrowUp':
      return rows[Math.max(0, index - 1)]!.id
    case 'ArrowDown':
      return rows[Math.min(rows.length - 1, index + 1)]!.id
    case 'ArrowLeft':
      return row.parentId ?? row.id
    case 'ArrowRight':
      return row.hasChildren ? rows[index + 1]!.id : row.id
    case 'Home':
      return rows[0]!.id
    case 'End':
      return rows[rows.length - 1]!.id
    default:
      return undefined
  }
}
