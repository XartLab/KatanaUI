// SPDX-License-Identifier: MIT
// 设计稿覆盖表的纯逻辑（#1870）：手写映射 coverage-map.json 的类型、汇总、落点文字。
// 脚本（scripts/coverage.mjs，用 Node 直接跑 .ts，所以只用可擦除的类型写法）与文档站的「覆盖」页（gallery）共用这一份，两边的数字不会各算各的。

export const KINDS = ['基础件', '自有件', '量化', '积木', '面板'] as const
export const STATUSES = ['已做', '部分', '没做'] as const

export type Kind = (typeof KINDS)[number]
export type Status = (typeof STATUSES)[number]

export interface CoverageEntry {
  /** 这张卡落在哪一类：基础件（primitives）、自有件（katana）、量化（quant）、积木（blocks，#1869）、面板（src/panels 或应用外壳）。 */
  kind: Kind
  status: Status
  /** 现在就存在的落点：包的出口名（Button、Led），或仓库里的路径（src/panels/positions）。脚本核对它们真的存在。已做与部分必须有。 */
  at: readonly string[]
  /** 还不存在、已经定了名字的落点（#1869 的 DataGrid、EmptyState、Toolbar）：不核对，落地以后挪进 at。 */
  planned?: readonly string[]
  /** 一句话：部分是缺什么，没做是为什么还没做。 */
  note?: string
}

export interface CoverageMap {
  cards: Readonly<Record<string, CoverageEntry>>
}

export interface KindSummary {
  kind: Kind
  done: number
  partial: number
  none: number
  total: number
}

/** 各归属的已做 / 部分 / 没做 / 总数。 */
export function summarize(map: CoverageMap): KindSummary[] {
  return KINDS.map((kind) => {
    const entries = Object.values(map.cards).filter((entry) => entry.kind === kind)
    const count = (status: Status) => entries.filter((entry) => entry.status === status).length
    return { kind, done: count('已做'), partial: count('部分'), none: count('没做'), total: entries.length }
  })
}

/** 「落在哪里」一栏的文字：现有落点，再加计划里的。 */
export function whereText(entry: CoverageEntry): string {
  const parts = entry.at.map((name) => `\`${name}\``)
  if (entry.planned?.length) parts.push(`计划：${entry.planned.map((name) => `\`${name}\``).join('、')}`)
  return parts.length > 0 ? parts.join('、') : '—'
}
