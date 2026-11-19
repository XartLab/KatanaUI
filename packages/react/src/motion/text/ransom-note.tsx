// SPDX-License-Identifier: MIT
// 改自 SmoothUI ransom-note（https://github.com/educlopez/smoothui ，MIT，© 2024 Eduardo Calvo）
// 每个字像从报纸上剪下来的纸片：自己的字体、底色、倾斜与大小，由种子决定（同种子同文字同排布）；可以飞进来拼好，或一直轻轻抖。
// 纯装饰，与交易工作台关系不大，留着给空状态、品牌页用。我们把原件写死的纸色、字体、描边换成了 token（纸色用面板的几档底色，字体用 --font-*）。
import { motion, type TargetAndTransition } from 'motion/react'
import { useMemo } from 'react'
import { cn } from '../../lib/cn.ts'
import { segmentGraphemes } from './split.ts'

export type RansomNoteAnimate = 'none' | 'assemble' | 'jitter'

export type RansomNoteProps = {
  /** How the scraps behave: fly in and assemble, wobble in place, or stay still. */
  animate?: RansomNoteAnimate
  /** Extra class names for the root element. */
  className?: string
  /** Font-family values to pick from for each character; defaults to the font tokens. */
  fonts?: readonly string[]
  /** How wild the per-character variation gets, from 0 (subtle) to 1 (chaotic). */
  intensity?: number
  /** Background colors for the paper scraps; defaults to the panel background tokens. */
  palette?: readonly string[]
  /** Maximum rotation of any scrap, in degrees. */
  rotation?: number
  /** Seed of the layout: the same seed and text always give the same scraps. */
  seed?: number
  /** Delay between one scrap's entrance or wobble and the next, in seconds. */
  stagger?: number
  /** The text to cut into scraps. */
  text: string
}

type Scrap = {
  backgroundColor?: string
  char: string
  entranceOffsetX: number
  entranceOffsetY: number
  entranceRotation: number
  fontFamily: string
  fontScale: number
  isWhitespace: boolean
  jitterDuration: number
  jitterRotation: number
  rotation: number
  skew: number
}

const UINT32 = 4_294_967_296
/** mulberry32：同一个种子永远同一串数，排布稳定，服务端渲染也安全。 */
export function createSeededRandom(seed: number): () => number {
  let state = seed
  return () => {
    state = (state + 0x6d_2b_79_f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / UINT32
  }
}

const DEFAULT_FONTS = [
  'var(--font-sans)',
  'var(--font-mono)',
  'var(--font-display)',
  'var(--font-sans-display)',
  'var(--font-lcd)',
]
const DEFAULT_PALETTE = ['var(--bg-200)', 'var(--bg-300)', 'var(--bg-400)']
// 以下数值来自 SmoothUI 原件。
const FONT_SCALE_BASE = 0.85
const FONT_SCALE_VARIANCE = 0.5
const ENTRANCE_OFFSET_BASE = 24
const ENTRANCE_OFFSET_VARIANCE = 60
const ENTRANCE_ROTATION_VARIANCE = 30
const SKEW_MAX = 6
const JITTER_ROTATION_BASE = 1.5
const JITTER_ROTATION_VARIANCE = 2.5
const JITTER_DURATION_MIN = 0.6
const JITTER_DURATION_VARIANCE = 0.6
const SPRING = { bounce: 0.1, duration: 0.25, type: 'spring' as const }
const JITTER_EASE = [0.645, 0.045, 0.355, 1] as const

const between = (rand: () => number, min: number, max: number) => min + rand() * (max - min)

/** 按种子算每一张纸片的字体、底色、倾斜、大小与进场的偏移（纯函数，给单测用）。 */
export function ransomScraps(
  text: string,
  seed: number,
  intensity: number,
  rotation: number,
  fonts: readonly string[],
  palette: readonly string[],
): Scrap[] {
  const rand = createSeededRandom(seed)
  const k = Math.min(Math.max(intensity, 0), 1)
  const fontStack = fonts.length > 0 ? fonts : DEFAULT_FONTS
  const colorStack = palette.length > 0 ? palette : DEFAULT_PALETTE
  return segmentGraphemes(text).map((char) => {
    const isWhitespace = /\s/.test(char)
    const fontFamily = fontStack[Math.floor(rand() * fontStack.length)]!
    const backgroundColor = isWhitespace ? undefined : colorStack[Math.floor(rand() * colorStack.length)]
    const fontScale = FONT_SCALE_BASE + rand() * FONT_SCALE_VARIANCE * k
    const rest = between(rand, -rotation, rotation) * k
    const spread = ENTRANCE_OFFSET_BASE + ENTRANCE_OFFSET_VARIANCE * k
    return {
      backgroundColor,
      char,
      entranceOffsetX: between(rand, -spread, spread),
      entranceOffsetY: between(rand, -spread, spread),
      entranceRotation: between(rand, -ENTRANCE_ROTATION_VARIANCE, ENTRANCE_ROTATION_VARIANCE) * k,
      fontFamily,
      fontScale,
      isWhitespace,
      jitterDuration: JITTER_DURATION_MIN + rand() * JITTER_DURATION_VARIANCE,
      jitterRotation: JITTER_ROTATION_BASE + rand() * JITTER_ROTATION_VARIANCE * k,
      rotation: rest,
      skew: between(rand, -SKEW_MAX, SKEW_MAX) * k,
    }
  })
}

/** Text cut into mismatched paper scraps that fly in or wobble: decoration for empty states and brand pages, not for data. */
export function RansomNote({
  animate = 'assemble',
  className,
  fonts = DEFAULT_FONTS,
  intensity = 0.6,
  palette = DEFAULT_PALETTE,
  rotation = 8,
  seed = 1,
  stagger = 0.03,
  text,
}: RansomNoteProps) {
  const scraps = useMemo(
    () => ransomScraps(text, seed, intensity, rotation, fonts, palette),
    [text, seed, intensity, rotation, fonts, palette],
  )
  return (
    <div className={cn('relative inline-block', className)} data-animate={animate} data-slot="ransom-note">
      <span className="sr-only">{text}</span>
      <div aria-hidden="true" className="flex flex-wrap items-baseline leading-none">
        {scraps.map((scrap, index) => {
          const rest: TargetAndTransition = { opacity: 1, rotate: scrap.rotation, x: 0, y: 0 }
          let initial: TargetAndTransition = rest
          let target: TargetAndTransition = rest
          let transition: object = { duration: 0 }
          if (animate === 'assemble') {
            initial = {
              opacity: 0,
              rotate: scrap.rotation + scrap.entranceRotation,
              x: scrap.entranceOffsetX,
              y: scrap.entranceOffsetY,
            }
            transition = { ...SPRING, delay: index * stagger }
          } else if (animate === 'jitter') {
            target = { rotate: [scrap.rotation - scrap.jitterRotation, scrap.rotation + scrap.jitterRotation] }
            transition = {
              delay: index * stagger,
              duration: scrap.jitterDuration,
              ease: JITTER_EASE,
              repeat: Number.POSITIVE_INFINITY,
              repeatType: 'mirror',
            }
          }
          return (
            <motion.span
              animate={target}
              className={cn('inline-block whitespace-pre select-none', !scrap.isWhitespace && 'px-1 py-0.5')}
              initial={initial}
              key={index}
              style={{
                backgroundColor: scrap.backgroundColor,
                borderRadius: scrap.isWhitespace ? undefined : 'var(--radius-sm)',
                boxShadow: scrap.isWhitespace ? undefined : '0 0 0 1px var(--line-100)',
                color: scrap.isWhitespace ? undefined : 'var(--ink-100)',
                fontFamily: scrap.fontFamily,
                fontSize: `${scrap.fontScale}em`,
                skewX: scrap.skew,
                transformOrigin: '50% 50%',
              }}
              transition={transition}
            >
              {scrap.char}
            </motion.span>
          )
        })}
      </div>
    </div>
  )
}
