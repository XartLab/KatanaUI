// SPDX-License-Identifier: MIT
// 万能框的纯规则（#224）：分类计数、分组与「显示全部」、命中段、意图检测、输入法组字判断、页签轮转、最近列表。
// 不碰 DOM、不带文案；组件在 omnibox.tsx。交互借 Jamie Merrill 的搜索系列（2026-11-24 看的录屏帧），实现原创。
import type { ReactNode } from 'react'

/** 行的种类：决定回车做什么。object 回车变成输入框里的作用域标签，command 直接运行，page 直接打开。 */
export type OmniboxKind = 'object' | 'command' | 'page'

export type OmniboxItem = {
  /** Stable id (recent list and highlight key on it). */
  id: string
  /** Category id (a tab); items of scope actions need none. */
  category?: string
  /** Main text of the row. */
  label: string
  /** Second, quieter text on the same row (exchange, path, type). */
  description?: string
  /** What Enter does: `object` becomes a scope tag, `command` runs, `page` opens. Defaults to `command`. */
  kind?: OmniboxKind
  /** Leading icon or mark. */
  icon?: ReactNode
  /** Quiet text at the end of the row; replaced by the Enter hint while the row is highlighted. */
  meta?: ReactNode
  /** Preview card shown beside the panel while the row is highlighted (render the node yourself; screen readers do not read it). */
  preview?: ReactNode
  /** Overrides the Enter hint text of the row. */
  hint?: string
  /** For `object` rows: set to false to act directly instead of becoming a scope tag. */
  scope?: boolean
  /** Caller's own type tag (`symbol`, `strategy`) for choosing which actions a scope offers. */
  type?: string
  disabled?: boolean
}

export type OmniboxCategory = { id: string; label: string }

/** 回车该不该把这一行变成作用域标签。 */
export const isScopable = (item: OmniboxItem): boolean => (item.kind ?? 'command') === 'object' && item.scope !== false

/** 每个类别里的条数；没有类别的记在空串下。 */
export function countByCategory(items: readonly OmniboxItem[]): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const item of items) counts[item.category ?? ''] = (counts[item.category ?? ''] ?? 0) + 1
  return counts
}

/** 一行：真的条目，或「显示全部 N」。 */
export type OmniboxRow =
  | { type: 'item'; key: string; item: OmniboxItem; recent: boolean }
  | { type: 'more'; key: string; category: string; count: number }

export type OmniboxSection = { id: string; heading?: string; rows: OmniboxRow[]; recent?: boolean }

export type BuildSectionsInput = {
  /** Results of the current query. */
  items: readonly OmniboxItem[]
  /** Categories in order, the first being the "all" tab. */
  categories: readonly OmniboxCategory[]
  /** Active tab id. */
  category: string
  /** Whether a scope is set (scope actions are one flat list). */
  scoped: boolean
  /** Recent items, shown only for an empty query in the all tab. */
  recent: readonly OmniboxItem[]
  /** Whether the query is empty. */
  empty: boolean
  /** Rows per category in the all tab before the "show all" row. */
  perCategory: number
  /** Heading of the recent group. */
  recentHeading?: string
}

/**
 * 结果区要画的分组（纯函数）：作用域下是一整串动作；「全部」页签是最近（空查询时）加每个类别的前 perCategory 条、多的给一行「显示全部 N」；
 * 单个类别页签是那一类的全部。row.key 唯一（最近的行带 `recent:` 前缀），也是 cmdk 的 value。
 */
export function buildSections({
  items,
  categories,
  category,
  scoped,
  recent,
  empty,
  perCategory,
  recentHeading,
}: BuildSectionsInput): OmniboxSection[] {
  const itemRow = (item: OmniboxItem, recentRow = false): OmniboxRow => ({
    type: 'item',
    key: `${recentRow ? 'recent:' : ''}${item.id}`,
    item,
    recent: recentRow,
  })
  if (scoped) return items.length ? [{ id: 'scope', rows: items.map((item) => itemRow(item)) }] : []
  const [all, ...rest] = categories
  if (category !== (all?.id ?? 'all')) {
    const list = items.filter((item) => item.category === category)
    return list.length ? [{ id: category, rows: list.map((item) => itemRow(item)) }] : []
  }
  const sections: OmniboxSection[] = []
  if (empty && recent.length) {
    sections.push({
      id: 'recent',
      heading: recentHeading,
      recent: true,
      rows: recent.map((item) => itemRow(item, true)),
    })
  }
  const known = new Set(rest.map((entry) => entry.id))
  for (const entry of rest) {
    const list = items.filter((item) => item.category === entry.id)
    if (!list.length) continue
    const rows: OmniboxRow[] = list.slice(0, perCategory).map((item) => itemRow(item))
    if (list.length > perCategory)
      rows.push({ type: 'more', key: `more:${entry.id}`, category: entry.id, count: list.length })
    sections.push({ id: entry.id, heading: entry.label, rows })
  }
  // 类别没登记的条目放在最后，不丢。
  const stray = items.filter((item) => !known.has(item.category ?? ''))
  if (stray.length) sections.push({ id: '', rows: stray.map((item) => itemRow(item)) })
  return sections
}

/** 摊平成 key → 行，供 cmdk 的高亮值（value）反查。 */
export const flattenRows = (sections: readonly OmniboxSection[]): Map<string, OmniboxRow> =>
  new Map(sections.flatMap((section) => section.rows).map((row) => [row.key, row]))

/** 把页签 id 往前或往后挪 delta 格，首尾相接。 */
export function cycleCategory(ids: readonly string[], current: string, delta: number): string {
  if (ids.length === 0) return current
  const index = Math.max(0, ids.indexOf(current))
  return ids[(index + delta + ids.length * Math.abs(delta)) % ids.length]!
}

/** 最近列表：放到最前、按 id 去重、限长。 */
export function pushRecentItem(recent: readonly OmniboxItem[], item: OmniboxItem, limit: number): OmniboxItem[] {
  return [item, ...recent.filter((other) => other.id !== item.id)].slice(0, Math.max(0, limit))
}

/** 不分大小写的第一段命中 [start, end)；空词、没命中是 null。 */
export function matchRange(text: string, query: string): [number, number] | null {
  const needle = query.trim().toLowerCase()
  if (!needle) return null
  const start = text.toLowerCase().indexOf(needle)
  return start < 0 ? null : [start, start + needle.length]
}

export function splitMatch(text: string, query: string): { before: string; hit: string; after: string } {
  const range = matchRange(text, query)
  if (!range) return { before: text, hit: '', after: '' }
  return { before: text.slice(0, range[0]), hit: text.slice(range[0], range[1]), after: text.slice(range[1]) }
}

// ---- 意图检测 ----

export type IntentOptions = {
  /** Text at least this long (characters) reads as a question. Defaults to 24. */
  minLength?: number
  /** Text with at least this many space-separated words reads as a question. Defaults to 6. */
  minWords?: number
}

// 疑问词：不是界面文案，是判定用的数据；中英各一份，调用方要别的语言就整个换掉 detectIntent。
const EN_QUESTION = /^(what|how|why|who|whom|whose|when|where|which)\b/i
const ZH_QUESTION_HEAD = /^(什么|怎么|怎样|如何|为什么|为何|哪些|哪个|哪里|哪家|谁|多少|是否|有没有|能不能|可不可以)/
const ZH_QUESTION_TAIL = /(吗|呢|么)$/

/**
 * 默认的意图判定：输入像自然语言问题就返回 true（问号结尾；以疑问词开头且不止一个词；以「吗 / 呢」收尾；字数或词数超阈值）。
 * 调用方可以传自己的判定函数换掉它。纯函数。
 */
export function detectIntent(text: string, { minLength = 24, minWords = 6 }: IntentOptions = {}): boolean {
  const value = text.trim()
  if (!value) return false
  if (/[?？]$/.test(value)) return true
  const words = value.split(/\s+/)
  if (EN_QUESTION.test(value) && words.length > 1) return true
  if (ZH_QUESTION_HEAD.test(value) && value.length > 3) return true
  if (ZH_QUESTION_TAIL.test(value) && value.length > 2) return true
  return value.length >= minLength || words.length >= minWords
}

/** 做一个带阈值的判定函数。 */
export const createIntentDetector =
  (options: IntentOptions = {}) =>
  (text: string): boolean =>
    detectIntent(text, options)

// ---- 输入法 ----

/** 键盘事件是不是输入法在组字（回车、Esc、退格这时是输入法的，不是我们的）。认 isComposing 与老浏览器的 keyCode 229。 */
export const isImeEvent = (event: {
  nativeEvent?: { isComposing?: boolean }
  isComposing?: boolean
  keyCode?: number
}) => Boolean(event.nativeEvent?.isComposing ?? event.isComposing) || event.keyCode === 229

// ---- 行尾提示 ----

export type OmniboxHintLabels = {
  run?: string
  open?: string
  viewOptions?: string
  newTab?: string
}

/** 高亮行行尾的回车提示：按住 ⌘ / Ctrl 时是「新标签」；行自带 hint 优先；对象是「查看选项」，页面「打开」，别的「运行」。 */
export function rowHint(item: OmniboxItem, modifierHeld: boolean, labels: OmniboxHintLabels): string | undefined {
  if (modifierHeld && labels.newTab) return labels.newTab
  if (item.hint) return item.hint
  if (isScopable(item)) return labels.viewOptions
  return (item.kind ?? 'command') === 'page' ? labels.open : labels.run
}
