// SPDX-License-Identifier: MIT
// 改自 SmoothUI 的 blur-out-up、bottom-up-letters、depth-parallax-words、focus-blur-resolve、line-by-line-slide、mask-reveal-up、micro-scale-fade、
// per-character-rise、per-word-crossfade、reveal-text、scale-down-fade、shimmer-sweep、soft-blur-in、spring-scale-in、stagger-from-center、
// stagger-from-edges、top-down-letters（https://github.com/educlopez/smoothui ，MIT，© 2024 Eduardo Calvo）
// 归并：这 17 个原件是同一个机制（把文字切成整段 / 行 / 词 / 字，每块从某个方向带着一点模糊与缩放淡入，按顺序错峰），只差参数；
// 这里合成一个件，原件名是 TEXT_REVEAL_PRESETS 里的预设，写 preset="bottom-up-letters" 就等于原件，单个参数仍可覆盖。
import { motion, useInView } from 'motion/react'
import { useRef, type CSSProperties } from 'react'
import { cn } from '../../lib/cn.ts'
import { segmentGraphemes, splitLines, staggerStep, type StaggerOrder } from './split.ts'

export type TextRevealBy = 'all' | 'line' | 'word' | 'char'
/** 文字从哪一侧来：bottom 是从下方升上来，top 是从上方落下来；none 原地不动只淡入。 */
export type TextRevealFrom = 'bottom' | 'top' | 'left' | 'right' | 'none'
export type TextRevealOrder = StaggerOrder
/** 三次贝塞尔缓动的四个数。 */
export type TextRevealEase = readonly [number, number, number, number]

/** 原件的缓动曲线（来源：SmoothUI 各原件的 EASE 常量）。 */
export const TEXT_REVEAL_EASES = {
  /** 通用的快出慢收，blur-out-up、soft-blur-in 等多数原件用它。 */
  out: [0.22, 1, 0.36, 1],
  /** 更陡的快出，bottom-up-letters、top-down-letters。 */
  steep: [0.18, 1, 0.32, 1],
  /** per-character-rise 的 tvOS 式缓出。 */
  tv: [0.2, 0.8, 0.2, 1],
  /** per-word-crossfade 的从容缓出。 */
  calm: [0.16, 1, 0.3, 1],
  /** micro-scale-fade 的轻缓出。 */
  soft: [0.32, 0.72, 0, 1],
  /** spring-scale-in 的过冲（超过 1 再回来）。 */
  overshoot: [0.34, 1.56, 0.64, 1],
} as const satisfies Record<string, TextRevealEase>

type RevealParams = {
  by: TextRevealBy
  from: TextRevealFrom
  distance: number
  blur: number
  scale: number
  order: TextRevealOrder
  mask: boolean
  stagger: number
  duration: number
  ease: TextRevealEase
}

/**
 * 17 个原件的参数，键就是原件名（短横线小写）。
 * 数值全部来自 SmoothUI 原件（时长毫秒、位移像素、模糊像素），我们没有调。
 */
export const TEXT_REVEAL_PRESETS = {
  'blur-out-up': { by: 'word', from: 'bottom', distance: 10, blur: 6, stagger: 28, duration: 560 },
  'bottom-up-letters': {
    by: 'char',
    from: 'bottom',
    distance: 46,
    stagger: 88,
    duration: 400,
    ease: TEXT_REVEAL_EASES.steep,
  },
  'top-down-letters': {
    by: 'char',
    from: 'top',
    distance: 46,
    stagger: 88,
    duration: 400,
    ease: TEXT_REVEAL_EASES.steep,
  },
  'per-character-rise': {
    by: 'char',
    from: 'bottom',
    distance: 32,
    stagger: 24,
    duration: 700,
    ease: TEXT_REVEAL_EASES.tv,
  },
  'soft-blur-in': { by: 'char', from: 'bottom', distance: 16, blur: 12, stagger: 25, duration: 900 },
  'per-word-crossfade': {
    by: 'word',
    from: 'bottom',
    distance: 8,
    stagger: 70,
    duration: 700,
    ease: TEXT_REVEAL_EASES.calm,
  },
  'depth-parallax-words': {
    by: 'word',
    from: 'bottom',
    distance: 18,
    blur: 3,
    scale: 0.92,
    stagger: 70,
    duration: 700,
  },
  'spring-scale-in': {
    by: 'word',
    from: 'none',
    scale: 0.7,
    stagger: 95,
    duration: 360,
    ease: TEXT_REVEAL_EASES.overshoot,
  },
  'stagger-from-center': {
    by: 'char',
    from: 'bottom',
    distance: 12,
    blur: 3,
    order: 'center',
    stagger: 22,
    duration: 620,
  },
  'stagger-from-edges': {
    by: 'char',
    from: 'bottom',
    distance: 12,
    blur: 3,
    order: 'edges',
    stagger: 22,
    duration: 620,
  },
  'reveal-text': { by: 'all', from: 'bottom', distance: 24, duration: 250 },
  'micro-scale-fade': { by: 'all', from: 'none', scale: 0.96, duration: 600, ease: TEXT_REVEAL_EASES.soft },
  'scale-down-fade': { by: 'all', from: 'bottom', distance: 8, scale: 1.04, duration: 520 },
  'focus-blur-resolve': { by: 'all', from: 'bottom', distance: 14, blur: 14, scale: 1.01, duration: 760 },
  'shimmer-sweep': { by: 'all', from: 'left', distance: 22, blur: 8, duration: 850 },
  'line-by-line-slide': { by: 'line', from: 'left', distance: 48, stagger: 120, duration: 900 },
  'mask-reveal-up': { by: 'line', from: 'bottom', distance: 30, blur: 6, mask: true, stagger: 90, duration: 760 },
} as const satisfies Record<string, Partial<RevealParams>>

export type TextRevealPreset = keyof typeof TEXT_REVEAL_PRESETS

const BASE: RevealParams = {
  by: 'word',
  from: 'bottom',
  distance: 12,
  blur: 0,
  scale: 1,
  order: 'forward',
  mask: false,
  stagger: 40,
  duration: 560,
  ease: TEXT_REVEAL_EASES.out,
}

const MS = 1000
const PRE: CSSProperties = { display: 'inline-block', whiteSpace: 'pre' }

export type TextRevealProps = {
  /** The text to reveal; for `by="line"` separate lines with a newline or pass `lines`. */
  children?: string
  /** Extra class names for the root element. */
  className?: string
  /** Delay before the first piece starts, in milliseconds. */
  delay?: number
  /** Overrides the preset's travel distance, in pixels. */
  distance?: number
  /** Overrides the preset's duration of one piece, in milliseconds. */
  duration?: number
  /** Overrides the preset's easing, as a cubic-bezier of four numbers. */
  ease?: TextRevealEase
  /** Which side the text arrives from. */
  from?: TextRevealFrom
  /** Explicit lines for `by="line"`; takes precedence over children. */
  lines?: readonly string[]
  /** Clips each piece to its own box so it rises out from behind an edge. */
  mask?: boolean
  /** Starting blur in pixels; 0 means no blur filter at all. */
  blur?: number
  /** Which pieces start first: in reading order, from the middle outwards, or from both ends inwards. */
  order?: TextRevealOrder
  /** A named starting point; every SmoothUI original is one of these, and any other prop overrides it. */
  preset?: TextRevealPreset
  /** Changing this value plays the reveal again from the start. */
  replayKey?: string | number
  /** Starting scale; below 1 grows in, above 1 settles down. */
  scale?: number
  /** Delay between one piece and the next, in milliseconds. */
  stagger?: number
  /** Splits into the whole text, lines, words or characters. */
  by?: TextRevealBy
  /** Waits until the text scrolls into view before playing. */
  triggerOnView?: boolean
}

function resolve(props: TextRevealProps): RevealParams {
  const fromPreset: Partial<RevealParams> = props.preset ? TEXT_REVEAL_PRESETS[props.preset] : {}
  const own: Partial<RevealParams> = {}
  for (const key of [
    'by',
    'from',
    'distance',
    'blur',
    'scale',
    'order',
    'mask',
    'stagger',
    'duration',
    'ease',
  ] as const) {
    if (props[key] !== undefined) (own as Record<string, unknown>)[key] = props[key]
  }
  return { ...BASE, ...fromPreset, ...own }
}

function offset(from: TextRevealFrom, distance: number): { x: number; y: number } {
  if (from === 'bottom') return { x: 0, y: distance }
  if (from === 'top') return { x: 0, y: -distance }
  if (from === 'left') return { x: -distance, y: 0 }
  if (from === 'right') return { x: distance, y: 0 }
  return { x: 0, y: 0 }
}

/**
 * Text that arrives piece by piece: whole, per line, per word or per character, from a chosen side, with optional blur and scale.
 * Pass `preset` to start from any of the SmoothUI originals (see `TEXT_REVEAL_PRESETS`).
 */
export function TextReveal(props: TextRevealProps) {
  const { children = '', className, delay = 0, lines, preset, replayKey, triggerOnView = false } = props
  const params = resolve(props)
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })
  const play = !triggerOnView || inView
  const { by } = params

  const hidden = {
    opacity: 0,
    ...offset(params.from, params.distance),
    ...(params.scale === 1 ? {} : { scale: params.scale }),
    ...(params.blur > 0 ? { filter: `blur(${params.blur}px)` } : {}),
  }
  const shown = {
    opacity: 1,
    x: 0,
    y: 0,
    ...(params.scale === 1 ? {} : { scale: 1 }),
    ...(params.blur > 0 ? { filter: 'blur(0px)' } : {}),
  }

  const piece = (content: string, index: number, count: number, display: 'inline-block' | 'block') => {
    const transition = {
      delay: delay / MS + (staggerStep(index, count, params.order) * params.stagger) / MS,
      duration: params.duration / MS,
      ease: [...params.ease] as [number, number, number, number],
    }
    const moving = (
      <motion.span
        animate={play ? shown : undefined}
        aria-hidden="true"
        initial={hidden}
        style={display === 'block' ? { display: 'block' } : PRE}
        transition={transition}
      >
        {content}
      </motion.span>
    )
    if (!params.mask) return moving
    return (
      <span
        style={{
          display,
          overflow: 'hidden',
          verticalAlign: 'bottom',
          whiteSpace: display === 'block' ? undefined : 'pre',
        }}
      >
        {moving}
      </span>
    )
  }

  let body
  if (by === 'all') {
    body = null
  } else if (by === 'line') {
    const rows = splitLines(children, lines)
    body = rows.map((row, index) => (
      <span key={`${replayKey}-${index}`}>{piece(row, index, rows.length, 'block')}</span>
    ))
  } else if (by === 'word') {
    const words = children.split(' ')
    body = words.map((word, index) => (
      <span key={`${replayKey}-${index}`}>
        {piece(word, index, words.length, 'inline-block')}
        {index < words.length - 1 ? (
          <span aria-hidden="true" style={PRE}>
            {' '}
          </span>
        ) : null}
      </span>
    ))
  } else {
    const chars = segmentGraphemes(children)
    body = chars.map((char, index) => (
      <span key={`${replayKey}-${index}`}>{piece(char, index, chars.length, 'inline-block')}</span>
    ))
  }

  const text = by === 'line' ? splitLines(children, lines).join(' ') : children
  return (
    <span
      className={cn(by === 'line' && 'block', className)}
      data-by={by}
      data-preset={preset}
      data-slot="text-reveal"
      ref={ref}
    >
      {by === 'all' ? (
        <motion.span
          animate={play ? shown : undefined}
          initial={hidden}
          key={replayKey}
          style={{ display: 'inline-block' }}
          transition={{
            delay: delay / MS,
            duration: params.duration / MS,
            ease: [...params.ease] as [number, number, number, number],
          }}
        >
          {children}
        </motion.span>
      ) : (
        <>
          {/* 每一块都是 aria-hidden，可读的整句放在这里：普通 span 上的 aria-label 会被读屏忽略。 */}
          <span className="sr-only">{text}</span>
          {body}
        </>
      )}
    </span>
  )
}
