// SPDX-License-Identifier: MIT
// 改自 SmoothUI text-morph（https://github.com/educlopez/smoothui ，MIT，© 2024 Eduardo Calvo）
// 把一串字变成另一串：按字（或词）对比，两边都有的字沿用同一个 key、用布局动画滑到新位置，没了的缩着出去，新来的弹着进来。
// 词在前、字在后的写法：价格 106,977.4 变 107,011.0 时，没变的逗号与前几位原地不动。
import { AnimatePresence, motion } from 'motion/react'
import { useMemo, type ElementType } from 'react'
import { cn } from '../../lib/cn.ts'
import { segmentGraphemes } from './split.ts'

export type TextMorphMode = 'characters' | 'words'
export type TextMorphAlign = 'start' | 'center' | 'end'
export type TextMorphTag = 'span' | 'div' | 'p' | 'h1' | 'h2' | 'h3' | 'h4'

export type TextMorphProps = {
  /** Justifies the token row when the wrapper is wider than the text. */
  align?: TextMorphAlign
  /** Element rendered for the wrapper. */
  as?: TextMorphTag
  /** Extra class names for the root element. */
  className?: string
  /** Spring duration for each token, in milliseconds. */
  duration?: number
  /** Splits the diff on graphemes or whole words. */
  mode?: TextMorphMode
  /** Per-token stagger, in milliseconds; capped so long strings stay snappy. */
  stagger?: number
  /** The current string; changing it triggers the morph. */
  text: string
}

type Token = { key: string; value: string }

const MS = 1000
const POP_SCALE = 0.72
const POP_OFFSET = 6
const MAX_STAGGER_MS = 260
const EXIT_DURATION_S = 0.15
const EASE_OUT = [0.23, 1, 0.32, 1] as const
const ALIGN: Record<TextMorphAlign, string> = { center: 'justify-center', end: 'justify-end', start: 'justify-start' }

/** 切成片并给 key：同一个字第二次出现是「字-1」，对比时才能一一对上。 */
export function morphTokens(text: string, mode: TextMorphMode): Token[] {
  const pieces = mode === 'words' ? text.split(/(\s+)/).filter((token) => token.length > 0) : segmentGraphemes(text)
  const seen = new Map<string, number>()
  return pieces.map((value) => {
    const count = seen.get(value) ?? 0
    seen.set(value, count + 1)
    return { key: `${value}-${count}`, value }
  })
}

/**
 * Morphs one string into another by diffing characters or words: shared ones slide to their new place, removed ones shrink out, new ones pop in.
 * Good for a price, a status word or a label that changes in place.
 */
export function TextMorph({
  align = 'start',
  as = 'span',
  className,
  duration = 250,
  mode = 'characters',
  stagger = 16,
  text,
}: TextMorphProps) {
  const tokens = useMemo(() => morphTokens(text, mode), [text, mode])
  const Tag = as as ElementType
  const spring = { bounce: 0.1, duration: duration / MS, type: 'spring' as const }
  return (
    <Tag className={className} data-slot="text-morph">
      {/* 完整的字放在 sr-only：每个 token 都是 aria-hidden，普通 span 上的 aria-label 会被读屏丢掉。 */}
      <span className="sr-only">{text}</span>
      {/* 容器要 relative：popLayout 把退场的字拿出文档流（absolute），没有定位的父级它们会飞到页面角落。 */}
      <motion.span className={cn('relative inline-flex flex-wrap', ALIGN[align])} layout transition={spring}>
        <AnimatePresence initial={false} mode="popLayout">
          {tokens.map((token, index) => (
            <motion.span
              animate={{ opacity: 1, scale: 1, y: 0 }}
              aria-hidden="true"
              exit={{
                opacity: 0,
                scale: POP_SCALE,
                transition: { duration: EXIT_DURATION_S, ease: EASE_OUT },
                y: -POP_OFFSET,
              }}
              initial={{ opacity: 0, scale: POP_SCALE, y: POP_OFFSET }}
              key={token.key}
              layout
              style={{ display: 'inline-block', whiteSpace: 'pre' }}
              transition={{ ...spring, delay: Math.min(index * stagger, MAX_STAGGER_MS) / MS }}
            >
              {token.value}
            </motion.span>
          ))}
        </AnimatePresence>
      </motion.span>
    </Tag>
  )
}
