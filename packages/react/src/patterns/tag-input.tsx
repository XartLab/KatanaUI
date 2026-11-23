// SPDX-License-Identifier: MIT
// 改自 Arc tag-input（https://github.com/kuratlielia/arc-library ，registry/components/tag-input，MIT，Copyright (c) 2026 Elia Kuratli；
// 2026-11-23 读，提交 8302b52）。一个输入框里打字成标签：品种代码清单、策略标签、自选分组名、日志检索的关键词。
// 行为照原件：Enter 或逗号收下草稿，重复的（不分大小写）不收并让已有的那个跳一下；光标在框头时 Backspace 先选中最后一个标签、再按一次才删，← → 在标签间移，
// Esc 取消选中；点标签是选中它（焦点留在输入框）；离开输入框时把草稿收下。纯逻辑在 tag-input-model.ts（单测）。
// 相对原件：去掉标签进出与外框高度的弹簧、选中环的滑动（Precision Instrument §2.4：只留直接反馈，重复时的跳一下留着）；
// 外观换成我们输入框的皮（--k-editable-*，theme/tag-input.css）；读屏播报的话全由 labels 给；
// 加了粘贴一串（逗号、分号、换行、制表符分开）一次收成几个、normalize（如代码转大写）、validate（不过的不收、框下写原因）、max 封顶、sm 尺寸。
// 与 AnimatedTags 的分工：AnimatedTags 是在给定的一组里挑；TagInput 是自由输入，标签由用户打出来。
import { X } from 'lucide-react'
import { useId, useRef, useState, type ClipboardEvent, type KeyboardEvent, type MouseEvent } from 'react'
import { cn } from '../lib/cn.ts'
import { commitTags, hasSeparator, tagKeyAction, type TagCommitOptions } from './tag-input-model.ts'

/** Texts of TagInput (the package ships no text). */
export type TagInputLabels = {
  /** Accessible name of the remove button on a tag, for example (tag) => `Remove ${tag}`. */
  remove: (tag: string) => string
  /** Announced when a typed tag repeats one already in the list. */
  duplicate: (tag: string) => string
  /** Announced after tags are added. */
  added?: (tags: string[]) => string
  /** Announced after a tag is removed. */
  removed?: (tag: string) => string
  /** Announced when Backspace or an arrow key selects a tag, for example "600519 selected, Backspace removes it". */
  picked?: (tag: string) => string
  /** Shown and announced when max is reached and a tag was turned away. */
  full?: string
}

export type TagInputProps = {
  /** Accessible name of the field. */
  label: string
  /** Tags (controlled). */
  value?: readonly string[]
  /** Starting tags (uncontrolled). */
  defaultValue?: readonly string[]
  /** Called with the new list after a tag is added or removed. */
  onValueChange?: (value: string[]) => void
  /** Hint shown while there are no tags and no draft. */
  placeholder?: string
  /** Tidy a raw tag before it is checked, for example uppercasing a symbol. */
  normalize?: TagCommitOptions['normalize']
  /** Return a message to turn a tag down; the draft stays and the message shows under the field. */
  validate?: TagCommitOptions['validate']
  /** Largest number of tags. */
  max?: number
  /** Height of the field: md is 30px (default), sm is 26px. */
  size?: 'sm' | 'md'
  /** Grey out the field and its tags. */
  disabled?: boolean
  /** Id of the text box, for a visible label's htmlFor. */
  id?: string
  /** Texts: remove and duplicate are required; the other announcements are optional. */
  labels: TagInputLabels
  /** Extra class name on the root. */
  className?: string
}

/** A text field that turns what is typed into removable tags: Enter or a comma adds, Backspace selects then removes. */
export function TagInput({
  label,
  value,
  defaultValue = [],
  onValueChange,
  placeholder,
  normalize,
  validate,
  max,
  size = 'md',
  disabled,
  id,
  labels,
  className,
}: TagInputProps) {
  const autoId = useId()
  const inputId = id ?? autoId
  const errorId = `${inputId}-error`
  const [internal, setInternal] = useState<readonly string[]>(defaultValue)
  const [draft, setDraft] = useState('')
  const [pickedTag, setPickedTag] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const boxRef = useRef<HTMLDivElement>(null)
  const tags = value ?? internal
  const picked = pickedTag === null ? null : tags.indexOf(pickedTag)
  const pickedIndex = picked === null || picked < 0 ? null : picked

  // 同一句话连播两次时读屏会吞掉第二次：末尾补一个不换行空格让它算新内容（照原件 say）。
  const say = (message: string | undefined) => {
    if (message) setNotice((previous) => (previous === message ? `${message} ` : message))
  }
  const update = (next: string[]) => {
    if (value === undefined) setInternal(next)
    onValueChange?.(next)
  }
  const pick = (index: number | null) => {
    const tag = index === null ? null : (tags[index] ?? null)
    setPickedTag(tag)
    if (tag !== null) say(labels.picked?.(tag))
  }
  // 重复时让已有的那个跳一下（原件的 1 → 1.06 → 1）：Web Animations，不进状态、不重渲染。
  const pulse = (tag: string) => {
    const node = boxRef.current?.querySelector<HTMLElement>(`[data-tag="${CSS.escape(tag)}"]`)
    node?.animate?.([{ scale: 1 }, { scale: 1.06 }, { scale: 1 }], { duration: 240, easing: 'ease-in-out' })
  }

  /** 收下一段文字（草稿或粘贴的）；有被拒的就把被拒的留在框里。 */
  const commit = (raw: string) => {
    const result = commitTags(tags, raw, { normalize, validate, max })
    if (result.added.length > 0) {
      update(result.next)
      say(labels.added?.(result.added))
    }
    for (const tag of result.duplicates) pulse(tag)
    if (result.duplicates.length > 0 && result.added.length === 0) say(labels.duplicate(result.duplicates[0]!))
    const turnedDown = result.rejected[0]
    const message = turnedDown ? (turnedDown.reason ?? labels.full ?? null) : null
    setError(message)
    if (message) say(message)
    setDraft(result.rejected.map((item) => item.tag).join(', '))
    setPickedTag(null)
  }

  const remove = (index: number) => {
    const tag = tags[index]
    if (tag === undefined) return
    update(tags.filter((_, at) => at !== index))
    setPickedTag(null)
    setError(null)
    say(labels.removed?.(tag))
    inputRef.current?.focus()
  }

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    // 输入法组字时的 Enter 是选字，不是收标签。Safari 先发 compositionend 再发 keydown，那时 isComposing 已是 false，要再判 keyCode 229（#198 审查）。
    if (event.nativeEvent.isComposing || event.keyCode === 229) return
    const input = event.currentTarget
    const action = tagKeyAction(event.key, {
      count: tags.length,
      picked: pickedIndex,
      atStart: input.selectionStart === 0 && input.selectionEnd === 0,
      hasDraft: draft.trim().length > 0,
    })
    if (!action) return
    event.preventDefault()
    if (action.type === 'commit') commit(draft)
    else if (action.type === 'remove') remove(action.index)
    else pick(action.index)
  }

  const onPaste = (event: ClipboardEvent<HTMLInputElement>) => {
    const text = event.clipboardData.getData('text')
    if (!hasSeparator(text)) return
    event.preventDefault()
    commit(draft + text)
  }

  // 点标签选中它，焦点留在输入框（按下时不让标签抢焦点）；× 自己处理。点框里的空白处聚焦输入框。
  const onTagMouseDown = (event: MouseEvent<HTMLElement>) => {
    if (!(event.target as HTMLElement).closest('button')) event.preventDefault()
  }
  const onTagClick = (event: MouseEvent<HTMLElement>, index: number) => {
    if ((event.target as HTMLElement).closest('button') || disabled) return
    pick(pickedIndex === index ? null : index)
    inputRef.current?.focus()
  }

  return (
    <div
      data-slot="tag-input"
      data-size={size}
      data-disabled={disabled ? '' : undefined}
      data-invalid={error ? '' : undefined}
      className={cn('k-tagin', className)}
    >
      <div
        ref={boxRef}
        className="k-tagin-box"
        onClick={(event) => {
          if (event.target === event.currentTarget) inputRef.current?.focus()
        }}
      >
        {tags.map((tag, index) => (
          <span
            key={tag}
            className="k-tagin-tag"
            data-tag={tag}
            data-picked={index === pickedIndex ? '' : undefined}
            onMouseDown={onTagMouseDown}
            onClick={(event) => onTagClick(event, index)}
          >
            <span className="k-tagin-text">{tag}</span>
            {/* 键盘走 Backspace 选中再删，× 不进 Tab 序列，免得十个标签要按十次 Tab 才到输入框。 */}
            <button
              type="button"
              tabIndex={-1}
              disabled={disabled}
              className="k-tagin-remove"
              aria-label={labels.remove(tag)}
              onClick={() => remove(index)}
            >
              <X aria-hidden="true" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          id={inputId}
          className="k-tagin-input"
          type="text"
          value={draft}
          disabled={disabled}
          aria-label={label}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          placeholder={tags.length === 0 ? placeholder : undefined}
          autoComplete="off"
          spellCheck={false}
          onChange={(event) => {
            setDraft(event.currentTarget.value)
            setPickedTag(null)
            if (error) setError(null)
          }}
          onKeyDown={onKeyDown}
          onPaste={onPaste}
          onBlur={() => {
            if (draft.trim()) commit(draft)
            setPickedTag(null)
          }}
        />
      </div>
      {error ? (
        <p id={errorId} className="k-tagin-error">
          {error}
        </p>
      ) : null}
      <span className="sr-only" aria-live="polite">
        {notice}
      </span>
    </div>
  )
}
