// SPDX-License-Identifier: MIT
// TagCombobox 的纯逻辑：过滤与命中位置（大小写、重音不分，空格分开的几个词都要命中）、高亮项怎么走、键盘在「标签 + 输入框 + 列表」之间怎么走。
// 键盘规矩（交互参照 Jamie Merrill 的 Multi select combobox，2026-11-24 逐帧看，只借交互）：
//   ↑ ↓ 在列表里移高亮（首尾相接），列表关着时开；Enter 切换高亮行（列表开着时 Enter 不会落空去提交表单）；Esc 先收列表、再取消标签选中；
//   输入为空时 Backspace：第一次选中最后一个标签，第二次删掉它；← → 在标签间移，→ 过了最后一个回到输入框；Delete 与 Backspace 删选中的标签。

/** 命中区间：半开 [start, end)，下标按原文（不是折叠后的文字）。 */
export type MatchRange = readonly [start: number, end: number]

export type SearchableOption = {
  label: string
  description?: string
  /** Extra words that match without showing, for example a ticker or an alias. */
  keywords?: readonly string[]
}

export type FilteredRow<T> = { option: T; index: number; labelRanges: MatchRange[]; descriptionRanges: MatchRange[] }

/** 折叠：小写并去掉重音（NFD 后丢组合记号），逐字处理好把折叠后的下标映回原文。 */
function fold(text: string): { folded: string; origin: number[] } {
  let folded = ''
  const origin: number[] = []
  let at = 0
  for (const char of text) {
    const piece = char.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
    for (let i = 0; i < piece.length; i += 1) origin.push(at)
    folded += piece
    at += char.length
  }
  origin.push(at)
  return { folded, origin }
}

/** 搜索词拆成折叠后的词（空格、制表符分开，空的丢掉）。 */
export function queryTokens(query: string): string[] {
  return fold(query).folded.split(/\s+/).filter(Boolean)
}

/** text 里每个词出现的位置，合并重叠与相接的区间，按先后排。 */
export function matchRanges(text: string, tokens: readonly string[]): MatchRange[] {
  if (tokens.length === 0 || text === '') return []
  const { folded, origin } = fold(text)
  const found: [number, number][] = []
  for (const token of tokens) {
    let from = 0
    for (;;) {
      const hit = folded.indexOf(token, from)
      if (hit < 0) break
      // 折叠后的末位对应原文的哪个字：用它的起点再加上这个字的长度。
      const lastFolded = hit + token.length - 1
      const lastStart = origin[lastFolded]!
      const lastEnd = origin.find((value, i) => i > lastFolded && value > lastStart) ?? text.length
      found.push([origin[hit]!, lastEnd])
      from = hit + token.length
    }
  }
  found.sort((a, b) => a[0] - b[0] || a[1] - b[1])
  const merged: [number, number][] = []
  for (const range of found) {
    const last = merged.at(-1)
    if (last && range[0] <= last[1]) last[1] = Math.max(last[1], range[1])
    else merged.push([range[0], range[1]])
  }
  return merged
}

/** 过滤：每个词都要在 主文字 + 说明 + keywords 里找到；空搜索词全留。保持传入的次序。命中区间只给主文字与说明（keywords 不显示，不标）。 */
export function filterOptions<T extends SearchableOption>(options: readonly T[], query: string): FilteredRow<T>[] {
  const tokens = queryTokens(query)
  const rows: FilteredRow<T>[] = []
  options.forEach((option, index) => {
    if (tokens.length === 0) {
      rows.push({ option, index, labelRanges: [], descriptionRanges: [] })
      return
    }
    const haystack = fold([option.label, option.description ?? '', ...(option.keywords ?? [])].join('\n')).folded
    if (!tokens.every((token) => haystack.includes(token))) return
    rows.push({
      option,
      index,
      labelRanges: matchRanges(option.label, tokens),
      descriptionRanges: option.description ? matchRanges(option.description, tokens) : [],
    })
  })
  return rows
}

/** 把文字按命中区间切成段，hit 为真的那几段是命中的字。 */
export function splitByRanges(text: string, ranges: readonly MatchRange[]): { text: string; hit: boolean }[] {
  const parts: { text: string; hit: boolean }[] = []
  let at = 0
  for (const [start, end] of ranges) {
    if (start > at) parts.push({ text: text.slice(at, start), hit: false })
    parts.push({ text: text.slice(start, end), hit: true })
    at = end
  }
  if (at < text.length) parts.push({ text: text.slice(at), hit: false })
  return parts
}

/** 高亮项走一步（首尾相接）。当前高亮不在列表里时，往下落第一项、往上落最后一项。 */
export function stepActive(ids: readonly string[], active: string | null, delta: 1 | -1): string | null {
  if (ids.length === 0) return null
  const at = active === null ? -1 : ids.indexOf(active)
  if (at < 0) return delta === 1 ? ids[0]! : ids[ids.length - 1]!
  return ids[(at + delta + ids.length) % ids.length]!
}

/** 切换一个 id：已选就去掉，没选就接在末尾（标签按选的先后排）。 */
export function toggleId(value: readonly string[], id: string): string[] {
  return value.includes(id) ? value.filter((other) => other !== id) : [...value, id]
}

export type TagComboboxKeyContext = {
  /** The list is open. */
  open: boolean
  /** The list has at least one row to highlight. */
  hasRows: boolean
  /** What is typed in the box. */
  draft: string
  /** Number of tags in the field. */
  count: number
  /** Index of the tag selected by Backspace or the arrow keys, or null. */
  picked: number | null
}

export type TagComboboxKeyAction =
  | { type: 'open' }
  | { type: 'close' }
  | { type: 'move'; delta: 1 | -1 }
  | { type: 'toggle' }
  | { type: 'pick'; index: number }
  | { type: 'unpick' }
  | { type: 'remove'; index: number }
  /** Do nothing, but keep the browser from acting on the key (Enter must not submit the form around the field while the list is open). */
  | { type: 'swallow' }

/** 一个按键该做什么；返回 null 表示不管（交给浏览器：打字、移光标、Tab、表单的 Enter）。 */
export function tagComboboxKeyAction(key: string, context: TagComboboxKeyContext): TagComboboxKeyAction | null {
  const { open, hasRows, draft, count, picked } = context
  switch (key) {
    case 'ArrowDown':
    case 'ArrowUp':
      if (!open) return { type: 'open' }
      return hasRows ? { type: 'move', delta: key === 'ArrowDown' ? 1 : -1 } : null
    case 'Enter':
      // 列表开着，Enter 一律归这个件：没有行可切、或正选着标签时也不让它提交外面的表单；列表关着才交给浏览器。
      if (!open) return null
      return hasRows && picked === null ? { type: 'toggle' } : { type: 'swallow' }
    case 'Escape':
      if (open) return { type: 'close' }
      return picked !== null ? { type: 'unpick' } : null
    case 'Backspace':
      if (picked !== null) return { type: 'remove', index: picked }
      return draft === '' && count > 0 ? { type: 'pick', index: count - 1 } : null
    case 'Delete':
      return picked !== null ? { type: 'remove', index: picked } : null
    case 'ArrowLeft':
      if (picked !== null) return { type: 'pick', index: Math.max(0, picked - 1) }
      return draft === '' && count > 0 ? { type: 'pick', index: count - 1 } : null
    case 'ArrowRight':
      if (picked === null) return null
      return picked < count - 1 ? { type: 'pick', index: picked + 1 } : { type: 'unpick' }
    default:
      return null
  }
}
