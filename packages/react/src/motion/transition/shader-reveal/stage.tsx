// SPDX-License-Identifier: MIT
// 改自 SmoothUI 的 shader-reveal-transition（https://github.com/educlopez/smoothui ，MIT，© 2024 Eduardo Calvo）的组件部分：
// 内容放在下层，WebGL 画布盖在上层，transitionKey 变了就播一遍，遮住的那一刻换内容。四个过场件共用这一个舞台。
// 相对原件：WebGL 不可用（或着色器没编译过）、或标签页是隐藏的，退回普通淡入淡出 / 直接换；换内容读最新的 children，播放中父组件重渲染不会提前换；
// 去掉 useReducedMotion；圆角、底色、文字色换成我们的 token。
import { animate } from 'motion/react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '../../../lib/cn.ts'
import {
  DEFAULT_COLORS,
  createShaderEngine,
  playTransition,
  resolveColors,
  type Playback,
  type ShaderEngine,
  type TransitionSpec,
} from './engine.ts'

const MS_PER_SECOND = 1000

export type ShaderTransitionStageProps = {
  /** Content shown after the transition; swapped at the midpoint of the playback. */
  children: ReactNode
  /** Extra classes for the wrapper. */
  className?: string
  /** Total length in milliseconds; defaults to the preset of the transition. */
  duration?: number
  /** Called once the transition has finished and the new content is in place. */
  onRest?: () => void
  /** When this value changes, the transition plays and `children` replaces the old content. */
  transitionKey: string | number
  /** Shader preset: fragment source, easing, midpoint and fade-out. */
  spec: TransitionSpec
  /** Which variant inside the shader (the `uVariant` uniform). */
  variantIndex?: number
  /** Up to four colors (CSS colors or var(--token)); read when each transition starts. */
  colors?: readonly string[]
}

export function ShaderTransitionStage({
  children,
  className,
  duration,
  onRest,
  transitionKey,
  spec,
  variantIndex = 0,
  colors = DEFAULT_COLORS,
}: ShaderTransitionStageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const engineRef = useRef<ShaderEngine | null | undefined>(undefined)
  const playbackRef = useRef<Playback | null>(null)
  const previousKey = useRef(transitionKey)
  const latest = useRef({ children, onRest })
  // oxlint-disable-next-line react/refs -- ref 只读不触发渲染，渲染期取值是有意的
  latest.current = { children, onRest }
  const [rendered, setRendered] = useState(children)
  const [active, setActive] = useState(false)
  const activeRef = useRef(false)
  const colorKey = colors.join('|')

  // 没在播的时候，父组件传来的新 children 直接跟上（同一个 key 下内容本来就是活的）。
  useEffect(() => {
    if (!activeRef.current) setRendered(children)
  }, [children])

  useEffect(
    () => () => {
      playbackRef.current?.cancel()
      engineRef.current?.destroy()
      engineRef.current = undefined
    },
    [],
  )

  useEffect(() => {
    if (previousKey.current === transitionKey) return
    previousKey.current = transitionKey
    playbackRef.current?.cancel()
    const canvas = canvasRef.current
    const content = contentRef.current
    const total = duration ?? spec.duration
    const finish = () => {
      activeRef.current = false
      setActive(false)
      playbackRef.current = null
      latest.current.onRest?.()
    }
    const swap = () => setRendered(latest.current.children)
    activeRef.current = true
    setActive(true)

    // 标签页隐藏时 rAF 不走，播了也看不见：直接换。
    if (!(canvas && content) || document.visibilityState !== 'visible') {
      swap()
      finish()
      return
    }
    if (engineRef.current === undefined) engineRef.current = createShaderEngine(canvas, spec.fragment)
    const engine = engineRef.current
    if (!engine) {
      // WebGL 不可用：普通淡入淡出，前半程淡出旧内容，换了再淡入。
      const half = total / 2 / MS_PER_SECOND
      let stopped = false
      const out = animate(content, { opacity: 0 }, { duration: half, ease: 'easeIn' })
      // oxlint-disable-next-line typescript/no-floating-promises -- 动画句柄不需要等待
      out.then(() => {
        if (stopped) return
        swap()
        const back = animate(content, { opacity: 1 }, { duration: half, ease: 'easeOut' })
        playbackRef.current = {
          cancel: () => {
            stopped = true
            back.stop()
            content.style.opacity = ''
          },
        }
        // oxlint-disable-next-line typescript/no-floating-promises -- 动画句柄不需要等待
        back.then(() => {
          if (!stopped) finish()
        })
      })
      playbackRef.current = {
        cancel: () => {
          stopped = true
          out.stop()
          content.style.opacity = ''
        },
      }
      return
    }
    playbackRef.current = playTransition(engine, spec, {
      duration: total,
      variant: variantIndex,
      colors: resolveColors(canvas, colorKey.split('|')),
      onMidpoint: swap,
      onComplete: finish,
    })
  }, [transitionKey, duration, spec, variantIndex, colorKey])

  return (
    <div
      className={cn('relative isolate overflow-hidden rounded-[var(--radius-panel)] bg-surface-0 text-ink', className)}
      data-transitioning={active ? 'true' : 'false'}
      data-slot="shader-transition"
    >
      <div className="relative z-0" ref={contentRef}>
        {rendered}
      </div>
      <canvas
        aria-hidden="true"
        className={cn('pointer-events-none absolute inset-0 z-10 h-full w-full', active ? 'opacity-100' : 'opacity-0')}
        ref={canvasRef}
      />
    </div>
  )
}
