// SPDX-License-Identifier: MIT
// 改自 SmoothUI mac-terminal（https://github.com/educlopez/smoothui ，MIT，© 2024 Eduardo Calvo）
import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { cn } from '../lib/cn.ts'
import { focusRing } from '../lib/focus.ts'

// 终端窗：一段「命令逐字敲入、输出逐行出现」的脚本回放，用来演示回测日志、部署输出、AI 建议的推理过程。
// 它是回放不是真终端：没有输入、不跑命令。原件的状态机（40ms 一跳、命令打字、输出按 delay 出现）原样保留；
// 离开屏幕或标签页隐藏时暂停（性能，不是减少动态）。去掉了原件的亮色主题与跟系统配色（我们的主题 token 自己带深浅）、
// 写死的交通灯颜色（改用信号色 token）、写死的英文（提示、关闭、最小化的名字由 labels 传）。
// 读屏：滚动区本身对读屏隐藏（逐字变化会吵），另放一份完整文本在 sr-only 里。

/** 原件的节拍：每 40ms 推进一次（SmoothUI mac-terminal 的 TICK_MS）。 */
const TICK_MS = 40
/** 原件：循环播放时两遍之间停 1.5s。 */
const LOOP_PAUSE_MS = 1500
/** 原件：输出行没写 delay 时，隔 200ms 出现。 */
const OUTPUT_DEFAULT_DELAY_MS = 200

export type TerminalLineType = 'command' | 'output' | 'error' | 'success' | 'comment'

export type TerminalLine = {
  id: string
  text: string
  type: TerminalLineType
  /** Wait this many ms before the line appears or starts typing. */
  delay?: number
}

export type MacTerminalLabels = {
  /** Accessible name of the window (required). */
  window: string
  /** Hint shown before it starts, when autoPlay is off. */
  start?: string
  /** Name of the close light (required with onClose). */
  close?: string
  /** Name of the minimize light (required with onMinimize). */
  minimize?: string
}

export type MacTerminalProps = {
  /** The script to replay. */
  lines: readonly TerminalLine[]
  /** Window title in the bar. */
  title: string
  /** Spoken names and hint text (required). */
  labels: MacTerminalLabels
  /** Start playing as soon as it is on screen; off waits for a click or Enter. */
  autoPlay?: boolean
  /** Play again after the last line. */
  loop?: boolean
  /** Prompt text in front of a command. */
  prompt?: string
  /** Characters typed per second. */
  typingSpeed?: number
  /** Tallest the output area gets before it scrolls. */
  maxHeight?: number | string
  /** Draw the three coloured lights in the title bar. */
  showTrafficLights?: boolean
  /** Makes the red light a button that calls this. */
  onClose?: () => void
  /** Makes the amber light a button that calls this. */
  onMinimize?: () => void
  /** Called after the last line has played. */
  onComplete?: () => void
  /** Extra classes for the root element. */
  className?: string
}

type Machine = { finished: boolean; lineIndex: number; phase: 'delay' | 'typing'; elapsed: number }
const fresh = (): Machine => ({ finished: false, lineIndex: 0, phase: 'delay', elapsed: 0 })

const TONE: Record<TerminalLineType, string> = {
  command: 'text-ink',
  output: 'text-ink-2',
  error: 'text-danger',
  success: 'text-(--pnl-up)',
  comment: 'text-ink-3',
}

const LIGHT = 'size-3 rounded-full'

export function MacTerminal({
  lines,
  title,
  labels,
  autoPlay = true,
  loop = false,
  prompt = '$',
  typingSpeed = 40,
  maxHeight = 320,
  showTrafficLights = true,
  onClose,
  onMinimize,
  onComplete,
  className,
}: MacTerminalProps) {
  const host = useRef<HTMLDivElement>(null)
  const scroller = useRef<HTMLDivElement>(null)
  const machine = useRef<Machine>(fresh())
  const play = useRef(false)
  const live = useRef({ lines, loop, onComplete, speed: typingSpeed > 0 ? typingSpeed : 40 })
  useEffect(() => {
    live.current = { lines, loop, onComplete, speed: typingSpeed > 0 ? typingSpeed : 40 }
  })

  const [done, setDone] = useState<readonly TerminalLine[]>([])
  const [draft, setDraft] = useState<{ chars: number; line: TerminalLine } | null>(null)
  const [started, setStarted] = useState(autoPlay)
  const [inView, setInView] = useState(false)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const node = host.current
    if (!node) return
    const observer = new IntersectionObserver(([entry]) => setInView(entry?.isIntersecting ?? false), {
      threshold: 0.35,
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [])
  useEffect(() => {
    const sync = () => setVisible(document.visibilityState === 'visible')
    sync()
    document.addEventListener('visibilitychange', sync)
    return () => document.removeEventListener('visibilitychange', sync)
  }, [])
  useEffect(() => {
    play.current = started && inView && visible
  }, [started, inView, visible])

  useEffect(() => {
    let loopTimer = 0
    const tick = () => {
      if (!play.current) return
      const m = machine.current
      if (m.finished) return
      const { lines: script, loop: again, onComplete: complete, speed } = live.current
      if (m.lineIndex >= script.length) {
        m.finished = true
        complete?.()
        if (again) {
          loopTimer = window.setTimeout(() => {
            machine.current = fresh()
            setDone([])
            setDraft(null)
          }, LOOP_PAUSE_MS)
        }
        return
      }
      const line = script[m.lineIndex]!
      const command = line.type === 'command'
      const delay = line.delay ?? (command ? 0 : OUTPUT_DEFAULT_DELAY_MS)
      m.elapsed += TICK_MS
      if (m.phase === 'delay') {
        if (m.elapsed < delay) return
        if (command) {
          m.phase = 'typing'
          m.elapsed = 0
          setDraft({ chars: 0, line })
        } else {
          setDone((prev) => [...prev, line])
          m.lineIndex += 1
          m.elapsed = 0
        }
        return
      }
      const chars = Math.min(line.text.length, Math.floor(m.elapsed / (1000 / speed)))
      setDraft({ chars, line })
      if (chars >= line.text.length) {
        setDone((prev) => [...prev, line])
        setDraft(null)
        m.lineIndex += 1
        m.phase = 'delay'
        m.elapsed = 0
      }
    }
    const timer = window.setInterval(tick, TICK_MS)
    return () => {
      window.clearInterval(timer)
      window.clearTimeout(loopTimer)
    }
  }, [])

  useEffect(() => {
    const el = scroller.current
    if (el) el.scrollTop = el.scrollHeight
  }, [done, draft])

  const waiting = !started
  const activate = () => setStarted(true)
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (waiting && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault()
      activate()
    }
  }
  const idle = waiting && done.length === 0 && !draft

  const light = (color: string, name: string | undefined, handler: (() => void) | undefined) =>
    handler ? (
      <button
        type="button"
        aria-label={name}
        className={cn(LIGHT, 'cursor-pointer', focusRing)}
        style={{ background: color }}
        onClick={(event) => {
          event.stopPropagation()
          handler()
        }}
      />
    ) : (
      <span aria-hidden="true" className={LIGHT} style={{ background: color }} />
    )

  return (
    <div
      ref={host}
      role={waiting ? 'button' : 'group'}
      tabIndex={waiting ? 0 : undefined}
      aria-label={labels.window}
      data-slot="mac-terminal"
      onClick={waiting ? activate : undefined}
      onKeyDown={waiting ? onKeyDown : undefined}
      className={cn(
        'overflow-hidden rounded-[var(--radius-overlay)] border border-alpha-white-6 bg-surface-1 shadow-[0_16px_48px_rgba(0,0,0,0.45)]',
        waiting && cn('cursor-pointer', focusRing),
        className,
      )}
    >
      <div className="flex items-center gap-3 border-b border-line bg-surface-2 px-3 py-2">
        {showTrafficLights ? (
          <div className="flex items-center gap-2">
            {light('var(--signal-red)', labels.close, onClose)}
            {light('var(--signal-amber)', labels.minimize, onMinimize)}
            <span aria-hidden="true" className={LIGHT} style={{ background: 'var(--signal-green)' }} />
          </div>
        ) : null}
        <p className="k-text-caption m-0 flex-1 truncate text-center text-ink-3">{title}</p>
        {showTrafficLights ? <span aria-hidden="true" className="w-14" /> : null}
      </div>
      <div
        ref={scroller}
        className="overflow-y-auto px-4 py-3"
        style={{ maxHeight: typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight }}
      >
        <pre
          aria-hidden="true"
          className="k-text-data m-0 leading-relaxed break-words whitespace-pre-wrap"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          {done.map((line) => (
            <div key={line.id} className="flex flex-wrap gap-2">
              {line.type === 'command' ? <span className="text-(--accent)">{prompt}</span> : null}
              <span className={TONE[line.type]}>{line.text}</span>
            </div>
          ))}
          {draft ? (
            <div className="flex flex-wrap gap-2">
              <span className="text-(--accent)">{prompt}</span>
              <span className="text-ink">
                {draft.line.text.slice(0, draft.chars)}
                <span
                  aria-hidden="true"
                  data-slot="mac-terminal-caret"
                  className="ml-0.5 inline-block h-[1em] w-[0.55em] translate-y-[0.15em] bg-(--accent) align-middle"
                />
              </span>
            </div>
          ) : null}
          {idle && labels.start ? <span className="text-ink-3">{labels.start}</span> : null}
        </pre>
        <div className="sr-only">
          {lines.map((line) => (
            <p key={line.id}>{line.text}</p>
          ))}
        </div>
      </div>
    </div>
  )
}
