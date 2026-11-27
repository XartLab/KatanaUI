// SPDX-License-Identifier: MIT
// 改自 SmoothUI ai-diff（https://github.com/educlopez/smoothui ，MIT，© 2024 Eduardo Calvo）
// 一份等人点头的修改：新增的行从左往右「擦」进来（擦有方向，方向告诉你这是被写上去的，不是本来就在）；上下文行不动，免得谎报改动。
// 拒绝时各行收到零高，让出版面（被拒的修改不该继续占着页面）。接受时卡片闪一下绿、拒绝闪一下红，然后停。
// 用来展示 AI 改了什么参数（交易里：策略参数的前后差）。
// 相对原件：Accept / Reject / 已决定的词改成 labels；按钮用我们的 Button；颜色走 token；去掉 reduced-motion 分支；闪色改成 CSS 一次性动画（motion 动不了 color-mix）。
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { Button } from '../primitives/button.tsx'
import { cn } from '../lib/cn.ts'
import { snappy } from '../lib/motion.ts'
import { unit } from '../lib/spring.ts'
import { countDiff, DIFF_PREFIX, type AiDiffLine, type AiDiffLineKind } from './ai-diff-model.ts'

export type { AiDiffLine, AiDiffLineKind } from './ai-diff-model.ts'

/** 每行晚 20ms 开擦（原件 LINE_STAGGER）。 */
const LINE_STAGGER = 0.02
/** 擦进来的一段用 snappy 弹簧（原件是 0.28 秒的缓出），只保留逐行错开；下面是各行底色。 */
const ROW_TONE: Readonly<Record<AiDiffLineKind, string>> = {
  added: 'bg-[color-mix(in_srgb,var(--signal-green)_13%,transparent)]',
  removed: 'bg-[color-mix(in_srgb,var(--signal-red)_11%,transparent)]',
  context: '',
}
const PREFIX_TONE: Readonly<Record<AiDiffLineKind, string>> = {
  added: 'text-(color:--signal-green)',
  removed: 'text-(color:--signal-red)',
  context: 'text-ink-3',
}

export type AiDiffLabels = {
  accept: string
  reject: string
  /** 接受后的状态词，如「已接受」。 */
  accepted: string
  /** 拒绝后的状态词，如「已拒绝」。 */
  rejected: string
  /** 读屏用的行性质：新增、删除、未变。 */
  added: string
  removed: string
  context: string
}

export type AiDiffProps = {
  /** The lines of the change. */
  lines: readonly AiDiffLine[]
  /** Texts in the UI language (required). */
  labels: AiDiffLabels
  /** What is changing, such as a file path or "Strategy parameters". */
  title?: string
  /** Called when the reader accepts; the accept button is shown only when this is given. */
  onAccept?: () => void
  /** Called when the reader rejects; the reject button is shown only when this is given. */
  onReject?: () => void
  /** Extra class name on the root. */
  className?: string
}

export function AiDiff({ lines, labels, title, onAccept, onReject, className }: AiDiffProps) {
  const [decision, setDecision] = useState<'accepted' | 'rejected' | null>(null)
  const { added, removed } = countDiff(lines)
  const decide = (next: 'accepted' | 'rejected', callback?: () => void) => {
    setDecision(next)
    callback?.()
  }
  const kindLabel: Readonly<Record<AiDiffLineKind, string>> = {
    added: labels.added,
    removed: labels.removed,
    context: labels.context,
  }
  return (
    <motion.div
      layout
      data-slot="ai-diff"
      data-decision={decision ?? undefined}
      // 决定后才带上 data-flash，CSS 的一次性闪色动画此时才开始播。
      data-flash={decision ? (decision === 'accepted' ? 'ok' : 'no') : undefined}
      transition={unit(snappy)}
      className={cn('k-ai-flash w-full overflow-hidden k-mat-block', className)}
    >
      <div className="flex items-center gap-2 border-b border-line px-3 py-2">
        {title ? <span className="k-text-caption min-w-0 truncate font-mono text-ink">{title}</span> : null}
        <span
          className="k-text-caption ml-auto flex shrink-0 items-center gap-1.5 tabular-nums"
          data-slot="ai-diff-count"
        >
          <span className="text-(color:--signal-green)">+{added}</span>
          <span className="text-(color:--signal-red)">-{removed}</span>
        </span>
      </div>
      <AnimatePresence initial={false}>
        {decision !== 'rejected' ? (
          <motion.div
            key="lines"
            className="overflow-hidden"
            exit={{ height: 0, opacity: 0 }}
            transition={unit(snappy)}
          >
            <div role="list" className="k-text-caption overflow-x-auto py-1 font-mono leading-relaxed">
              {lines.map((line, index) => (
                <motion.div
                  // 行是按位置排的，可能原样重复，所以用下标当 key。
                  key={index}
                  role="listitem"
                  data-slot="ai-diff-line"
                  data-kind={line.kind}
                  className={cn('flex gap-3 px-3', ROW_TONE[line.kind])}
                  // 只有新增的行擦进来：上下文行本来就在，给它动效等于谎报了改动。
                  initial={line.kind === 'added' ? { clipPath: 'inset(0 100% 0 0)' } : false}
                  animate={{ clipPath: 'inset(0 0% 0 0)' }}
                  transition={{ ...unit(snappy), delay: index * LINE_STAGGER }}
                >
                  <span className="sr-only">{kindLabel[line.kind]}</span>
                  {line.number !== undefined ? (
                    <span aria-hidden="true" className="w-6 shrink-0 text-right text-ink-3 select-none tabular-nums">
                      {line.number}
                    </span>
                  ) : null}
                  <span aria-hidden="true" className={cn('w-2 shrink-0 select-none', PREFIX_TONE[line.kind])}>
                    {DIFF_PREFIX[line.kind]}
                  </span>
                  <span className="whitespace-pre text-ink">{line.content}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
      {(onAccept || onReject) && !decision ? (
        <div className="flex items-center justify-end gap-2 border-t border-line px-3 py-2">
          {onReject ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              data-slot="ai-diff-reject"
              onClick={() => decide('rejected', onReject)}
            >
              {labels.reject}
            </Button>
          ) : null}
          {onAccept ? (
            <Button
              type="button"
              size="sm"
              variant="primary"
              data-slot="ai-diff-accept"
              onClick={() => decide('accepted', onAccept)}
            >
              {labels.accept}
            </Button>
          ) : null}
        </div>
      ) : null}
      <p
        role="status"
        data-slot="ai-diff-decision"
        className={cn('k-text-caption m-0 text-ink-3', decision && 'border-t border-line px-3 py-2')}
      >
        {decision ? (decision === 'accepted' ? labels.accepted : labels.rejected) : null}
      </p>
    </motion.div>
  )
}
