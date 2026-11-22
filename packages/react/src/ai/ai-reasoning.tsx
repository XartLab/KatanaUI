// SPDX-License-Identifier: MIT
// 改自 SmoothUI ai-reasoning（https://github.com/educlopez/smoothui ，MIT，© 2024 Eduardo Calvo）
// 可折叠的推理过程：摘要行只在模型真的在想的时候有流光（流光有意义，不是装饰）；结束后停下来、报一个耗时、自己收起来让位给回答。
// 相对原件：英文文案（Thinking / Thought for / Reasoning）改成 labels 由调用方传；流光用我们的 .k-ai-shimmer；弹簧换成 snappy token；去掉 reduced-motion 分支。
import { ChevronRight } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { cn } from '../lib/cn.ts'
import { focusRing } from '../lib/focus.ts'
import { snappy } from '../lib/motion.ts'
import { unit } from '../lib/spring.ts'

/** 刚结束就收起会像内容被抽走，所以停一拍再收（原件 600ms）。 */
const AUTO_COLLAPSE_DELAY_MS = 600
const MS_PER_SECOND = 1000

export type AiReasoningLabels = {
  /** 流式中的摘要，如「思考中」。 */
  thinking: string
  /** 没有耗时可报时的摘要，如「推理过程」。 */
  reasoning: string
  /** 结束后的摘要，如「思考了 3.2 秒」。 */
  thought: (seconds: number) => string
}

export type AiReasoningProps = {
  /** The reasoning trace. */
  children: ReactNode
  /** Summary texts in the UI language (required). */
  labels: AiReasoningLabels
  /** Whether the model is still reasoning; the summary shimmers only while true. */
  isStreaming?: boolean
  /** Collapse itself once streaming ends, unless the reader has toggled it by hand. */
  collapseWhenDone?: boolean
  /** Start expanded; defaults to the value of `isStreaming`. */
  defaultOpen?: boolean
  /** Seconds the model spent; the component times it itself when omitted. */
  duration?: number
  /** Extra class name on the root. */
  className?: string
}

export function AiReasoning({
  children,
  labels,
  isStreaming = false,
  collapseWhenDone = true,
  defaultOpen,
  duration,
  className,
}: AiReasoningProps) {
  const panelId = useId()
  // 自动开合的状态；读者手动开合过（userOpen 不是 null）就以他为准，不再替他决定。
  const [autoOpen, setAutoOpen] = useState(defaultOpen ?? isStreaming)
  const [userOpen, setUserOpen] = useState<boolean | null>(null)
  const isOpen = userOpen ?? autoOpen
  // 开始流式就自动展开：按「上一次的值」在渲染里比对（React 文档的做法），不在 effect 里同步 setState。
  const [prevStreaming, setPrevStreaming] = useState(isStreaming)
  if (isStreaming !== prevStreaming) {
    setPrevStreaming(isStreaming)
    if (isStreaming) setAutoOpen(true)
  }
  // 耗时是对时钟的读数，只能在 effect 里取：开始时记下，结束时算出来。
  const startedAt = useRef<number | null>(null)
  const [measured, setMeasured] = useState<number | null>(null)
  useEffect(() => {
    if (isStreaming) {
      startedAt.current = Date.now()
      return
    }
    if (startedAt.current !== null) {
      const seconds = (Date.now() - startedAt.current) / MS_PER_SECOND
      startedAt.current = null
      setMeasured(seconds)
    }
  }, [isStreaming])

  useEffect(() => {
    if (isStreaming || !collapseWhenDone || userOpen !== null) return
    const timer = setTimeout(() => setAutoOpen(false), AUTO_COLLAPSE_DELAY_MS)
    return () => clearTimeout(timer)
  }, [collapseWhenDone, isStreaming, userOpen])

  const seconds = duration ?? measured
  const summary = isStreaming ? labels.thinking : seconds !== null ? labels.thought(seconds) : labels.reasoning

  return (
    <div data-slot="ai-reasoning" data-streaming={isStreaming || undefined} className={cn('w-full', className)}>
      <button
        type="button"
        data-slot="ai-reasoning-trigger"
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => setUserOpen(!isOpen)}
        className={cn(
          'k-text-data flex w-full cursor-pointer items-center gap-1.5 rounded-[var(--radius-control)] py-1 text-left text-ink-3',
          'transition-colors duration-[120ms] hover:text-ink',
          focusRing,
        )}
      >
        <motion.span
          aria-hidden="true"
          className="flex size-4 items-center justify-center"
          initial={false}
          animate={{ rotate: isOpen ? 90 : 0 }}
          transition={unit(snappy)}
        >
          <ChevronRight size={14} />
        </motion.span>
        {/* 流光就是「还在干活」的信号，所以只在流式中有；一个永远在闪的标签只是装饰。 */}
        <span data-slot="ai-reasoning-summary" className={cn(isStreaming && 'k-ai-shimmer')}>
          {summary}
        </span>
      </button>
      <AnimatePresence initial={false}>
        {isOpen ? (
          <motion.div
            id={panelId}
            key="trace"
            data-slot="ai-reasoning-content"
            className="overflow-hidden"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={unit(snappy)}
          >
            {/* 左边那条线兼作缩进：推理读起来是旁白，不是回答的一部分。 */}
            <div className="k-text-data mt-1 ml-[7px] border-l border-line pl-4 leading-relaxed text-ink-3">
              {children}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
