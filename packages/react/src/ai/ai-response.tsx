// SPDX-License-Identifier: MIT
// 改自 SmoothUI ai-response（https://github.com/educlopez/smoothui ，MIT，© 2024 Eduardo Calvo）
// 流式的助手文字：词「到了才进场」（淡入、去模糊、上移 2px），不是定时器逐字打——定时打字机会和真实流的节奏脱节，开始谎报模型答得多快。
// 组件记住上一次渲染有多少词，只给新来的词做进场；位置当 key（按文字当 key 会让每次 token 延长末词时整个词重新进场）。
// 正文里的 [n] 标记换成行内引用小标：直接用我们的 WebSearchCitation（悬停停一会儿或聚焦弹出站名、标题、摘要；不存也不开 URL，决策记录 0011），不再另做一个引用件。
// 相对原件：切词用 Intl.Segmenter（中文也能一词一词进，见 ai-response-model.ts）；引用走 WebSearchCitation；光标用 CSS 明灭；去掉 reduced-motion 分支。
import { motion } from 'motion/react'
import { Fragment, useMemo, useState } from 'react'
import { WebSearchCitation, type WebSource } from '../katana/web-search.tsx'
import { cn } from '../lib/cn.ts'
import { snappy } from '../lib/motion.ts'
import { unit } from '../lib/spring.ts'
import { tokenizeResponse } from './ai-response-model.ts'

/** 新词进场前的模糊半径（原件 WORD_BLUR_PX）。 */
const WORD_BLUR_PX = 4
/**
 * 提到模块级并冻住：motion 在 transition 对象换了引用时会重启动画，而这个组件每个 token 都重渲染。
 * 也不按下标给 delay：随文本变长，渲染时算出的 delay 会变成负数，进场永远走不完。词的错开靠 token 到达本身。
 */
const WORD_TRANSITION = unit(snappy)

export type AiResponseCitation = {
  /** The number in the `[n]` marker of the text. */
  index: number
  /** The source the marker points to. */
  source: WebSource
}

export type AiResponseProps = {
  /** The response so far; re-render it as it grows. */
  text: string
  /** Sources referenced by `[n]` markers in the text; unknown markers stay plain text. */
  citations?: readonly AiResponseCitation[]
  /** Shows a caret after the last word. */
  isStreaming?: boolean
  /** BCP 47 locale for word segmentation, such as "zh-CN"; defaults to the page language. */
  locale?: string
  /** Extra class name on the root. */
  className?: string
}

export function AiResponse({ text, citations, isStreaming = false, locale, className }: AiResponseProps) {
  const known = useMemo(() => new Set((citations ?? []).map((citation) => citation.index)), [citations])
  const tokens = useMemo(() => tokenizeResponse(text, known, locale), [text, known, locale])
  // 上一次渲染画出来的词有多少；这个下标及之后的是新词，才做进场。按「上一次的值」在渲染里比对（React 文档的做法），不读 ref。
  const [seen, setSeen] = useState({ count: 0, firstNew: 0 })
  if (seen.count !== tokens.length) setSeen({ count: tokens.length, firstNew: seen.count })
  const firstNew = seen.firstNew

  return (
    <p
      data-slot="ai-response"
      data-streaming={isStreaming || undefined}
      className={cn('k-text-body m-0 text-pretty text-ink leading-relaxed', className)}
    >
      {tokens.map((token, index) => {
        const isNew = index >= firstNew
        if (token.cite !== undefined) {
          const citation = citations?.find((entry) => entry.index === token.cite)
          if (!citation) return <Fragment key={index}>{token.value}</Fragment>
          return (
            <motion.span
              key={index}
              className="mx-0.5 inline-flex align-baseline"
              initial={isNew ? { opacity: 0, scale: 0.6 } : false}
              animate={{ opacity: 1, scale: 1 }}
              transition={WORD_TRANSITION}
            >
              <WebSearchCitation source={citation.source} index={citation.index} />
            </motion.span>
          )
        }
        // 空白与标点保持文字：给逗号单独套 inline-block 会让行在词与它的标点之间断开。
        if (!token.word) return <Fragment key={index}>{token.value}</Fragment>
        return (
          <motion.span
            key={index}
            className="inline-block"
            initial={isNew ? { filter: `blur(${WORD_BLUR_PX}px)`, opacity: 0, y: 2 } : false}
            animate={{ filter: 'blur(0px)', opacity: 1, y: 0 }}
            transition={WORD_TRANSITION}
          >
            {token.value}
          </motion.span>
        )
      })}
      {isStreaming ? (
        // 行内而非绝对定位：光标跟着最后一个字形走，不用告诉它文字到哪结束。
        <span
          aria-hidden="true"
          data-slot="ai-response-caret"
          className="k-ai-caret ml-0.5 inline-block h-[1em] w-[2px] translate-y-[0.15em] rounded-full bg-current align-baseline"
        />
      ) : null}
    </p>
  )
}
