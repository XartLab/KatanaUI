// SPDX-License-Identifier: MIT
// 行内的 AI 状态：思考、检索、编写、完成、出错。左边一个随状态变的小图标，右边是状态文字（进行中带流光）、可选的细节与耗时。
// 用于 Agent 面板、分析面板生成中。文字由调用方传（包里没有文案），状态只管图标与动效。
// 交互学自 rare-ui 的 ai-status（2026-11-14 读），实现为本仓库原创，未复制其代码。
// 学到的事实（只取行为）：① 状态变时图标缩放旋转着换、文字上下滑着换（旧的往上走、新的从下来），整行宽度跟着弹簧伸缩，不跳；
// ② 进行中的文字有一道流光扫过，结束就停；③ 耗时只在进行中显示；④ 整行是 role=status，状态变了读屏播报。
// 我们的图标自己画：思考是三个方点依次起伏（呼应点阵签名件），检索是放大镜绕圈，编写是几行线被写出来，完成是对勾，出错是叉。
import { AnimatePresence, animate, motion, useMotionValue } from 'motion/react'
import { useLayoutEffect, useRef } from 'react'
import { cn } from '../lib/cn.ts'
import { snappy } from '../lib/motion.ts'
import { unit } from '../lib/spring.ts'

export type AiStatusState = 'thinking' | 'searching' | 'writing' | 'done' | 'error'

const ACTIVE: Readonly<Record<AiStatusState, boolean>> = {
  thinking: true,
  searching: true,
  writing: true,
  done: false,
  error: false,
}

/** 耗时的写法：不到一分钟写「12s」，之后写「1m 05s」。纯数字加单位字母，不带中文。 */
export function formatElapsed(seconds: number): string {
  const total = Math.max(0, Math.floor(Number.isFinite(seconds) ? seconds : 0))
  return total < 60 ? `${total}s` : `${Math.floor(total / 60)}m ${String(total % 60).padStart(2, '0')}s`
}

const STROKE = {
  fill: 'none',
  stroke: 'currentColor',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const

function Glyph({ state }: { state: AiStatusState }) {
  switch (state) {
    case 'thinking':
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" data-glyph="thinking">
          {[3, 10, 17].map((x, index) => (
            <rect
              key={x}
              className="k-ai-dot"
              x={x}
              y={10}
              width={4}
              height={4}
              style={{ animationDelay: `${index * 150}ms` }}
            />
          ))}
        </svg>
      )
    case 'searching':
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24" data-glyph="searching">
          <g className="k-ai-orbit">
            <circle {...STROKE} cx={10.5} cy={10.5} r={5.5} strokeWidth={2.2} />
            <path {...STROKE} d="M14.7 14.7 19 19" strokeWidth={2.4} />
          </g>
        </svg>
      )
    case 'writing':
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24" data-glyph="writing">
          <path className="k-ai-write" {...STROKE} d="M3 8h18M3 12h18M3 16h11" strokeWidth={2.2} pathLength={1} />
        </svg>
      )
    case 'done':
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24" data-glyph="done">
          <motion.path
            {...STROKE}
            d="M5 12.5 10 17.5 19 7"
            strokeWidth={2.6}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={unit(snappy)}
          />
        </svg>
      )
    case 'error':
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24" data-glyph="error">
          <path className="k-ai-shake" {...STROKE} d="M7 7 17 17M17 7 7 17" strokeWidth={2.6} />
        </svg>
      )
  }
}

export type AiStatusProps = {
  state: AiStatusState
  /** 状态文字（必填，由调用方按界面语言给），状态变了就换这个字符串。 */
  label: string
  /** 文字后面的灰色细节，如正在读哪个来源。 */
  detail?: string
  /** 已进行的秒数；只在进行中的状态显示。 */
  elapsed?: number
  className?: string
}

export function AiStatus({ state, label, detail, elapsed, className }: AiStatusProps) {
  const active = ACTIVE[state]
  const inner = useRef<HTMLDivElement>(null)
  // 外层宽度由一个动效值持有，始终写成具体像素：文字一换，里层先变到新宽，外层仍停在旧宽，再由弹簧走过去。
  // （曾经外层不写宽度、跟着里层自动伸缩，换状态时宽度当帧跳变，弹簧从「当前值」走向同一个值，等于没动。）
  const width = useMotionValue(0)
  useLayoutEffect(() => {
    const el = inner.current
    if (!el) return
    let first = true
    let controls: ReturnType<typeof animate> | undefined
    const measure = () => {
      const next = el.offsetWidth
      controls?.stop()
      if (first) {
        first = false
        width.set(next)
      } else controls = animate(width, next, snappy)
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => {
      observer.disconnect()
      controls?.stop()
    }
  }, [width])
  return (
    <div
      role="status"
      data-slot="ai-status"
      data-state={state}
      data-active={active || undefined}
      className={cn('k-text-data inline-flex h-7 items-center gap-2 text-ink-2', className)}
    >
      <span className="relative inline-flex size-4 flex-none items-center justify-center" data-slot="ai-status-icon">
        <AnimatePresence initial={false} mode="popLayout">
          <motion.span
            key={state}
            className="inline-flex size-4 items-center justify-center [&_svg]:size-4"
            initial={{ scale: 0.5, opacity: 0, rotate: -30 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            exit={{ scale: 0.5, opacity: 0, rotate: 30 }}
            transition={unit(snappy)}
            style={{
              color: state === 'error' ? 'var(--signal-red)' : active ? 'var(--signal-orange)' : 'var(--ink-300)',
            }}
          >
            <Glyph state={state} />
          </motion.span>
        </AnimatePresence>
      </span>
      <motion.div className="relative overflow-x-clip" style={{ width }}>
        <div ref={inner} className="flex w-max items-center gap-1.5 whitespace-nowrap">
          <span className="relative inline-grid">
            <AnimatePresence initial={false} mode="popLayout">
              <motion.span
                key={label}
                data-slot="ai-status-label"
                className={cn('font-semibold', active ? 'k-ai-shimmer' : 'text-ink-3')}
                initial={{ y: 7, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -7, opacity: 0 }}
                transition={unit(snappy)}
              >
                {label}
              </motion.span>
            </AnimatePresence>
          </span>
          {detail ? (
            <span data-slot="ai-status-detail" className="max-w-56 truncate text-ink-3">
              {detail}
            </span>
          ) : null}
          {active && elapsed !== undefined ? (
            <span data-slot="ai-status-elapsed" className="text-ink-3 tabular-nums">
              {formatElapsed(elapsed)}
            </span>
          ) : null}
        </div>
      </motion.div>
    </div>
  )
}
