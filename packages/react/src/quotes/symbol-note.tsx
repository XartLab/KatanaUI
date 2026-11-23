// SPDX-License-Identifier: MIT
// 品种备注（#150）：挂在品种行或报价头上的便签。有备注时显示一个小图标，悬停（200ms）或键盘聚焦先看全文，点一下钉住，钉住后可以编辑；
// 没有备注、又给了 onValueChange 时显示加号图标，点开直接进编辑。值是受控的：件只管草稿，「保存」时把去掉首尾空白的文字交给调用方存，存空字符串就是删掉。
// 功能参照 TradingView 自选列表与品种页的备注（只取「有就标一下、悬停看、点开改」的交互，不嵌、不抄）。
// 浮层用平台原生 popover（popover="manual"：悬停预览不会把别处开着的浮层关掉，点外面与 Esc 由件自己收），位置用 CSS 锚点定位，
// 不支持锚点定位的浏览器（Firefox）按触发钮的位置算一次 top / left；外观是 k-mat-overlay 材质。
import { StickyNoteIcon, StickyNotePlusIcon } from 'lucide-react'
import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
  type SyntheticEvent,
} from 'react'
import { cn } from '../lib/cn.ts'
import { Button } from '../primitives/button.tsx'
import { Textarea } from '../primitives/textarea.tsx'

export type SymbolNoteLabels = {
  /** Accessible name of the icon and the popup when there is a note, for example "Note". */
  note: string
  /** Accessible name of the plus icon when there is no note yet; falls back to note. */
  add?: string
  /** Text of the edit button. */
  edit: string
  /** Text of the save button. */
  save: string
  /** Text of the cancel button. */
  cancel: string
  /** Placeholder of the edit box. */
  placeholder?: string
}

export type SymbolNoteProps = {
  /** The note text (controlled); an empty or blank string means there is no note. */
  value: string
  /** Called with the trimmed text when the user saves; an empty string deletes the note. Omit for a read-only note. */
  onValueChange?: (value: string) => void
  /** Accessible names and button texts; the package has no built-in language. */
  labels: SymbolNoteLabels
  /** Heading at the top of the popup, usually the symbol ("AAPL"). */
  title?: ReactNode
  /** Longest note the edit box accepts, in characters. */
  maxLength?: number
  /** Extra class name on the root. */
  className?: string
}

type Mode = 'closed' | 'preview' | 'pinned'

/** 悬停多久出预览、移开多久收起（ms）：指针从图标挪进浮层要跨 4px 的缝，收起留 150ms。 */
export const SYMBOL_NOTE_OPEN_DELAY = 200
export const SYMBOL_NOTE_CLOSE_DELAY = 150

/** 保存时交给调用方的值：去掉首尾空白；空字符串表示删掉备注。 */
export const symbolNoteCommit = (draft: string): string => draft.trim()

/** 编辑框里的按键：Esc 放弃草稿，Ctrl / ⌘ + Enter 保存，别的照常输入。 */
export function symbolNoteKey(key: string, mod: boolean): 'cancel' | 'save' | null {
  if (key === 'Escape') return 'cancel'
  if (key === 'Enter' && mod) return 'save'
  return null
}

const stop = (event: SyntheticEvent) => event.stopPropagation()

export function SymbolNote({ value, onValueChange, labels, title, maxLength, className }: SymbolNoteProps) {
  const hasNote = value.trim() !== ''
  const editable = onValueChange !== undefined
  const [mode, setMode] = useState<Mode>('closed')
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const rootRef = useRef<HTMLSpanElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const popRef = useRef<HTMLDivElement>(null)
  const fieldRef = useRef<HTMLTextAreaElement>(null)
  const editRef = useRef<HTMLButtonElement>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  // 状态落定后焦点去哪：编辑框、「编辑」钮，或回到图标（关上时焦点在浮层里才回）。
  const focusNext = useRef<'field' | 'edit' | 'trigger' | null>(null)
  const id = useId()
  const popId = `${id}-pop`
  const anchor = `--k-snote-${id.replace(/[^\w-]/g, '')}`

  const clearTimer = () => clearTimeout(timer.current)
  const close = (returnFocus: boolean) => {
    clearTimer()
    setMode('closed')
    setEditing(false)
    if (returnFocus) focusNext.current = 'trigger'
  }
  const startEdit = () => {
    setDraft(value.trim())
    setEditing(true)
    focusNext.current = 'field'
  }
  const cancelEdit = () => {
    if (!hasNote) return close(true)
    setEditing(false)
    focusNext.current = 'edit'
  }
  const save = () => {
    const next = symbolNoteCommit(draft)
    onValueChange?.(next)
    if (!next) return close(true)
    setEditing(false)
    focusNext.current = 'edit'
  }

  // 浮层开合跟着 mode 走；不支持锚点定位时按图标的位置摆一次（贴在图标下方，不出视口）。
  useLayoutEffect(() => {
    const pop = popRef.current
    const trigger = triggerRef.current
    if (!pop || !trigger) return
    const open = pop.matches(':popover-open')
    if (mode === 'closed') {
      if (open) pop.hidePopover()
      return
    }
    if (!open) pop.showPopover()
    if (typeof CSS !== 'undefined' && CSS.supports('position-area', 'block-end')) return
    const box = trigger.getBoundingClientRect()
    const view = pop.ownerDocument.documentElement
    Object.assign(pop.style, {
      inset: 'auto',
      margin: '0',
      top: `${Math.max(8, Math.min(box.bottom + 4, view.clientHeight - pop.offsetHeight - 8))}px`,
      left: `${Math.max(8, Math.min(box.left, view.clientWidth - pop.offsetWidth - 8))}px`,
    })
  }, [mode, editing])

  useEffect(() => {
    const target = focusNext.current
    focusNext.current = null
    if (target === 'trigger') triggerRef.current?.focus()
    else if (target === 'edit') editRef.current?.focus()
    else if (target === 'field' && fieldRef.current) {
      const field = fieldRef.current
      field.focus()
      field.setSelectionRange(field.value.length, field.value.length)
    }
  })

  // 开着的时候：在件外按下指针就关（没保存的草稿丢掉）；焦点不在件里时按 Esc 也关（悬停预览）。
  useEffect(() => {
    if (mode === 'closed') return
    const root = rootRef.current
    if (!root) return
    const doc = root.ownerDocument
    const onDown = (event: PointerEvent) => {
      if (!root.contains(event.target as Node)) close(false)
    }
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape' && !event.defaultPrevented && !root.contains(event.target as Node)) close(false)
    }
    doc.addEventListener('pointerdown', onDown, true)
    doc.addEventListener('keydown', onKey)
    return () => {
      doc.removeEventListener('pointerdown', onDown, true)
      doc.removeEventListener('keydown', onKey)
    }
  })

  useEffect(() => clearTimer, [])

  if (!hasNote && !editable) return null

  const onKeyDown = (event: KeyboardEvent<HTMLSpanElement>) => {
    const inPop = popRef.current?.contains(event.target as Node) ?? false
    if (symbolNoteKey(event.key, false) === 'cancel' && mode !== 'closed') {
      event.preventDefault()
      event.stopPropagation()
      if (editing) cancelEdit()
      else close(inPop)
      return
    }
    // 浮层里的按键（打字、空格、方向键）与图标上的 Enter / 空格不冒泡到宿主行：行上的快捷键不该跟着动。
    if (inPop || event.key === 'Enter' || event.key === ' ') event.stopPropagation()
  }

  return (
    <span
      ref={rootRef}
      className={cn('k-snote', className)}
      data-slot="symbol-note"
      data-state={mode}
      data-empty={hasNote ? undefined : ''}
      style={{ '--k-snote-anchor': anchor } as CSSProperties}
      onKeyDown={onKeyDown}
      onPointerEnter={(event) => {
        if (event.pointerType !== 'mouse') return
        clearTimer()
        if (mode === 'closed' && hasNote) timer.current = setTimeout(() => setMode('preview'), SYMBOL_NOTE_OPEN_DELAY)
      }}
      onPointerLeave={() => {
        clearTimer()
        if (mode === 'preview') timer.current = setTimeout(() => setMode('closed'), SYMBOL_NOTE_CLOSE_DELAY)
      }}
      onBlur={(event) => {
        // 焦点走出件（Tab 走开）就关；点到浮层里不可聚焦的字时 relatedTarget 是 null，不算走出。
        const next = event.relatedTarget as Node | null
        if (next && !event.currentTarget.contains(next) && mode !== 'closed') close(false)
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        className="k-snote-trigger"
        data-slot="symbol-note-trigger"
        aria-label={hasNote ? labels.note : (labels.add ?? labels.note)}
        aria-haspopup="dialog"
        aria-expanded={mode !== 'closed'}
        aria-controls={popId}
        onPointerDown={stop}
        onClick={(event) => {
          event.stopPropagation()
          clearTimer()
          if (mode === 'pinned') return close(false)
          setMode('pinned')
          if (!hasNote) startEdit()
        }}
        onFocus={(event) => {
          if (mode === 'closed' && hasNote && event.currentTarget.matches(':focus-visible')) setMode('preview')
        }}
      >
        {hasNote ? <StickyNoteIcon aria-hidden="true" /> : <StickyNotePlusIcon aria-hidden="true" />}
      </button>
      <div
        ref={popRef}
        id={popId}
        popover="manual"
        className="k-snote-pop k-mat-overlay"
        data-slot="symbol-note-popup"
        data-editing={editing ? '' : undefined}
        role="dialog"
        aria-label={labels.note}
        onPointerDown={stop}
        onClick={stop}
        onFocus={() => mode === 'preview' && setMode('pinned')}
      >
        {title ? <div className="k-snote-title">{title}</div> : null}
        {editing ? (
          <>
            <Textarea
              ref={fieldRef}
              size="sm"
              rows={4}
              className="k-snote-field"
              data-slot="symbol-note-field"
              aria-label={labels.note}
              placeholder={labels.placeholder}
              maxLength={maxLength}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (symbolNoteKey(event.key, event.ctrlKey || event.metaKey) !== 'save') return
                event.preventDefault()
                save()
              }}
            />
            <div className="k-snote-actions">
              <Button size="sm" variant="ghost" data-slot="symbol-note-cancel" onClick={cancelEdit}>
                {labels.cancel}
              </Button>
              <Button size="sm" variant="primary" data-slot="symbol-note-save" onClick={save}>
                {labels.save}
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="k-snote-text" data-slot="symbol-note-text">
              {value.trim()}
            </p>
            {editable ? (
              <div className="k-snote-actions">
                <Button ref={editRef} size="sm" variant="ghost" data-slot="symbol-note-edit" onClick={startEdit}>
                  {labels.edit}
                </Button>
              </div>
            ) : null}
          </>
        )}
      </div>
    </span>
  )
}
