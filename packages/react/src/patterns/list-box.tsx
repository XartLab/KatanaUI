// SPDX-License-Identifier: MIT
/**
 * A list of options that stays on the page: single or multiple selection, optional groups, descriptions and trailing values.
 * 常驻页面的选项列表（#104 对照 Salt：选项列表原来只在下拉、可搜索下拉与命令面板的弹层里，没有摆在页上的 ListBox）。
 * 用处：选账户、选布局、选数据源、给自选分组挑品种这类「挑了以后马上驱动下一步」的地方（Salt ListBox 的用法页，2026-11-23 读）；
 * TradingView 的布局列表、自选清单列表也是这种常驻的可选列表（主会话实看，出处页待核对）。
 * 结构照 Salt ListBox / Option / OptionGroup（@salt-ds/core，Apache-2.0；只取结构与用法，没有搬代码）；
 * 行为底座是 UI SDK 的 Listbox（@ui-sdk/react/listbox，Apache-2.0，#263 从 react-aria 换来；listbox 角色，↑ ↓ / Home / End 移动，打字跳到以它开头的项，Space / Enter 选，
 * 多选时 Shift + 方向键连选、Ctrl + A 全选；按 W3C ARIA APG 的 Listbox 模式），焦点与选中都不自己写。
 * 单选不许选空（点已选的那一项不取消，同 APG 单选 listbox）；多选点一项切换。文字全由调用方传，包里没有语言。皮肤在 ../theme/list-box.css。
 */
import {
  Listbox as UiListbox,
  ListboxGroup,
  ListboxGroupLabel,
  ListboxItem,
  ListboxItemIndicator,
} from '@ui-sdk/react/listbox'
import { Check } from 'lucide-react'
import type { CSSProperties, ReactNode } from 'react'
import { cn } from '../lib/cn.ts'

/** One option of a ListBox. */
export type ListBoxOption = {
  id: string
  /** The option's text; also what type-ahead matches. */
  label: string
  /** A second line under the label, in the secondary color. */
  description?: string
  /** Icon before the label (decorative). */
  icon?: ReactNode
  /** A value at the right end, before the check (a count, a balance); tabular figures. */
  trailing?: ReactNode
  disabled?: boolean
}

/** A titled group of options. */
export type ListBoxGroup = {
  id: string
  /** Heading of the group (announced as the group's name). */
  title: string
  options: readonly ListBoxOption[]
}

export type ListBoxProps = {
  /** Options, or titled groups of options; the two can be mixed. */
  items: readonly (ListBoxOption | ListBoxGroup)[]
  /** Accessible name of the list. */
  label: string
  /** single (default): exactly one stays selected once picked; multiple: each click toggles. */
  selectionMode?: 'single' | 'multiple'
  /** Selected option ids (controlled). */
  value?: readonly string[]
  /** Selected option ids at first (uncontrolled). */
  defaultValue?: readonly string[]
  /** Called with the whole list of selected ids. */
  onValueChange?: (value: string[]) => void
  /** Called when an option is activated with Enter or a double click (open the layout, switch the account). With it a click selects only that option (Ctrl / Shift extend a multiple selection), the same as TreeView. */
  onAction?: (id: string) => void
  /** Draw an edge and a fill around the list (a standalone list); without it the list blends into its container. */
  bordered?: boolean
  /** Height after which the list scrolls inside itself (px or any CSS length). */
  maxHeight?: number | string
  /** Shown in place of the options when items is empty. */
  emptyLabel?: string
  /** Extra class names on the list. */
  className?: string
}

const isGroup = (item: ListBoxOption | ListBoxGroup): item is ListBoxGroup => 'options' in item

function renderOption(option: ListBoxOption, onAction?: (id: string) => void) {
  return (
    <ListboxItem
      key={option.id}
      value={option.id}
      label={option.label}
      disabled={option.disabled}
      className="k-lb-item"
      // Enter 或双击「激活」这一项（打开布局、切账户）；选中本身由 UI SDK 管。
      onDoubleClick={onAction ? () => !option.disabled && onAction(option.id) : undefined}
      onKeyDown={
        onAction
          ? (event) => {
              if (event.key === 'Enter' && !option.disabled) onAction(option.id)
            }
          : undefined
      }
    >
      {option.icon ? <span className="k-lb-icon">{option.icon}</span> : null}
      <span className="k-lb-text">
        <span className="k-lb-label">{option.label}</span>
        {option.description ? <span className="k-lb-desc">{option.description}</span> : null}
      </span>
      {option.trailing !== undefined ? <span className="k-lb-trailing">{option.trailing}</span> : null}
      <ListboxItemIndicator keepMounted className="k-lb-check">
        <Check size={14} aria-hidden />
      </ListboxItemIndicator>
    </ListboxItem>
  )
}

/** A list of options on the page (role listbox), on the UI SDK Listbox. */
export function ListBox({
  items,
  label,
  selectionMode = 'single',
  value,
  defaultValue,
  onValueChange,
  onAction,
  bordered = false,
  maxHeight,
  emptyLabel,
  className,
}: ListBoxProps) {
  const style: CSSProperties | undefined = maxHeight === undefined ? undefined : { maxHeight }
  const common = {
    'aria-label': label,
    'data-bordered': bordered || undefined,
    className: cn('k-lb', className),
    style,
    // 给了 onAction：点一项只选这一项（Ctrl / Shift 才扩选），方向键跟着选（selection follows focus）；不给：点一项切换，方向键只移焦点。
    activation: onAction ? ('automatic' as const) : ('manual' as const),
    children: items.map((item) =>
      isGroup(item) ? (
        <ListboxGroup key={item.id} className="k-lb-group">
          <ListboxGroupLabel className="k-lb-header">{item.title}</ListboxGroupLabel>
          {item.options.map((option) => renderOption(option, onAction))}
        </ListboxGroup>
      ) : (
        renderOption(item, onAction)
      ),
    ),
  }
  // 没有项：空态不放进 listbox（里面只许有 option 与 group，UI SDK 的规矩，axe 的 aria-required-children 也查这条），外框照旧，角色退成 group。
  if (items.length === 0)
    return (
      <div
        role="group"
        aria-label={label}
        data-bordered={bordered || undefined}
        className={cn('k-lb', className)}
        style={style}
      >
        {emptyLabel ? <div className="k-lb-empty">{emptyLabel}</div> : null}
      </div>
    )
  // 值的形状随单选 / 多选变：单选是一个 id 或 null，多选是 id 数组；对外一律是 id 数组。
  if (selectionMode === 'multiple')
    return (
      <UiListbox
        {...common}
        multiple
        value={value ? [...value] : undefined}
        defaultValue={defaultValue ? [...defaultValue] : undefined}
        onValueChange={onValueChange ? (next) => onValueChange(next) : undefined}
      />
    )
  return (
    <UiListbox
      {...common}
      value={value ? (value[0] ?? null) : undefined}
      defaultValue={defaultValue ? (defaultValue[0] ?? null) : undefined}
      onValueChange={onValueChange ? (next) => onValueChange(next === null ? [] : [next]) : undefined}
    />
  )
}
