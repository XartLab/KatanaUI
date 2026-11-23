// SPDX-License-Identifier: MIT
// 改自 SmoothUI scramble-hover（https://github.com/educlopez/smoothui ，MIT，© 2024 Eduardo Calvo）
// 我们加的：① trigger="change"：文字变了就扰一次（代码、价格换了的时候用），不只在悬停时；② settle="left-to-right"：从左到右一位一位定下来，比整串一起乱完再定更好读；
// ③ 数字只换成数字、字母只换成字母、标点不动，宽度跟着原字走（等宽字体下不晃）；④ 读屏读真实文字，扰乱中的字是 aria-hidden。
import { useEffect, useRef, useState } from 'react'
import { cn } from '../../lib/cn.ts'

export type ScrambleTrigger = 'hover' | 'change'
export type ScrambleSettle = 'together' | 'left-to-right'

export type ScrambleTextProps = {
  /** The real text; this is what is shown at rest and what assistive technology reads. */
  children: string
  /** Extra class names for the root element. */
  className?: string
  /** Total scramble time in milliseconds. */
  duration?: number
  /** Characters to draw from instead of matching digits with digits and letters with letters. */
  glyphs?: string
  /** together: everything resolves at the end; left-to-right: one character after another. */
  settle?: ScrambleSettle
  /** Milliseconds between two scrambled frames. */
  speed?: number
  /** hover scrambles on pointer hover or keyboard focus inside; change scrambles whenever the text changes. */
  trigger?: ScrambleTrigger
}

const DIGITS = '0123456789'
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
const WORD_CHAR = /[\p{L}\p{N}]/u
const DIGIT = /\p{N}/u

const pickFrom = (pool: string): string => pool[Math.floor(Math.random() * pool.length)] ?? ''

/** 一帧乱码：按已经过去的比例决定前几位已定下（left-to-right）。纯函数除了随机数，传 progress 与 settle 即可测。 */
export function scrambleFrame(original: string, progress: number, settle: ScrambleSettle, glyphs?: string): string {
  const chars = Array.from(original)
  const locked = settle === 'left-to-right' ? Math.floor(progress * chars.length) : 0
  return chars
    .map((char, index) => {
      if (index < locked || !WORD_CHAR.test(char)) return char
      if (glyphs) return pickFrom(glyphs)
      return pickFrom(DIGIT.test(char) ? DIGITS : LETTERS)
    })
    .join('')
}

/** Text that scrambles into place: on hover for a link or label, or on every change for a price, code or ticker. */
export function ScrambleText({
  children,
  className,
  duration = 600,
  glyphs,
  settle = 'together',
  speed = 30,
  trigger = 'hover',
}: ScrambleTextProps) {
  const [display, setDisplay] = useState(children)
  const [running, setRunning] = useState(false)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)
  const text = useRef(children)
  const first = useRef(true)

  const stop = () => {
    if (timer.current) clearInterval(timer.current)
    timer.current = null
    setRunning(false)
  }
  const play = () => {
    stop()
    const started = performance.now()
    setRunning(true)
    timer.current = setInterval(() => {
      const progress = Math.min((performance.now() - started) / duration, 1)
      if (progress >= 1) {
        setDisplay(text.current)
        stop()
        return
      }
      setDisplay(scrambleFrame(text.current, progress, settle, glyphs))
    }, speed)
  }

  useEffect(() => {
    text.current = children
    if (first.current) {
      first.current = false
      return
    }
    if (trigger === 'change') play()
    else setDisplay(children)
    // play 读的是 ref 与 props，换文字时才需要重放。
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [children])

  useEffect(() => stop, [])

  const hoverOnly = (handler: () => void) => () => {
    if (trigger === 'hover' && window.matchMedia('(hover: hover) and (pointer: fine)').matches) handler()
  }
  const rest = () => {
    if (trigger !== 'hover') return
    stop()
    setDisplay(text.current)
  }

  return (
    <span
      className={cn(className)}
      data-scrambling={running ? '' : undefined}
      data-slot="scramble-text"
      onBlur={rest}
      onFocus={hoverOnly(play)}
      onPointerEnter={hoverOnly(play)}
      onPointerLeave={rest}
    >
      <span className="sr-only">{children}</span>
      <span aria-hidden="true" data-slot="scramble-visible">
        {display}
      </span>
    </span>
  )
}
