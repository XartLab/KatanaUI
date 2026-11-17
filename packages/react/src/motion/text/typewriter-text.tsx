// SPDX-License-Identifier: MIT
// 改自 SmoothUI typewriter-text（https://github.com/educlopez/smoothui ，MIT，© 2024 Eduardo Calvo）
// 我们加的：① 文字变长（新文字以已打出的部分开头，AI 回复在流式追加）时接着往下打，不从头重来；② 可选的光标；③ 打完回调 onComplete；
// ④ 读屏读完整的句子，不读打到一半的字（打字过程是 aria-hidden，整句放在 sr-only 里）。
import { useEffect, useRef, useState } from 'react'
import { cn } from '../../lib/cn.ts'
import { segmentGraphemes } from './split.ts'

export type TypewriterTextProps = {
  /** Shows a blinking caret after the text. */
  caret?: boolean
  /** The full text to type out; if it grows from what is already shown, typing continues instead of restarting. */
  children: string
  /** Extra class names for the root element. */
  className?: string
  /** Types the text over and over, with a short pause between rounds. */
  loop?: boolean
  /** Called once when the whole text has been typed (not in loop mode). */
  onComplete?: () => void
  /** Milliseconds per character. */
  speed?: number
}

const LOOP_RESTART_DELAY_MS = 1000

/** Types text out one character at a time: an AI reply or a trading suggestion written as it is produced. */
export function TypewriterText({
  caret = false,
  children,
  className,
  loop = false,
  onComplete,
  speed = 50,
}: TypewriterTextProps) {
  const chars = segmentGraphemes(children)
  const [shown, setShown] = useState(0)
  const previous = useRef('')
  const done = useRef(onComplete)
  useEffect(() => {
    done.current = onComplete
  })

  useEffect(() => {
    // 新文字以旧文字开头就接着打（流式追加）；否则从头。
    const continues = children.startsWith(previous.current) && previous.current.length > 0
    previous.current = children
    const all = segmentGraphemes(children)
    let cursor = continues ? Math.min(shown, all.length) : 0
    if (!continues) setShown(0)
    let timer: ReturnType<typeof setTimeout>
    const type = () => {
      if (cursor < all.length) {
        cursor += 1
        setShown(cursor)
        timer = setTimeout(type, speed)
      } else if (loop) {
        timer = setTimeout(() => {
          cursor = 0
          setShown(0)
          type()
        }, LOOP_RESTART_DELAY_MS)
      } else {
        done.current?.()
      }
    }
    timer = setTimeout(type, speed)
    return () => clearTimeout(timer)
    // shown 只在文字变化的那一刻读一次，不作依赖（否则每打一个字都重启）。
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [children, speed, loop])

  return (
    <span className={cn(className)} data-slot="typewriter-text" data-typing={shown < chars.length ? '' : undefined}>
      <span className="sr-only">{children}</span>
      <span aria-hidden="true" data-slot="typewriter-visible">
        {chars.slice(0, shown).join('')}
      </span>
      {caret ? <span aria-hidden="true" className="k-tw-caret" /> : null}
    </span>
  )
}
