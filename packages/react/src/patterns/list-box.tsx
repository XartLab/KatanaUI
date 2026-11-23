// SPDX-License-Identifier: MIT
/**
 * A list of options that stays on the page: single or multiple selection, optional groups, descriptions and trailing values.
 * 常驻页面的选项列表（#104 对照 Salt：选项列表原来只在下拉、可搜索下拉与命令面板的弹层里，没有摆在页上的 ListBox）。
 * 用处：选账户、选布局、选数据源、给自选分组挑品种这类「挑了以后马上驱动下一步」的地方（Salt ListBox 的用法页，2026-11-23 读）；
 * TradingView 的布局列表、自选清单列表也是这种常驻的可选列表（主会话实看，出处页待核对）。
 * 结构照 Salt ListBox / Option / OptionGroup（@salt-ds/core，Apache-2.0；只取结构与用法，没有搬代码）；
 * 行为底座是 react-aria-components 的 ListBox（listbox 角色，↑ ↓ / Home / End 移动，打字跳到以它开头的项，Space / Enter 选，
 * 多选时 Shift + 方向键连选、Ctrl + A 全选；按 W3C ARIA APG 的 Listbox 模式），焦点与选中都不自己写。
 * 单选不许选空（点已选的那一项不取消，同 APG 单选 listbox）；多选点一项切换。文字全由调用方传，包里没有语言。皮肤在 ../theme/list-box.css。
 */
import { Check } from 'lucide-react'
import type { CSSProperties, ReactNode } from 'react'
import {
  Header,
  ListBox as AriaListBox,
  ListBoxItem,
  ListBoxSection,
  Text,
  type Selection,
} from 'react-aria-components'
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

const toIds = (keys: Selection): string[] => (keys === 'all' ? [] : [...keys].map(String))

function renderOption(option: ListBoxOption) {
  return (
    <ListBoxItem
      key={option.id}
      id={option.id}
      textValue={option.label}
      isDisabled={option.disabled}
      className="k-lb-item"
    >
      {option.icon ? <span className="k-lb-icon">{option.icon}</span> : null}
      <span className="k-lb-text">
        <Text slot="label" className="k-lb-label">
          {option.label}
        </Text>
        {option.description ? (
          <Text slot="description" className="k-lb-desc">
            {option.description}
          </Text>
        ) : null}
      </span>
      {option.trailing !== undefined ? <span className="k-lb-trailing">{option.trailing}</span> : null}
      <Check className="k-lb-check" size={14} aria-hidden />
    </ListBoxItem>
  )
}

/** A list of options on the page (role listbox), on react-aria's ListBox. */
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
  return (
    <AriaListBox
      aria-label={label}
      data-bordered={bordered || undefined}
      className={cn('k-lb', className)}
      style={style}
      selectionMode={selectionMode}
      selectionBehavior={onAction ? 'replace' : 'toggle'}
      disallowEmptySelection={selectionMode === 'single'}
      selectedKeys={value ? new Set(value) : undefined}
      defaultSelectedKeys={defaultValue ? new Set(defaultValue) : undefined}
      onSelectionChange={onValueChange ? (keys) => onValueChange(toIds(keys)) : undefined}
      onAction={onAction ? (key) => onAction(String(key)) : undefined}
      renderEmptyState={emptyLabel ? () => <div className="k-lb-empty">{emptyLabel}</div> : undefined}
    >
      {items.map((item) =>
        isGroup(item) ? (
          <ListBoxSection key={item.id} id={item.id} className="k-lb-group">
            <Header className="k-lb-header">{item.title}</Header>
            {item.options.map(renderOption)}
          </ListBoxSection>
        ) : (
          renderOption(item)
        ),
      )}
    </AriaListBox>
  )
}
