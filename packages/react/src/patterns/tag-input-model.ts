// SPDX-License-Identifier: MIT
// TagInput 的纯逻辑（patterns/tag-input.tsx）：把输入框里的草稿收成标签、判重、校验、上限，以及键盘在标签之间怎么走。
// 键位与判重照 Arc tag-input（https://github.com/kuratlielia/arc-library ，MIT，Copyright (c) 2026 Elia Kuratli；2026-11-23 读，提交 8302b52）：
// Enter 或逗号收下草稿；重复的（不分大小写）不收、点一下已有的那个；光标在框头时 Backspace 先选中最后一个标签，再按一次才删；← → 在标签间移；Esc 取消选中。
// 我们加的：粘贴或草稿里带逗号、换行、制表符时一次拆成几个标签（粘一串代码「600519, 000001」）；normalize 先整理（代码转大写）；validate 不过的不收；max 封顶。

/** What committing a draft did. */
export type TagCommit = {
  /** The tag list after the commit. */
  next: string[]
  /** Tags that were added, in order. */
  added: string[]
  /** Existing tags the draft repeated (case-insensitive); not added again. */
  duplicates: string[]
  /** Tags turned down by validate or by max, with the reason (validate's message, or null when max was reached). */
  rejected: { tag: string; reason: string | null }[]
}

export type TagCommitOptions = {
  /** Tidy a raw tag before it is checked (trim is always done first). */
  normalize?: (tag: string) => string
  /** Return a message to turn a tag down, or null to accept it. */
  validate?: (tag: string) => string | null | undefined
  /** Largest number of tags. */
  max?: number
}

/** 草稿里能当分隔的字符：逗号（含全角）、分号、换行、制表符。 */
const SEPARATORS = /[,，;；\n\r\t]+/

/** Splits a draft or a pasted string into trimmed, non-empty pieces. */
export function splitTags(raw: string): string[] {
  return raw
    .split(SEPARATORS)
    .map((piece) => piece.trim())
    .filter((piece) => piece.length > 0)
}

/** Does the text contain a separator, so a paste should be split instead of typed in? */
export const hasSeparator = (raw: string): boolean => SEPARATORS.test(raw)

/** Commits a draft into the current tags: splits it, tidies each piece, skips repeats, applies validate and max. */
export function commitTags(current: readonly string[], raw: string, options: TagCommitOptions = {}): TagCommit {
  const { normalize, validate, max } = options
  const next = [...current]
  const added: string[] = []
  const duplicates: string[] = []
  const rejected: TagCommit['rejected'] = []
  for (const piece of splitTags(raw)) {
    const tag = normalize ? normalize(piece).trim() : piece
    if (!tag) continue
    const existing = next.find((item) => item.toLowerCase() === tag.toLowerCase())
    if (existing !== undefined) {
      if (!duplicates.includes(existing)) duplicates.push(existing)
      continue
    }
    const problem = validate?.(tag) ?? null
    if (problem) {
      rejected.push({ tag, reason: problem })
      continue
    }
    if (max !== undefined && next.length >= max) {
      rejected.push({ tag, reason: null })
      continue
    }
    next.push(tag)
    added.push(tag)
  }
  return { next, added, duplicates, rejected }
}

/** What a key press in the field should do. */
export type TagKeyAction =
  | { type: 'commit' }
  | { type: 'remove'; index: number }
  | { type: 'pick'; index: number | null }

/**
 * Maps a key press in the field to an action, or null to let the field handle it.
 * `picked` is the index of the selected tag (null for none); `atStart` says the caret sits at the start with nothing selected.
 */
export function tagKeyAction(
  key: string,
  state: { count: number; picked: number | null; atStart: boolean; hasDraft: boolean },
): TagKeyAction | null {
  const { count, picked, atStart, hasDraft } = state
  if (key === 'Enter' || key === ',') return hasDraft || key === ',' ? { type: 'commit' } : null
  if ((key === 'Backspace' || key === 'Delete') && picked !== null) return { type: 'remove', index: picked }
  if (key === 'Backspace' && atStart && count > 0) return { type: 'pick', index: count - 1 }
  if (key === 'ArrowLeft' && (atStart || picked !== null)) {
    const from = picked ?? count
    return from > 0 ? { type: 'pick', index: from - 1 } : null
  }
  if (key === 'ArrowRight' && picked !== null) return { type: 'pick', index: picked + 1 < count ? picked + 1 : null }
  if (key === 'Escape' && picked !== null) return { type: 'pick', index: null }
  return null
}
