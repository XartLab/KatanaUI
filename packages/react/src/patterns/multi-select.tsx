// SPDX-License-Identifier: MIT
import { useRef, type CSSProperties, type KeyboardEvent } from 'react'
import { cn } from '../lib/cn.ts'
import { Popover, PopoverContent, PopoverTrigger } from '../primitives/popover.tsx'
import { SelectArrow, selectItemClass, selectTriggerVariants } from '../primitives/select.tsx'

// 多选下拉：弹层（Popover）组出来的。触发器跟单选下拉一个样（selectTriggerVariants），写已选项的名字（按选项的顺序，separator 隔开），一个都没选写 empty；
// 列表项前面留一列勾（没选的也占位，文字才对得齐），点一项只切这一项、列表不收。
// 读屏与测试按 ARIA 的多选下拉认它：触发器 combobox（aria-expanded），弹层 listbox（aria-multiselectable），每项 option（aria-selected）。
// Radix 没有多选的 Select，所以列表项的键盘自己管：触发器 Enter / Space / ↓ 开；开时焦点落在第一个已选项（没有就第一项）；
// ↑ ↓ 在项之间走（首尾相接），Home / End 跳首尾，打字跳到以它开头的项，Space / Enter 切换，Esc 收（Radix 的 Popover 管焦点圈住与归还）。
// 文案（separator、empty、label）都由调用方传，包里不写中文。
export function MultiSelect({
  values,
  options,
  onValuesChange,
  empty,
  label,
  separator,
  width,
  triggerClassName,
  contentClassName,
}: {
  /** Ids of the selected options. */
  values: readonly string[]
  /**
   * Options as [id, label] pairs, shown and reported in this order.
   * [id, 显示的字]，按这个顺序显示与上报。
   */
  options: readonly (readonly [string, string])[]
  /** Called with the full list of selected ids after one option toggles. */
  onValuesChange: (values: string[]) => void
  /**
   * Text on the trigger when nothing is selected.
   * 一个都没选时触发器上写的字。
   */
  empty: string
  /** Accessible name of the trigger. */
  label?: string
  /**
   * Text placed between the selected option names.
   * 已选项名字之间的分隔（例：中文的「、」）。
   */
  separator: string
  /** Trigger width in px. */
  width?: number
  /**
   * Extra class name on the trigger, for app styles and tests to find it.
   * 应用里的样式、测试按这两个类找触发器与弹层。
   */
  triggerClassName?: string
  /** Extra class name on the popup, for app styles and tests to find it. */
  contentClassName?: string
}) {
  const list = useRef<HTMLDivElement>(null)
  const chosen = options.filter(([key]) => values.includes(key)).map(([, text]) => text)
  const style: CSSProperties | undefined = width ? { width } : undefined
  const rows = () => [...(list.current?.querySelectorAll<HTMLElement>('[role="option"]') ?? [])]
  const toggle = (key: string) =>
    onValuesChange(
      options
        .map(([other]) => other)
        .filter((other) => (other === key ? !values.includes(key) : values.includes(other))),
    )
  // 打字跳项（typeahead）：连着打的字拼成前缀，焦点跳到第一个以它开头的项；停 500ms 重来。
  const typed = useRef({ text: '', at: 0 })
  const jump = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key.length !== 1 || event.key === ' ' || event.ctrlKey || event.metaKey || event.altKey) return false
    const now = Date.now()
    typed.current = {
      text: (now - typed.current.at > 500 ? '' : typed.current.text) + event.key.toLowerCase(),
      at: now,
    }
    const hit = rows().find((row) =>
      row.lastElementChild?.textContent?.trim().toLowerCase().startsWith(typed.current.text),
    )
    hit?.focus()
    return true
  }
  const move = (event: KeyboardEvent<HTMLElement>) => {
    if (jump(event)) return
    const all = rows()
    const at = all.indexOf(document.activeElement as HTMLElement)
    const target =
      event.key === 'ArrowDown'
        ? all[(at + 1) % all.length]
        : event.key === 'ArrowUp'
          ? all[(at - 1 + all.length) % all.length]
          : event.key === 'Home'
            ? all[0]
            : event.key === 'End'
              ? all[all.length - 1]
              : undefined
    if (!target) return
    target.focus()
    event.preventDefault()
  }
  return (
    <Popover>
      <PopoverTrigger
        data-slot="multi-select-trigger"
        role="combobox"
        aria-label={label}
        aria-haspopup="listbox"
        className={cn(selectTriggerVariants(), triggerClassName)}
        style={style}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown') {
            event.preventDefault()
            event.currentTarget.click()
          }
        }}
      >
        <span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">
          {chosen.length > 0 ? chosen.join(separator) : empty}
        </span>
        <SelectArrow />
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={2}
        onOpenAutoFocus={(event) => {
          event.preventDefault()
          const all = rows()
          ;(all.find((row) => row.getAttribute('aria-selected') === 'true') ?? all[0])?.focus()
        }}
        className={cn(
          'w-auto min-w-[var(--radix-popover-trigger-width)] max-h-[min(var(--radix-popover-content-available-height),calc(100dvh-16px))] overflow-auto rounded-[7px] border-alpha-white-8 p-1 shadow-[var(--shadow-overlay-sm)]',
          contentClassName,
        )}
      >
        <div ref={list} role="listbox" aria-multiselectable="true" aria-label={label} onKeyDown={move}>
          {options.map(([key, text]) => {
            const selected = values.includes(key)
            return (
              <div
                key={key}
                role="option"
                aria-selected={selected}
                tabIndex={-1}
                data-slot="multi-select-option"
                data-state={selected ? 'checked' : 'unchecked'}
                className={cn(
                  selectItemClass,
                  'hover:data-[state=unchecked]:bg-alpha-white-4 focus-visible:bg-alpha-white-4',
                )}
                onClick={() => toggle(key)}
                onKeyDown={(event) => {
                  if (event.key === ' ' || event.key === 'Enter') {
                    event.preventDefault()
                    toggle(key)
                  }
                }}
              >
                <span aria-hidden="true" className="w-[10px] flex-none text-ink">
                  {selected ? '✓' : ''}
                </span>
                <span>{text}</span>
              </div>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}
