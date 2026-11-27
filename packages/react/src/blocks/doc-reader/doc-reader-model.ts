// SPDX-License-Identifier: MIT
// 文档阅读器（DocReader，KATANAview #2395）的纯函数：从块里抽目录、按关键词找命中、把一段字切成命中 / 非命中的片段。

/** 一块：标题（level 1..4）或正文段落。id 稳定，宿主拿它拼引用（kref:）。 */
export type DocBlock = { id: string; kind: 'heading' | 'paragraph'; text: string; level?: number }

export type DocOutlineItem = { id: string; text: string; level: number }

/** 目录：全部标题块，level 缺省是 1，越界夹到 1..4。 */
export function docOutline(blocks: readonly DocBlock[]): DocOutlineItem[] {
  return blocks
    .filter((block) => block.kind === 'heading')
    .map((block) => ({ id: block.id, text: block.text, level: Math.min(4, Math.max(1, Math.round(block.level ?? 1))) }))
}

/** 关键词规整：去首尾空白、不分大小写；空串表示不搜。 */
export const normalizeQuery = (query: string) => query.trim().toLocaleLowerCase()

/** 有命中的块的 id，按文档次序。 */
export function docMatches(blocks: readonly DocBlock[], query: string): string[] {
  const q = normalizeQuery(query)
  if (q === '') return []
  return blocks.filter((block) => block.text.toLocaleLowerCase().includes(q)).map((block) => block.id)
}

/** 把一段字按关键词切开：hit 为 true 的片段要高亮。不分大小写，保留原文的大小写。 */
export function splitHits(text: string, query: string): { text: string; hit: boolean }[] {
  const q = normalizeQuery(query)
  if (q === '') return [{ text, hit: false }]
  const lower = text.toLocaleLowerCase()
  const out: { text: string; hit: boolean }[] = []
  let at = 0
  for (;;) {
    const found = lower.indexOf(q, at)
    if (found < 0) break
    if (found > at) out.push({ text: text.slice(at, found), hit: false })
    out.push({ text: text.slice(found, found + q.length), hit: true })
    at = found + q.length
  }
  if (at < text.length) out.push({ text: text.slice(at), hit: false })
  return out.length === 0 ? [{ text, hit: false }] : out
}
