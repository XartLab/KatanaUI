// SPDX-License-Identifier: MIT
// 改自 Arc inline-edit（https://github.com/kuratlielia/arc-library ，registry/components/inline-edit，MIT，Copyright (c) 2026 Elia Kuratli；
// 2026-11-23 读，提交 8302b52）。原地改名：自选分组名、布局名、策略名、预警名这类「读得多、改得少」的短字段。
// 行为照原件：点一下字变成同样大小的输入框，光标落在点的那个字上（键盘激活是全选）；Enter 保存、Esc 放弃、点到件外面也保存（切走窗口不算）；
// 保存是乐观的：字先换成新值，onSave 返回的 Promise 落定后打一个勾，失败（reject）就退回上次存下的值，框下说为什么并给「重试」；
// validate 不过时留在编辑态、框下写原因。外面传来的新 value 在没在编辑、没在保存时直接换上。
// 相对原件：去掉字的模糊升起、宽度弹簧、勾的笔画动画、失败时的闪底（Precision Instrument §2.4：只留直接反馈；保存中的转圈算「加载」，留着）；
// 输入框宽度改用隐藏的镜像字撑开（CSS 网格叠放），不量尺寸；只做单行（多行的描述字段以后要再加）；文字全由 labels 给；颜色走 token（theme/inline-edit.css）。
import { Check, CircleAlert, LoaderCircle, Pencil, X } from 'lucide-react'
import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FocusEvent,
  type KeyboardEvent,
  type MouseEvent,
} from 'react'
import { cn } from '../lib/cn.ts'

/** 存好以后勾留多久（毫秒）：取自 Arc inline-edit 的 1800。 */
const SAVED_MS = 1800

/** Texts of InlineEdit (the package ships no text). */
export type InlineEditLabels = {
  /** Read after the value on the text, for example "Activate to edit". */
  editHint: string
  /** Accessible name of the save button shown while editing. */
  save: string
  /** Accessible name of the cancel button shown while editing. */
  cancel: string
  /** Announced while the save runs. */
  saving?: string
  /** Announced once the save lands. */
  saved?: string
  /** Message under the text after a failed save, given the value that could not be saved. */
  failed: (attempted: string) => string
  /** Text of the button that reopens the failed value for another try. */
  retry: string
}

export type InlineEditProps = {
  /** The saved value; a new value from outside replaces the text while it is not being edited or saved. */
  value: string
  /** Persists the new value; return a promise to show the saving state, reject it to roll back. */
  onSave: (next: string) => void | Promise<unknown>
  /** Accessible name of the field, for example "Watchlist name". */
  label: string
  /** Return a message when the draft cannot be saved; editing stays open and the message shows below. */
  validate?: (next: string) => string | null | undefined
  /** Shown when the value is empty. */
  placeholder?: string
  /** Element that holds the text, so a title can stay a heading. */
  as?: 'span' | 'p' | 'h1' | 'h2' | 'h3' | 'h4'
  /** Show the text without letting it be edited. */
  disabled?: boolean
  /** Texts: editHint, save, cancel, failed and retry are required. */
  labels: InlineEditLabels
  /** Extra class name on the root. */
  className?: string
}

type Phase = 'idle' | 'saving' | 'saved' | 'failed'

type CaretDocument = Document & {
  caretPositionFromPoint?: (x: number, y: number) => { offsetNode: Node; offset: number } | null
  caretRangeFromPoint?: (x: number, y: number) => Range | null
}

/** 点在字上的哪个位置：光标落在那个字后面，点在字外就放到末尾（照原件 caretAt）。 */
function caretAt(textNode: Node | null | undefined, x: number, y: number, length: number): number {
  if (!textNode || typeof document === 'undefined') return length
  const doc = document as CaretDocument
  const position = doc.caretPositionFromPoint?.(x, y)
  if (position) return position.offsetNode === textNode ? Math.min(position.offset, length) : length
  const range = doc.caretRangeFromPoint?.(x, y)
  return range && range.startContainer === textNode ? Math.min(range.startOffset, length) : length
}

/** 空白压成一个空格、去掉头尾：名字里打多的空格不留下来。 */
const clean = (text: string) => text.replaceAll(/\s+/g, ' ').trim()

/** Click-to-edit text for short names: the text turns into a field in place, Enter saves, Escape rolls back. */
export function InlineEdit({
  value,
  onSave,
  label,
  validate,
  placeholder = '',
  as: Tag = 'span',
  disabled,
  labels,
  className,
}: InlineEditProps) {
  const ids = useId()
  const hintId = `${ids}-hint`
  const messageId = `${ids}-message`
  const [committed, setCommitted] = useState(value)
  const [shown, setShown] = useState(value)
  const [seen, setSeen] = useState(value)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const [phase, setPhase] = useState<Phase>('idle')
  const [error, setError] = useState<string | null>(null)
  const [failed, setFailed] = useState<string | null>(null)
  const [announcement, setAnnouncement] = useState('')
  const root = useRef<HTMLDivElement>(null)
  const display = useRef<HTMLButtonElement>(null)
  const field = useRef<HTMLInputElement>(null)
  const selection = useRef<number | 'all' | null>(null)
  const focusDisplay = useRef(false)
  const saveRun = useRef(0)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  // 外面传来的新值：在渲染时对齐（由 props 推导的状态），正在打字或保存中就先不换。
  if (value !== seen) {
    setSeen(value)
    if (value !== committed) {
      setCommitted(value)
      if (!editing && phase !== 'saving') setShown(value)
    }
  }

  useEffect(() => () => clearTimeout(timer.current), [])

  // 焦点跟着模式走：进编辑时进输入框（光标放在点的地方或全选），Enter / Esc 之后回到字上。
  useLayoutEffect(() => {
    const input = field.current
    if (editing && input && selection.current !== null) {
      const at = selection.current
      selection.current = null
      input.focus({ preventScroll: true })
      if (at === 'all') input.select()
      else input.setSelectionRange(at, at)
    }
    if (!editing && focusDisplay.current) {
      focusDisplay.current = false
      display.current?.focus({ preventScroll: true })
    }
  })

  const saving = phase === 'saving'

  function startEdit(at: number | 'all', text = shown) {
    if (editing || saving || disabled) return
    clearTimeout(timer.current)
    setDraft(text)
    setEditing(true)
    setError(null)
    setFailed(null)
    if (phase !== 'idle') setPhase('idle')
    selection.current = at
  }

  function onDisplayClick(event: MouseEvent<HTMLButtonElement>) {
    // 键盘激活（detail 为 0）全选好重打；鼠标点的，光标落在点的字上。
    const textNode = display.current?.querySelector('[data-inline-text]')?.firstChild
    startEdit(event.detail === 0 ? 'all' : caretAt(textNode, event.clientX, event.clientY, shown.length))
  }

  function submit(source: 'key' | 'button' | 'blur') {
    const next = clean(draft)
    const problem = validate?.(next) || null
    if (problem) {
      setError(problem)
      if (source !== 'blur') field.current?.focus()
      return
    }
    setEditing(false)
    setError(null)
    if (source !== 'blur') focusDisplay.current = true
    if (next === shown) return
    const previous = committed
    const run = ++saveRun.current
    setShown(next)
    setPhase('saving')
    setAnnouncement(labels.saving ?? '')
    void Promise.resolve()
      .then(() => onSave(next))
      .then(
        () => {
          if (run !== saveRun.current) return
          setCommitted(next)
          setPhase('saved')
          setAnnouncement(labels.saved ?? '')
          clearTimeout(timer.current)
          timer.current = setTimeout(() => setPhase((current) => (current === 'saved' ? 'idle' : current)), SAVED_MS)
        },
        () => {
          if (run !== saveRun.current) return
          setShown(previous)
          setPhase('failed')
          setFailed(next)
          setAnnouncement('')
        },
      )
  }

  function cancel() {
    setEditing(false)
    setError(null)
    focusDisplay.current = true
  }

  function onChange(event: ChangeEvent<HTMLInputElement>) {
    const next = event.currentTarget.value
    setDraft(next)
    if (error) setError(validate?.(clean(next)) || null)
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    // 输入法组字中的按键先让给输入法：Enter 是选字（不是保存），Esc 是取消候选词（不是放弃整次编辑，已经打的字不能丢）。
    // Safari 上屏的那一下 Enter 已经不是 isComposing，但 keyCode 还是 229，两个都要判。
    if (event.nativeEvent.isComposing || event.keyCode === 229) return
    if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      cancel()
      return
    }
    if (event.key === 'Enter') {
      event.preventDefault()
      submit('key')
    }
  }

  // 焦点离开整个件就保存，跟改文件名一样；切走窗口（没有新的焦点、文档也没焦点）不算。
  function onBlur(event: FocusEvent<HTMLDivElement>) {
    if (!editing) return
    const next = event.relatedTarget as Node | null
    if (next && root.current?.contains(next)) return
    if (!next && !document.hasFocus()) return
    submit('blur')
  }

  const message = error
    ? { tone: 'error' as const, text: error }
    : failed !== null && !editing
      ? { tone: 'failed' as const, text: labels.failed(failed) }
      : null
  const describedBy = [hintId, message ? messageId : null].filter(Boolean).join(' ')
  // 中文名是一个字也算有内容；空的时候用零宽空格撑住行高，免得框塌成一条线。
  const mirror = (editing ? draft : shown) || placeholder || '​'

  return (
    <div
      ref={root}
      data-slot="inline-edit"
      data-phase={phase}
      data-editing={editing ? '' : undefined}
      data-invalid={error ? '' : undefined}
      className={cn('k-inedit', className)}
      onBlur={onBlur}
    >
      <Tag className="k-inedit-line">
        {editing ? (
          <span className="k-inedit-field">
            <span className="k-inedit-mirror" aria-hidden="true">
              {mirror}
            </span>
            <input
              ref={field}
              type="text"
              className="k-inedit-input"
              value={draft}
              placeholder={placeholder}
              aria-label={label}
              aria-invalid={error ? true : undefined}
              aria-describedby={message ? messageId : undefined}
              autoComplete="off"
              spellCheck={false}
              enterKeyHint="done"
              onChange={onChange}
              onKeyDown={onKeyDown}
            />
          </span>
        ) : (
          <button
            ref={display}
            type="button"
            className="k-inedit-display"
            disabled={disabled}
            aria-label={`${label}: ${shown || placeholder}`}
            aria-describedby={describedBy}
            aria-busy={saving || undefined}
            onClick={onDisplayClick}
          >
            <span data-inline-text="" data-empty={shown ? undefined : ''} className="k-inedit-text">
              {shown || placeholder || '​'}
            </span>
          </button>
        )}
        {/* 静止时点铅笔也进编辑（光标放末尾）；铅笔只是提示，读屏走字上的按钮。 */}
        <span
          className="k-inedit-slot"
          data-slot-state={editing ? 'edit' : phase}
          onClick={editing ? undefined : () => startEdit(shown.length)}
        >
          {editing ? (
            <>
              {/* 按下不抢焦点：点保存或取消时输入框不先失焦，免得失焦先存一次。 */}
              <button
                type="button"
                className="k-inedit-action"
                aria-label={labels.save}
                onPointerDown={(event) => event.preventDefault()}
                onClick={() => submit('button')}
              >
                <Check aria-hidden="true" />
              </button>
              <button
                type="button"
                className="k-inedit-action"
                aria-label={labels.cancel}
                onPointerDown={(event) => event.preventDefault()}
                onClick={cancel}
              >
                <X aria-hidden="true" />
              </button>
            </>
          ) : phase === 'saving' ? (
            <LoaderCircle className="k-inedit-spin" aria-hidden="true" />
          ) : phase === 'saved' ? (
            <Check className="k-inedit-saved" aria-hidden="true" />
          ) : phase === 'failed' ? (
            <CircleAlert className="k-inedit-failed" aria-hidden="true" />
          ) : disabled ? null : (
            <Pencil className="k-inedit-pencil" aria-hidden="true" />
          )}
        </span>
      </Tag>
      {message ? (
        <p id={messageId} className="k-inedit-message" data-tone={message.tone}>
          {message.text}
          {message.tone === 'failed' && failed !== null ? (
            <button type="button" className="k-inedit-retry" onClick={() => startEdit(failed.length, failed)}>
              {labels.retry}
            </button>
          ) : null}
        </p>
      ) : null}
      <span id={hintId} className="sr-only">
        {labels.editHint}
      </span>
      <span className="sr-only" role="status">
        {announcement}
      </span>
    </div>
  )
}
