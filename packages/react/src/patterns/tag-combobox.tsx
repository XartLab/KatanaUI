// SPDX-License-Identifier: MIT
// 带标签的多选 Combobox（#193）：字段本身是输入框，已选项以小标签排在框里（可换行、可带头像或图标），光标跟在最后一个标签后面，打字就过滤。
// 交互参照 Jamie Merrill 的 Multi select combobox · Dark 与 Single select combobox · Light（2026-11-24 逐帧看，只借交互：
// 框里的标签、打字过滤与命中字加强、Enter 选、输入空时两次 Backspace 删标签、行带头像与第二行说明）；样子是我们的（--k-* token，跟 TagInput 同一张输入框皮）。
// 为什么不用 cmdk（Combobox 用的）：cmdk 的 option 把 aria-selected 当「高亮」，而这里要 aria-selected = 已选（多选 listbox 的规矩）；
// 它的输入框又写死 aria-expanded=true，关着的时候不对。所以列表、高亮、键盘自己管（纯逻辑在 tag-combobox-model.ts，有单测），弹层仍是 Radix Popover。
// 弹层锚在整个字段（PopoverAnchor）而不是某个按钮：标签多到换行、字段长高时 Radix 用 ResizeObserver 重新定位，弹层跟着下移，不压住字段。
// 焦点一直在输入框：打开、选中、删标签都不抢焦点（行与 × 按下时 preventDefault）；点字段、↓、打字都会开，单靠 Tab 进来不开。
// 读屏：输入框是 combobox（aria-expanded 随开关、aria-activedescendant 指高亮行、aria-controls 指列表），列表 listbox（aria-multiselectable），
// 行 option，aria-selected 是「已选」；高亮只看 aria-activedescendant 与 data-active。标签上的 × 是按钮（不进 Tab 序列，键盘走 Backspace 与 ← →），读屏名由 labels.remove 给。
// 文案（读屏名、没有结果、播报）都由调用方传，包里不写字。
import { Check, ChevronDown, X } from 'lucide-react'
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  type Ref,
} from 'react'
import { cn } from '../lib/cn.ts'
import { Popover, PopoverAnchor, PopoverContent } from '../primitives/popover.tsx'
import {
  filterOptions,
  splitByRanges,
  stepActive,
  tagComboboxKeyAction,
  toggleId,
  type MatchRange,
} from './tag-combobox-model.ts'

export type TagComboboxOption = {
  /** Stable id reported in value. */
  id: string
  /** Main text of the row and the tag. */
  label: string
  /** Second line of the row, for example a role. It is searched and highlighted too. */
  description?: string
  /** Node before the text in the row and in the tag (avatar, icon). Decorative: hidden from screen readers, the label carries the name. */
  prefix?: ReactNode
  /** Extra words that match without showing. */
  keywords?: readonly string[]
}

/** Texts of TagCombobox (the package ships no text). */
export type TagComboboxLabels = {
  /** Accessible name of the remove button on a tag, for example (label) => `Remove ${label}`. */
  remove: (label: string) => string
  /** Shown (and announced) when nothing matches what is typed. */
  empty: string
  /** Accessible name of the list. Defaults to the field's label. */
  list?: string
  /** Accessible name of the arrow button at the right end; leave it out to draw no button. */
  toggle?: string
  /** Announced after an option is picked. */
  added?: (label: string) => string
  /** Announced after a tag is removed. */
  removed?: (label: string) => string
  /** Announced when Backspace or an arrow key selects a tag, for example "Aisha selected, Backspace removes it". */
  picked?: (label: string) => string
}

export type TagComboboxProps = {
  /** Accessible name of the field. */
  label: string
  /** Rows, in the order shown. */
  options: readonly TagComboboxOption[]
  /** Ids of the selected options (controlled). Tags show in this order. */
  value?: readonly string[]
  /** Starting ids (uncontrolled). */
  defaultValue?: readonly string[]
  /** Called with the new list of ids after one option is picked or removed. */
  onValueChange?: (value: string[]) => void
  /** Hint shown while there are no tags and nothing is typed. */
  placeholder?: string
  /** Texts: remove and empty are required. */
  labels: TagComboboxLabels
  /** The list starts open (uncontrolled). */
  defaultOpen?: boolean
  /** Called when the list opens or closes. */
  onOpenChange?: (open: boolean) => void
  /** Grey out the field and its tags. */
  disabled?: boolean
  /** Id of the text box, for a visible label's htmlFor. */
  id?: string
  /** Extra class name on the field. */
  className?: string
  /** Extra class name on the popup list. */
  contentClassName?: string
  /** Ref to the text input, for focusing it from outside. */
  ref?: Ref<HTMLInputElement>
}

/** 文字按命中区间切开，命中的字加强（data-hit）。 */
function Highlighted({ text, ranges }: { text: string; ranges: readonly MatchRange[] }) {
  if (ranges.length === 0) return text
  return splitByRanges(text, ranges).map((part, at) =>
    part.hit ? (
      <span key={at} data-hit="" className="k-tagcb-hit">
        {part.text}
      </span>
    ) : (
      part.text
    ),
  )
}

/** A field that holds the picked options as removable tags and filters a list while you type. */
export function TagCombobox({
  label,
  options,
  value,
  defaultValue = [],
  onValueChange,
  placeholder,
  labels,
  defaultOpen = false,
  onOpenChange,
  disabled,
  id,
  className,
  contentClassName,
  ref,
}: TagComboboxProps) {
  const autoId = useId()
  const inputId = id ?? `${autoId}-input`
  const listId = `${autoId}-list`
  const optionDomId = (index: number) => `${autoId}-o${index}`
  const [internal, setInternal] = useState<readonly string[]>(defaultValue)
  const [draft, setDraft] = useState('')
  const [open, setOpenState] = useState(defaultOpen)
  const [activeState, setActiveState] = useState<string | null>(null)
  const [pickedId, setPickedId] = useState<string | null>(null)
  const [notice, setNotice] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const fieldRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  // 只有键盘移高亮才把行滚进视野；鼠标划过的行已经在眼前，再滚会抖。
  const scrollToActive = useRef(false)
  const openRef = useRef(defaultOpen)

  const ids = value ?? internal
  const byId = useMemo(() => new Map(options.map((option) => [option.id, option])), [options])
  // 标签按选的先后排；value 里有 options 没有的 id 就不画（调用方的数据还没到）。
  const tags = ids.flatMap((tagId) => {
    const option = byId.get(tagId)
    return option ? [option] : []
  })
  const rows = useMemo(() => filterOptions(options, draft), [options, draft])
  const rowIds = rows.map((row) => row.option.id)
  // 高亮项存 id：选一项后输入清空、列表变全，高亮仍留在这一行；它不在当前列表里就落第一行。
  const activeId = activeState !== null && rowIds.includes(activeState) ? activeState : (rowIds[0] ?? null)
  const activeRow = rows.find((row) => row.option.id === activeId)
  const picked = pickedId === null ? null : tags.findIndex((tag) => tag.id === pickedId)
  const pickedIndex = picked === null || picked < 0 ? null : picked

  const say = (message: string | undefined) => {
    if (message) setNotice((previous) => (previous === message ? `${message} ` : message))
  }
  // 去重比较 ref，不比较闭包里的 open：同一次事件里调两次 setOpen(false) 时闭包里的 open 都还是 true，onOpenChange 会收到两次。
  const setOpen = (next: boolean) => {
    if (next === openRef.current) return
    openRef.current = next
    setOpenState(next)
    onOpenChange?.(next)
  }
  const update = (next: string[]) => {
    if (value === undefined) setInternal(next)
    onValueChange?.(next)
  }

  const toggle = (optionId: string) => {
    const option = byId.get(optionId)
    if (!option) return
    const next = toggleId(ids, optionId)
    update(next)
    // 选或取消后输入清空、列表不收；高亮留在这一行，并滚进视野（过滤后的列表恢复成全量，这一行可能在可见区外）。
    scrollToActive.current = true
    setDraft('')
    setPickedId(null)
    setActiveState(optionId)
    say(next.includes(optionId) ? labels.added?.(option.label) : labels.removed?.(option.label))
  }
  const removeTag = (index: number) => {
    const tag = tags[index]
    if (!tag) return
    update(ids.filter((other) => other !== tag.id))
    setPickedId(null)
    say(labels.removed?.(tag.label))
    inputRef.current?.focus()
  }
  const pickTag = (index: number | null) => {
    const tag = index === null ? undefined : tags[index]
    setPickedId(tag?.id ?? null)
    if (tag) say(labels.picked?.(tag.label))
  }

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    // 输入法组字时的 Enter、方向键是选字，不是我们的。Safari 先发 compositionend 再发 keydown，那时 isComposing 已是 false，
    // 要再判 keyCode 229（仓库里别的件、cmdk 都这么判），不然拼音上屏的那下 Enter 会顺带切换一行、Backspace 会选中标签。
    if (event.nativeEvent.isComposing || event.keyCode === 229) return
    const action = tagComboboxKeyAction(event.key, {
      open,
      hasRows: rows.length > 0,
      draft,
      count: tags.length,
      picked: pickedIndex,
    })
    if (!action) return
    event.preventDefault()
    switch (action.type) {
      case 'open':
        setOpen(true)
        break
      case 'close':
        setOpen(false)
        break
      case 'move':
        scrollToActive.current = true
        setPickedId(null)
        setActiveState(stepActive(rowIds, activeId, action.delta))
        break
      case 'toggle':
        if (activeId !== null) toggle(activeId)
        break
      case 'pick':
        pickTag(action.index)
        break
      case 'unpick':
        setPickedId(null)
        break
      case 'swallow':
        break
      case 'remove':
        removeTag(action.index)
        break
    }
  }

  useEffect(() => {
    if (!open || !scrollToActive.current) return
    scrollToActive.current = false
    const list = listRef.current
    const row = list?.querySelector<HTMLElement>('[data-active]')
    if (!list || !row) return
    // 手动改 scrollTop，不用 scrollIntoView：后者会连页面一起滚，Popover 的「滚动即关」会把列表关掉。
    if (row.offsetTop < list.scrollTop) list.scrollTop = row.offsetTop
    else if (row.offsetTop + row.offsetHeight > list.scrollTop + list.clientHeight)
      list.scrollTop = row.offsetTop + row.offsetHeight - list.clientHeight
    // rows 在依赖里：过滤词清空、列表变全时高亮 id 没变，但这一行的位置变了，要重新滚。
  }, [open, activeId, rows])

  // 点字段里除输入框与按钮以外的地方：焦点给输入框并开列表（按下时就接管，免得焦点掉到 body 上）。
  const onFieldMouseDown = (event: MouseEvent<HTMLElement>) => {
    if (disabled) return
    const target = event.target as HTMLElement
    if (target === inputRef.current || target.closest('button')) return
    event.preventDefault()
    inputRef.current?.focus()
    setOpen(true)
  }

  return (
    <div
      data-slot="tag-combobox"
      data-open={open ? '' : undefined}
      data-disabled={disabled ? '' : undefined}
      className={cn('k-tagcb', className)}
    >
      <Popover open={open && !disabled} onOpenChange={setOpen}>
        <PopoverAnchor asChild>
          <div
            ref={fieldRef}
            className="k-tagcb-box"
            // 禁用时整框半透明，axe 的对比度检查要靠 aria-disabled 才知道里面的字不用读（输入框自己已 disabled）。
            aria-disabled={disabled ? true : undefined}
            onMouseDown={onFieldMouseDown}
          >
            {tags.map((tag, index) => (
              <span
                key={tag.id}
                className="k-tagcb-tag"
                data-tag={tag.id}
                data-picked={index === pickedIndex ? '' : undefined}
              >
                {tag.prefix ? (
                  <span aria-hidden="true" className="k-tagcb-tag-prefix">
                    {tag.prefix}
                  </span>
                ) : null}
                <span className="k-tagcb-tag-text">{tag.label}</span>
                {/* × 不进 Tab 序列：键盘走 Backspace 选中再删，十个标签不用按十次 Tab 才到输入框；按下不抢焦点。 */}
                <button
                  type="button"
                  tabIndex={-1}
                  disabled={disabled}
                  className="k-tagcb-remove"
                  aria-label={labels.remove(tag.label)}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => removeTag(index)}
                >
                  <X aria-hidden="true" />
                </button>
              </span>
            ))}
            <input
              ref={(node) => {
                inputRef.current = node
                if (typeof ref === 'function') ref(node)
                else if (ref) ref.current = node
              }}
              id={inputId}
              className="k-tagcb-input"
              type="text"
              role="combobox"
              aria-label={label}
              aria-autocomplete="list"
              aria-haspopup="listbox"
              aria-expanded={open && !disabled}
              aria-controls={open && rows.length > 0 ? listId : undefined}
              aria-activedescendant={
                open && pickedIndex === null && activeRow ? optionDomId(activeRow.index) : undefined
              }
              value={draft}
              disabled={disabled}
              placeholder={tags.length === 0 ? placeholder : undefined}
              autoComplete="off"
              spellCheck={false}
              onChange={(event) => {
                setDraft(event.currentTarget.value)
                setPickedId(null)
                // 打字就重新从第一个命中行起；列表关着时打字也开。
                setActiveState(null)
                setOpen(true)
                if (listRef.current) listRef.current.scrollTop = 0
              }}
              onClick={() => !disabled && setOpen(true)}
              onKeyDown={onKeyDown}
              onBlur={() => setPickedId(null)}
            />
            {labels.toggle ? (
              <button
                type="button"
                tabIndex={-1}
                disabled={disabled}
                className="k-tagcb-toggle"
                aria-label={labels.toggle}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  inputRef.current?.focus()
                  setOpen(!open)
                }}
              >
                <ChevronDown aria-hidden="true" />
              </button>
            ) : null}
          </div>
        </PopoverAnchor>
        <PopoverContent
          // Radix 默认给内容 role=dialog，但没有名字（axe aria-dialog-name）；这里它只是 listbox 的容器，不是对话框。
          // 不用 presentation：Radix 的 FocusScope 给内容加了 tabIndex=-1，能聚焦的元素不认 presentation（axe presentation-role-conflict）；group 不要求名字。
          role="group"
          align="start"
          sideOffset={4}
          collisionPadding={8}
          // 焦点一直在输入框：打开不抢、关上不还给别处；点到字段本身不算「点外面」。
          onOpenAutoFocus={(event) => event.preventDefault()}
          onCloseAutoFocus={(event) => event.preventDefault()}
          // Esc 只走输入框自己的逻辑（先收列表、再取消标签选中）：Radix 在 document 捕获阶段先接到 Esc，不拦的话 onOpenChange(false) 会被调两次。
          onEscapeKeyDown={(event) => event.preventDefault()}
          // 整块弹层按下都不抢焦点（行之间、列表内边距、没有匹配的提示都点得到 Content，它有 tabIndex=-1）；行的点击照常。
          onMouseDown={(event) => event.preventDefault()}
          onInteractOutside={(event) => {
            if (fieldRef.current?.contains(event.target as Node)) event.preventDefault()
          }}
          className={cn(
            'k-tagcb-pop w-[var(--anchor-width)] overflow-hidden rounded-[var(--radius-overlay)] border-(color:--k-overlay-compact-borderColor) p-0 shadow-(--k-overlay-compact-shadow)',
            contentClassName,
          )}
        >
          {rows.length > 0 ? (
            <div
              ref={listRef}
              id={listId}
              role="listbox"
              aria-multiselectable="true"
              aria-label={labels.list ?? label}
              className="k-tagcb-list"
            >
              {rows.map((row) => {
                const { option } = row
                const selected = ids.includes(option.id)
                return (
                  <div
                    key={option.id}
                    id={optionDomId(row.index)}
                    role="option"
                    aria-selected={selected}
                    data-active={option.id === activeId ? '' : undefined}
                    data-checked={selected ? '' : undefined}
                    className="k-tagcb-option"
                    // 点一下切换这一项（按下不抢焦点由整块弹层的 onMouseDown 管）。划过的行成为高亮（用 mousemove 不用 mouseenter：列表滚动时指针没动，不该跟着变）。
                    onMouseMove={() => {
                      scrollToActive.current = false
                      if (option.id !== activeId) setActiveState(option.id)
                    }}
                    onClick={() => toggle(option.id)}
                  >
                    {option.prefix ? (
                      <span aria-hidden="true" className="k-tagcb-prefix">
                        {option.prefix}
                      </span>
                    ) : null}
                    <span className="k-tagcb-text">
                      <span className="k-tagcb-label">
                        <Highlighted text={option.label} ranges={row.labelRanges} />
                      </span>
                      {option.description ? (
                        <span className="k-tagcb-desc">
                          <Highlighted text={option.description} ranges={row.descriptionRanges} />
                        </span>
                      ) : null}
                    </span>
                    <span aria-hidden="true" className="k-tagcb-check">
                      {selected ? <Check /> : null}
                    </span>
                  </div>
                )
              })}
            </div>
          ) : (
            <div role="status" className="k-tagcb-empty">
              {labels.empty}
            </div>
          )}
        </PopoverContent>
      </Popover>
      <span className="sr-only" aria-live="polite">
        {notice}
      </span>
    </div>
  )
}
