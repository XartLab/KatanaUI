// SPDX-License-Identifier: MIT
// 改自 SmoothUI ai-prompt-input（https://github.com/educlopez/smoothui ，MIT，© 2024 Eduardo Calvo）
// 提示词输入框：输入多行自动长高（到 8 行封顶再滚），回车发送、Shift+回车换行；流式输出时发送钮变成停止；附件一排小标；字数到上限的 80% 才显示计数。
// 长高优先用 CSS field-sizing: content；不支持时才退回 JS 取 textarea 自己的 scrollHeight，整页不会在敲字中途重排。
// 状态（AiState）只在这里改一件事：出错、完成时画一圈语义色，不改形——输入框随状态变形会跟正在写的字打架。
// 相对原件：所有英文（占位符、发送、停止、附件、移除）改成 props / labels；中文输入法选词时的回车不发送（见 ai-prompt-model.ts）；
// 发送钮与小按钮用我们的 Button；颜色走 token；弹簧取 snappy；去掉 reduced-motion 分支。
import { ArrowUp, Paperclip, Square, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import { Button } from '../primitives/button.tsx'
import { cn } from '../lib/cn.ts'
import { snappy } from '../lib/motion.ts'
import { unit } from '../lib/spring.ts'
import { COUNTER_VISIBLE_RATIO, formatBytes, shouldSubmit } from './ai-prompt-model.ts'
import { getAiStateAccentColor, type AiState } from './ai-core.ts'

const MIN_ROWS = 1
const MAX_ROWS = 8
/** 浏览器支持 field-sizing: content 时由 CSS 量高，JS 量高只作退路（modern-web-guidance: form-fields-automatically-fit-contents）。 */
const FIELD_SIZING = typeof CSS !== 'undefined' && CSS.supports('field-sizing', 'content')
/** 附件小标逐个错开 35ms 进场（原件 ATTACHMENT_STAGGER）。 */
const ATTACHMENT_STAGGER = 0.035

export type AiPromptAttachment = {
  id: string
  name: string
  /** Size in bytes; written as "12 KB" when present. */
  size?: number
}

export type AiPromptInputLabels = {
  /** 发送钮的读屏名。 */
  send: string
  /** 流式中发送钮变成的停止钮的读屏名。 */
  stop: string
  /** 附件钮的读屏名；给了 onAttach 才画。 */
  attach?: string
  /** 移除某个附件钮的读屏名，如「移除 报告.pdf」。 */
  removeAttachment?: (name: string) => string
}

export type AiPromptInputProps = {
  /**
   * Accessible name of the text field (required).
   * 输入框的读屏名（必填）。
   */
  label: string
  /** Names of the send / stop / attach buttons (required). */
  labels: AiPromptInputLabels
  /** Placeholder text in the UI language. */
  placeholder?: string
  /** Shared AI state; `streaming` turns send into stop, `error` and `done` draw a semantic ring. */
  state?: AiState
  /** Called with the trimmed draft on Enter or send. */
  onSubmit?: (value: string) => void
  /** Called when the stop button is pressed while `state` is `streaming`. */
  onStop?: () => void
  /** Controlled draft; leave undefined to let the component own it. */
  value?: string
  /** Called with the new draft on every change. */
  onValueChange?: (value: string) => void
  /** Files already attached to the draft. */
  attachments?: readonly AiPromptAttachment[]
  /** Shows the attach button when given. */
  onAttach?: () => void
  /** Shows a remove button on every attachment when given. */
  onRemoveAttachment?: (id: string) => void
  /** Shows a counter once the draft passes 80% of the limit; past it the counter turns red. */
  maxLength?: number
  /** Disables the field and its buttons. */
  disabled?: boolean
  /** Extra controls on the left of the toolbar, such as a model picker. */
  children?: ReactNode
  /** Extra class name on the root. */
  className?: string
}

export function AiPromptInput({
  label,
  labels,
  placeholder,
  state = 'idle',
  onSubmit,
  onStop,
  value,
  onValueChange,
  attachments = [],
  onAttach,
  onRemoveAttachment,
  maxLength,
  disabled = false,
  children,
  className,
}: AiPromptInputProps) {
  const textarea = useRef<HTMLTextAreaElement>(null)
  const [inner, setInner] = useState('')
  const [focused, setFocused] = useState(false)
  const controlled = value !== undefined
  const draft = controlled ? value : inner
  const streaming = state === 'streaming'
  const canSubmit = draft.trim().length > 0 && !disabled
  const ring = state === 'error' || state === 'done' ? getAiStateAccentColor(state, 'transparent') : undefined

  const resize = useCallback(() => {
    // 有 field-sizing 的浏览器由 CSS 量高，这里不再动高度。
    if (FIELD_SIZING) return
    const el = textarea.current
    if (!el) return
    // 先收回去，否则 scrollHeight 只增不减。
    el.style.height = 'auto'
    const lineHeight = Number.parseFloat(getComputedStyle(el).lineHeight || '20')
    const maxHeight = lineHeight * MAX_ROWS
    el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`
    el.style.overflowY = el.scrollHeight > maxHeight ? 'auto' : 'hidden'
  }, [])
  useLayoutEffect(() => {
    // 发送后草稿清空，框要回到一行，而不是留着刚发出去那条的高度。
    if (draft.length === 0 && textarea.current) textarea.current.style.height = ''
    resize()
  }, [draft, resize])

  const change = (event: ChangeEvent<HTMLTextAreaElement>) => {
    if (!controlled) setInner(event.target.value)
    onValueChange?.(event.target.value)
  }
  const submit = () => {
    if (streaming) {
      onStop?.()
      return
    }
    if (!canSubmit) return
    onSubmit?.(draft.trim())
    if (!controlled) setInner('')
  }
  const keyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (
      !shouldSubmit({
        key: event.key,
        shiftKey: event.shiftKey,
        isComposing: event.nativeEvent.isComposing,
        keyCode: event.keyCode,
      })
    )
      return
    event.preventDefault()
    submit()
  }

  const counterVisible = maxLength !== undefined && draft.length >= maxLength * COUNTER_VISIBLE_RATIO
  const overLimit = maxLength !== undefined && draft.length > maxLength
  const sendDisabled = disabled || !(canSubmit || streaming)

  return (
    <motion.div
      layout="position"
      data-slot="ai-prompt-input"
      data-state={state}
      transition={unit(snappy)}
      className={cn(
        'relative w-full k-mat-block transition-colors duration-[120ms]',
        focused && 'border-ink-4',
        disabled && 'opacity-60',
        className,
      )}
      // 状态只在这一圈上显出来：错了红、成了绿。
      style={ring ? { boxShadow: `0 0 0 1px ${ring}` } : undefined}
    >
      <AnimatePresence initial={false}>
        {attachments.length > 0 ? (
          <motion.ul
            key="attachments"
            className="m-0 flex list-none flex-wrap gap-2 overflow-hidden px-3 pt-3"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={unit(snappy)}
          >
            {attachments.map((attachment, index) => (
              <motion.li
                key={attachment.id}
                layout
                data-slot="ai-prompt-attachment"
                className="k-text-caption flex items-center gap-1.5 k-mat-inset py-1 pr-1 pl-2"
                initial={{ opacity: 0, scale: 0.9, y: 4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ ...unit(snappy), delay: index * ATTACHMENT_STAGGER }}
              >
                <span className="max-w-40 truncate text-ink">{attachment.name}</span>
                {attachment.size !== undefined ? (
                  <span className="text-ink-3">{formatBytes(attachment.size)}</span>
                ) : null}
                {onRemoveAttachment && labels.removeAttachment ? (
                  <Button
                    type="button"
                    variant="icon"
                    size="icon"
                    className="size-6"
                    aria-label={labels.removeAttachment(attachment.name)}
                    onClick={() => onRemoveAttachment(attachment.id)}
                  >
                    <X aria-hidden="true" size={12} />
                  </Button>
                ) : null}
              </motion.li>
            ))}
          </motion.ul>
        ) : null}
      </AnimatePresence>
      <textarea
        ref={textarea}
        aria-label={label}
        data-slot="ai-prompt-textarea"
        rows={MIN_ROWS}
        value={draft}
        disabled={disabled}
        placeholder={placeholder}
        onChange={change}
        onKeyDown={keyDown}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        // 高度由 CSS field-sizing: content 跟着内容长；上限 8 行 = 8lh + 上下内边距（pt-3 + pb-2 = 1.25rem），超出再滚。
        style={{ maxHeight: `calc(${MAX_ROWS}lh + 1.25rem)` }}
        className="k-text-body m-0 block [field-sizing:content] overflow-y-auto w-full resize-none rounded-none border-0 bg-transparent px-4 pt-3 pb-2 text-ink outline-0 placeholder:text-ink-3"
      />
      <div className="flex items-center justify-between gap-2 px-2 pb-2">
        <div className="flex min-w-0 items-center gap-1">
          {onAttach && labels.attach ? (
            <Button
              type="button"
              variant="icon"
              size="icon"
              aria-label={labels.attach}
              disabled={disabled}
              onClick={onAttach}
            >
              <Paperclip aria-hidden="true" size={16} />
            </Button>
          ) : null}
          {children}
        </div>
        <div className="flex items-center gap-2">
          <AnimatePresence initial={false}>
            {counterVisible ? (
              <motion.span
                key="counter"
                data-slot="ai-prompt-counter"
                className={cn(
                  'k-text-caption tabular-nums',
                  overLimit ? 'text-(color:--k-status-danger-foreground)' : 'text-ink-3',
                )}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={unit(snappy)}
              >
                {draft.length}/{maxLength}
              </motion.span>
            ) : null}
          </AnimatePresence>
          <Button
            type="button"
            variant="primary"
            size="icon"
            data-slot="ai-prompt-send"
            data-mode={streaming ? 'stop' : 'send'}
            aria-label={streaming ? labels.stop : labels.send}
            disabled={sendDisabled}
            onClick={submit}
            className="size-8 rounded-[var(--radius-control)]"
          >
            {/* 换的是真 lucide 字形（缩放加淡入淡出），不是一条手画路径的形变：细线箭头是发送的惯例，实心楔形读成「播放」。 */}
            <AnimatePresence initial={false} mode="popLayout">
              <motion.span
                key={streaming ? 'stop' : 'send'}
                className="flex items-center justify-center"
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.6 }}
                transition={unit(snappy)}
              >
                {streaming ? (
                  <Square aria-hidden="true" className="fill-current" size={12} strokeWidth={0} />
                ) : (
                  <ArrowUp aria-hidden="true" size={16} />
                )}
              </motion.span>
            </AnimatePresence>
          </Button>
        </div>
      </div>
    </motion.div>
  )
}
