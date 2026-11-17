// SPDX-License-Identifier: MIT
// 改自 SmoothUI ai-tool-call（https://github.com/educlopez/smoothui ，MIT，© 2024 Eduardo Calvo）
// 一次工具调用，默认折成一行（名字、右侧小注、状态环）；参数与结果想看再展开。
// 状态徽标是「一个会变脸的环」而不是四个图标换来换去：排队时环呼吸，运行时环缺一口并转，成功保留环并在里面画对勾，失败画叉。环始终不卸载，眼睛追的是同一个东西。
// 相对原件：状态读屏词与「参数 / 结果」小标题改成 labels；颜色走 token（成功 --signal-green、失败 --signal-red）；转与呼吸用 CSS 循环；弹簧取 snappy token；去掉 reduced-motion 分支。
import { ChevronRight } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useId, useState, type ReactNode } from 'react'
import { cn } from '../lib/cn.ts'
import { focusRing } from '../lib/focus.ts'
import { snappy } from '../lib/motion.ts'
import { unit } from '../lib/spring.ts'

export type AiToolCallStatus = 'pending' | 'running' | 'success' | 'error'

export type AiToolCallLabels = {
  /** 各状态的读屏词，如「排队」「运行中」「完成」「失败」。 */
  status: Readonly<Record<AiToolCallStatus, string>>
  /** 展开区「参数」小标题。 */
  args: string
  /** 展开区「结果」小标题。 */
  result: string
}

const RING_RADIUS = 8
const CHECK_PATH = 'M 8.5 12.2 L 11 14.8 L 15.8 9.6'
const CROSS_PATHS = ['M 9 9 L 15 15', 'M 15 9 L 9 15'] as const

const RING_COLOR: Readonly<Record<AiToolCallStatus, string>> = {
  pending: 'currentColor',
  running: 'currentColor',
  success: 'var(--signal-green)',
  error: 'var(--signal-red)',
}

function StatusRing({ status }: { status: AiToolCallStatus }) {
  const running = status === 'running'
  const color = RING_COLOR[status]
  return (
    <span
      className="relative flex size-5 shrink-0 items-center justify-center text-ink-3"
      data-slot="ai-tool-call-ring"
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5 overflow-visible">
        <g className={cn(running && 'k-status-spin')}>
          {/* 色与缺口用 CSS 过渡（motion 在 var() 颜色间插值不可靠）；运行时环缺一口（0.68 实 0.32 空），其余合拢。 */}
          <circle
            className={cn(
              'transition-[stroke,stroke-dasharray] duration-[var(--dur-snappy)] ease-[var(--ease-snappy)]',
              status === 'pending' && 'k-ai-pending',
            )}
            cx={12}
            cy={12}
            r={RING_RADIUS}
            fill="none"
            pathLength={1}
            strokeLinecap="round"
            strokeWidth={2}
            style={{ stroke: color, strokeDasharray: running ? '0.68 0.32' : '1 0' }}
          />
        </g>
        <AnimatePresence initial={false}>
          {status === 'success' ? (
            <motion.path
              key="check"
              d={CHECK_PATH}
              fill="none"
              stroke={color}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.2}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.1 } }}
              transition={unit(snappy)}
            />
          ) : null}
          {status === 'error'
            ? CROSS_PATHS.map((path, index) => (
                <motion.path
                  key={path}
                  d={path}
                  fill="none"
                  stroke={color}
                  strokeLinecap="round"
                  strokeWidth={2.2}
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  exit={{ opacity: 0, transition: { duration: 0.1 } }}
                  transition={{ ...unit(snappy), delay: index * 0.06 }}
                />
              ))
            : null}
        </AnimatePresence>
      </svg>
    </span>
  )
}

export type AiToolCallProps = {
  /** Tool name, e.g. `search_news`; shown in the mono font. */
  name: string
  /** Texts in the UI language (required). */
  labels: AiToolCallLabels
  /** Lifecycle state of the call. */
  status?: AiToolCallStatus
  /** Arguments the tool was called with, rendered as given. */
  args?: ReactNode
  /** What the tool returned, rendered as given. */
  result?: ReactNode
  /** Short right-aligned note such as "3 hits" or "1.2s". */
  summary?: string
  /** Start expanded. */
  defaultOpen?: boolean
  /** Extra class name on the root. */
  className?: string
}

export function AiToolCall({
  name,
  labels,
  status = 'pending',
  args,
  result,
  summary,
  defaultOpen = false,
  className,
}: AiToolCallProps) {
  const panelId = useId()
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const hasDetail = Boolean(args || result)
  const heading = 'k-text-micro m-0 mb-1 text-ink-3 uppercase'
  return (
    <div
      data-slot="ai-tool-call"
      data-status={status}
      className={cn(
        'w-full overflow-hidden rounded-[var(--radius-overlay)] border border-line bg-surface-1',
        className,
      )}
    >
      <button
        type="button"
        data-slot="ai-tool-call-trigger"
        aria-expanded={hasDetail ? isOpen : undefined}
        aria-controls={hasDetail ? panelId : undefined}
        disabled={!hasDetail}
        onClick={() => setIsOpen((current) => !current)}
        className={cn(
          'flex w-full items-center gap-2.5 px-3 py-2 text-left enabled:cursor-pointer',
          'transition-colors duration-[120ms] enabled:hover:bg-surface-2',
          focusRing,
        )}
      >
        <StatusRing status={status} />
        <span
          className="k-text-data min-w-0 flex-1 truncate font-mono font-semibold text-ink"
          data-slot="ai-tool-call-name"
        >
          {name}
        </span>
        {summary ? <span className="k-text-caption shrink-0 text-ink-3 tabular-nums">{summary}</span> : null}
        <span className="sr-only">{labels.status[status]}</span>
        {hasDetail ? (
          <motion.span
            aria-hidden="true"
            className="flex size-4 shrink-0 items-center justify-center text-ink-3"
            initial={false}
            animate={{ rotate: isOpen ? 90 : 0 }}
            transition={unit(snappy)}
          >
            <ChevronRight size={14} />
          </motion.span>
        ) : null}
      </button>
      <AnimatePresence initial={false}>
        {isOpen && hasDetail ? (
          <motion.div
            id={panelId}
            key="detail"
            data-slot="ai-tool-call-detail"
            className="overflow-hidden"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={unit(snappy)}
          >
            <div className="k-text-caption space-y-2 border-t border-line px-3 py-2.5">
              {args ? (
                <div>
                  <p className={heading}>{labels.args}</p>
                  <div className="overflow-x-auto font-mono text-ink">{args}</div>
                </div>
              ) : null}
              {result ? (
                <div>
                  <p className={heading}>{labels.result}</p>
                  <div className="overflow-x-auto text-ink">{result}</div>
                </div>
              ) : null}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
