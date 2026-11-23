// SPDX-License-Identifier: MIT
// AiDiff 的纯逻辑：行的种类与增删计数。

export type AiDiffLineKind = 'added' | 'removed' | 'context'

export type AiDiffLine = {
  /** The text of the line. */
  content: string
  /** Whether the line was added, removed, or is unchanged context. */
  kind: AiDiffLineKind
  /** Line number in the file; omit it for tabular data (such as parameters) instead of code. */
  number?: number
}

/** 行首符号：新增 +、删除 -、上下文空格。 */
export const DIFF_PREFIX: Readonly<Record<AiDiffLineKind, string>> = { added: '+', removed: '-', context: ' ' }

/** 增、删各多少行（标题栏的 +N -M）。 */
export function countDiff(lines: readonly AiDiffLine[]): { added: number; removed: number } {
  let added = 0
  let removed = 0
  for (const line of lines) {
    if (line.kind === 'added') added += 1
    else if (line.kind === 'removed') removed += 1
  }
  return { added, removed }
}
