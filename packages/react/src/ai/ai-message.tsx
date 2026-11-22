// SPDX-License-Identifier: MIT
// 改自 SmoothUI ai-message（https://github.com/educlopez/smoothui ，MIT，© 2024 Eduardo Calvo）
// 一条对话消息：气泡加不碍事的动作（复制、重试、赞踩）。动作从气泡自己的边上滑出来，不是凭空淡入；悬停与键盘聚焦（focus-within）都会显出，
// 因为只认悬停的控件键盘够不着。动作始终挂着只是淡掉：悬停才挂上去会让行高变，下面的消息跟着指针跳。
// 相对原件：Copy / Retry / Good response 等词改成 labels（哪个动作有词才画哪个）；按钮用我们的 Button 图标款；去掉内联 <style>，显隐用 Tailwind 的 group 变体；去掉 reduced-motion 分支。
import { Check, Copy, RotateCcw, ThumbsDown, ThumbsUp, type LucideIcon } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { Button } from '../primitives/button.tsx'
import { cn } from '../lib/cn.ts'

const COPIED_RESET_MS = 1600
/** 动作逐个错开 30ms 显出（原件 ACTION_STAGGER_MS）。 */
const ACTION_STAGGER_MS = 30

export type AiMessageAuthor = 'user' | 'assistant'

export type AiMessageLabels = {
  copy?: string
  copied?: string
  retry?: string
  good?: string
  bad?: string
}

export type AiMessageProps = {
  /** The message body. */
  children: ReactNode
  /**
   * Who wrote it; named `from` rather than `role` because `role` is an ARIA attribute.
   * 谁写的；不叫 role，那是 ARIA 属性。
   */
  from?: AiMessageAuthor
  /** Draw the tinted bubble; turn it off for assistant turns that carry their own surfaces (reasoning, tool calls, diffs). */
  bubble?: boolean
  /** Rendered beside the bubble, such as an avatar or an orb. */
  avatar?: ReactNode
  /** Preformatted timestamp, such as "14:32". */
  timestamp?: string
  /** Plain text for the clipboard; the copy action needs this and `labels.copy`. */
  copyText?: string
  /** Called by the retry action (needs `labels.retry`). */
  onRetry?: () => void
  /** Called by the vote actions on assistant messages (need `labels.good` and `labels.bad`). */
  onVote?: (vote: 'up' | 'down') => void
  /** Action names in the UI language; an action is drawn only when its name is given. */
  labels?: AiMessageLabels
  /** Extra class name on the root. */
  className?: string
}

type Action = { key: string; icon: LucideIcon; label: string; active: boolean; onClick: () => void }

export function AiMessage({
  children,
  from = 'assistant',
  bubble = true,
  avatar,
  timestamp,
  copyText,
  onRetry,
  onVote,
  labels,
  className,
}: AiMessageProps) {
  const [copied, setCopied] = useState(false)
  const [vote, setVote] = useState<'up' | 'down' | null>(null)
  const isUser = from === 'user'

  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), COPIED_RESET_MS)
    return () => clearTimeout(timer)
  }, [copied])

  const copy = async () => {
    if (!copyText) return
    try {
      await navigator.clipboard.writeText(copyText)
      setCopied(true)
    } catch {
      // 剪贴板被挡不值得打断对话。
    }
  }

  const actions: Action[] = []
  if (copyText && labels?.copy)
    actions.push({
      key: 'copy',
      icon: copied ? Check : Copy,
      label: copied ? (labels.copied ?? labels.copy) : labels.copy,
      active: copied,
      onClick: copy,
    })
  if (onRetry && labels?.retry)
    actions.push({ key: 'retry', icon: RotateCcw, label: labels.retry, active: false, onClick: onRetry })
  // 给自己的消息点赞没有意义，所以赞踩只在助手消息上画，哪怕调用方给了整条对话的 onVote。
  if (onVote && !isUser && labels?.good && labels.bad) {
    actions.push({
      key: 'up',
      icon: ThumbsUp,
      label: labels.good,
      active: vote === 'up',
      onClick: () => {
        setVote('up')
        onVote('up')
      },
    })
    actions.push({
      key: 'down',
      icon: ThumbsDown,
      label: labels.bad,
      active: vote === 'down',
      onClick: () => {
        setVote('down')
        onVote('down')
      },
    })
  }

  return (
    // 显隐绑在这个具名 group 上，而不是通用的 group：页面别处有 group 祖先时不会一起把每行的动作都亮出来。
    <div
      data-slot="ai-message"
      data-from={from}
      className={cn('group/msg flex w-full gap-2.5', isUser ? 'flex-row-reverse' : 'flex-row', className)}
    >
      {avatar ? <div className="mt-0.5 shrink-0">{avatar}</div> : null}
      <div className={cn('flex min-w-0 flex-col gap-1', isUser && 'items-end')}>
        <div
          data-slot="ai-message-body"
          className={cn(
            'k-text-body w-fit max-w-prose leading-relaxed text-ink',
            bubble && 'border border-line px-3.5 py-2.5',
            bubble && 'rounded-[var(--radius-overlay)]',
            bubble &&
              (isUser
                ? 'rounded-br-[var(--radius-inner)] bg-surface-4'
                : 'rounded-bl-[var(--radius-inner)] bg-surface-2'),
          )}
        >
          {children}
        </div>
        <div className={cn('flex items-center gap-1 px-1', isUser ? 'flex-row-reverse' : 'flex-row')}>
          {/* 时间戳排在最前，钉在气泡锚着的那一边；让常驻（只是透明）的动作位排在它前面，会把它推到行中间，读起来像飘着。 */}
          {timestamp ? <span className="k-text-caption text-ink-3 tabular-nums">{timestamp}</span> : null}
          {actions.map((action, index) => {
            const Icon = action.icon
            return (
              <Button
                key={action.key}
                type="button"
                variant="icon"
                size="icon"
                aria-label={action.label}
                aria-pressed={action.key === 'up' || action.key === 'down' ? action.active : undefined}
                data-slot={`ai-message-${action.key}`}
                onClick={action.onClick}
                style={{ transitionDelay: `${index * ACTION_STAGGER_MS}ms` }}
                className={cn(
                  'size-7 opacity-0 transition-[opacity,translate,scale,color,background-color] duration-200 ease-[var(--ease-snappy)]',
                  isUser ? 'translate-x-1.5' : '-translate-x-1.5',
                  'scale-90 group-focus-within/msg:translate-x-0 group-focus-within/msg:scale-100 group-focus-within/msg:opacity-100',
                  'group-hover/msg:translate-x-0 group-hover/msg:scale-100 group-hover/msg:opacity-100',
                  action.active && 'text-ink',
                )}
              >
                <Icon aria-hidden="true" size={14} className={cn(action.key === 'copy' && copied && 'k-ai-pop')} />
              </Button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
