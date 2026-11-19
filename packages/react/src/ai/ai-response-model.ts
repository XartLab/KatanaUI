// SPDX-License-Identifier: MIT
// 改自 SmoothUI ai-response（https://github.com/educlopez/smoothui ，MIT，© 2024 Eduardo Calvo）
// 流式回答的切词：先按 [n] 引用标记切开（标记粘着标点也要单独成词，否则 `估值 [1],` 里的 [1] 认不出来），
// 再把每段文字按词切。原件按空白切，中文没有空格，整句会是一个词、整句一起进场；这里改用 Intl.Segmenter 的词粒度，中文也能一词一词进。
// 不支持 Segmenter 的环境退回按空白切。

export type ResponseToken = {
  value: string
  /** 是引用标记时，它的序号（[3] 是 3）。 */
  cite?: number
  /** 有字母或数字（带「词」意义）的才做进场动画；空白与标点不包。 */
  word: boolean
}

const MARKER = /(\[\d+\])/
const MARKER_ONLY = /^\[(\d+)\]$/
const HAS_WORD_CHARACTER = /[\p{L}\p{N}]/u

type SegmenterLike = { segment: (input: string) => Iterable<{ segment: string }> }
const segmenters = new Map<string, SegmenterLike | null>()
function segmenterFor(locale: string | undefined): SegmenterLike | null {
  const key = locale ?? ''
  if (!segmenters.has(key)) {
    const Ctor = (Intl as unknown as { Segmenter?: new (l?: string, o?: { granularity: 'word' }) => SegmenterLike })
      .Segmenter
    segmenters.set(key, Ctor ? new Ctor(locale, { granularity: 'word' }) : null)
  }
  return segmenters.get(key) ?? null
}

function segments(text: string, locale: string | undefined): string[] {
  const segmenter = segmenterFor(locale)
  if (segmenter) return Array.from(segmenter.segment(text), (part) => part.segment)
  return text.split(/(\s+)/).filter((part) => part !== '')
}

/** 把回答文本切成词；citations 是有来源可对的序号集合，不在集合里的 [n] 当普通文字。 */
export function tokenizeResponse(text: string, known: ReadonlySet<number>, locale?: string): ResponseToken[] {
  const tokens: ResponseToken[] = []
  for (const chunk of text.split(MARKER)) {
    if (chunk === '') continue
    const match = MARKER_ONLY.exec(chunk)
    if (match && known.has(Number(match[1]))) {
      tokens.push({ value: chunk, cite: Number(match[1]), word: false })
      continue
    }
    for (const part of segments(chunk, locale)) tokens.push({ value: part, word: HAS_WORD_CHARACTER.test(part) })
  }
  return tokens
}
