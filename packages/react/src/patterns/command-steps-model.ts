// SPDX-License-Identifier: MIT
/**
 * Pure helpers for the multi-step flow of the command palette: selections, the select-all tri-state, filtering, header tags.
 * 命令面板多步命令的纯函数（#194）：勾选、全选三态、按输入筛选当前步的选项、头部句子里的小标签。
 * 一步的选择就是一串 id（string[]）；整个流程的选择是 { 步 id: id 串 }，onRun 收到的就是它。
 * 交互参照 Jamie Merrill 的 Command menu（2026-11-24 看）：只借「命令里还有几步」「步骤页的头部句子与全选」，实现原创。
 */

/** One option of a checklist step. */
export type PaletteOption = {
  id: string
  label: string
  /** Gray text after the label (plain text is also searched). */
  description?: string
  /** Extra words the filter also matches. */
  keywords?: readonly string[]
  disabled?: boolean
}

/** Checked, unchecked or partly checked ("mixed", the select-all row). */
export type CheckState = boolean | 'mixed'

/** Selections of a whole flow: step id → chosen ids. */
export type StepSelections = Readonly<Record<string, readonly string[]>>

/** 筛选：标签、说明、关键词里含输入（不分大小写、去首尾空白）就留；空输入全留。 */
export function filterOptions(options: readonly PaletteOption[], search: string): PaletteOption[] {
  const needle = search.trim().toLocaleLowerCase()
  if (needle === '') return [...options]
  return options.filter((option) =>
    [option.label, option.description ?? '', ...(option.keywords ?? [])].some((text) =>
      text.toLocaleLowerCase().includes(needle),
    ),
  )
}

/** 勾上或取消一个 id（返回新数组；不改原数组）。 */
export function toggleId(selected: readonly string[], id: string): string[] {
  return selected.includes(id) ? selected.filter((other) => other !== id) : [...selected, id]
}

/** 全选行的状态：可选项全勾 true、全没勾 false、其余 'mixed'；没有可选项是 false。 */
export function checkState(selectableIds: readonly string[], selected: readonly string[]): CheckState {
  if (selectableIds.length === 0) return false
  const count = selectableIds.filter((id) => selected.includes(id)).length
  return count === 0 ? false : count === selectableIds.length ? true : 'mixed'
}

/** 点全选：已经全勾就把这些取消，否则全勾上；不在 selectableIds 里的已选项（被筛掉的）原样保留。 */
export function toggleAll(selected: readonly string[], selectableIds: readonly string[]): string[] {
  if (checkState(selectableIds, selected) === true) return selected.filter((id) => !selectableIds.includes(id))
  return [...selected, ...selectableIds.filter((id) => !selected.includes(id))]
}

/** 头部句子里的一个小标签：id 给 React 当 key（label 可能重名），label 是字。 */
export type SentenceTag = { id: string; label: string }

/** 已选项的标签，次序照选项表（不照点的先后），不在表里的 id 丢掉。 */
export function selectedTags(options: readonly PaletteOption[], selected: readonly string[]): SentenceTag[] {
  return options.filter((option) => selected.includes(option.id)).map(({ id, label }) => ({ id, label }))
}

/** 头部句子里最多画几个标签，其余折成「+N」。 */
export const MAX_SENTENCE_TAGS = 3

/** 一步的标签与折掉的个数。 */
export function sentenceTags<T>(tags: readonly T[], max = MAX_SENTENCE_TAGS): { shown: T[]; hidden: number } {
  return { shown: tags.slice(0, max), hidden: Math.max(0, tags.length - max) }
}

/** 在 0..length-1 里循环移动高亮（length 为 0 返回 0）。 */
export function moveActive(index: number, delta: number, length: number): number {
  return length === 0 ? 0 : (((index + delta) % length) + length) % length
}

/** 走到哪一步了：命令 id、步序号、已有的选择。 */
export type Flow = { id: string; index: number; selections: StepSelections }

/**
 * 退一步（纯函数）：第一步退回命令列表（返回 null，选择清空）；其余退到上一步，
 * 清掉离开的这一步的选择、留下更早几步的。stepIds 是该命令各步的 id。
 */
export function stepBack(flow: Flow, stepIds: readonly string[]): Flow | null {
  if (flow.index === 0) return null
  const left = stepIds[flow.index]
  const selections = Object.fromEntries(Object.entries(flow.selections).filter(([id]) => id !== left))
  return { ...flow, index: flow.index - 1, selections }
}
