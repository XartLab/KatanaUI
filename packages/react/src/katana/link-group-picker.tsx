// SPDX-License-Identifier: MIT
/**
 * Link group picker for a panel title bar (TradingView symbol linking): a small dot button that opens the group menu.
 * 联动组选择件（#150 G8）：放在件的标题栏里的一个小按钮，点开列出 A–D 四组与「不联动」，选中的那项打勾。
 * 出处：TradingView 的符号联动（帮助中心 Symbol syncing between tabs，2026-11-23 读：给几个标签页设同一个颜色标签就联动）。只学交互，实现原创。
 * 按钮里是联动灯（Led 的组色，token link-a…d；不联动是一圈 3:1 的空环，同 PanelFrameHeader 的色点），不用 TradingView 蓝。
 * 件不存组：value 与 onValueChange 由调用方接（一般是 useLinkGroup 的 group / setGroup）；文字都由调用方经 labels 传。
 */
import { cn } from '../lib/cn.ts'
import { LINK_GROUPS, type LinkGroup } from '../lib/link-group.tsx'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../primitives/dropdown-menu.tsx'
import { MenuItemLabel } from '../primitives/menu-parts.tsx'
import { Led } from './led.tsx'

/** Texts of LinkGroupPicker (the package ships no text). */
export type LinkGroupPickerLabels = {
  /**
   * Accessible name of the button and the menu (e.g. "Link group"); the current group's name follows it.
   * 按钮与菜单的读屏名（「联动组」）；按钮名后面接当前那组的名字。
   */
  trigger: string
  /**
   * Name of the unlinked option (e.g. "Unlinked").
   * 「不联动」那一项的字。
   */
  none: string
  /**
   * Names of the groups; a group without a name shows its letter.
   * 每组的名字；没给的组写字母 A–D。
   */
  groups?: Partial<Record<LinkGroup, string>>
}

export type LinkGroupPickerProps = {
  /** Group of the panel; null is unlinked. */
  value: LinkGroup | null
  /** Called with the chosen group, or null when the user unlinks the panel. */
  onValueChange: (group: LinkGroup | null) => void
  /** Texts written by the caller. */
  labels: LinkGroupPickerLabels
  /** Extra class name of the button. */
  className?: string
}

// 「不联动」在菜单的单选组里要一个字符串值；组名只有 A–D，用不会撞上的 none。
const NONE = 'none'

/** Dot button plus menu that puts a panel into link group A–D or unlinks it. */
export function LinkGroupPicker({ value, onValueChange, labels, className }: LinkGroupPickerProps) {
  const nameOf = (group: LinkGroup | null) => (group === null ? labels.none : (labels.groups?.[group] ?? group))
  const name = `${labels.trigger}: ${nameOf(value)}`
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn('k-link-picker', className)}
          data-slot="link-group-picker"
          data-group={value ?? NONE}
          aria-label={name}
          title={name}
        >
          {/* 灯只是样子：名字在按钮上，灯的 role=img 藏起来，免得读两遍。 */}
          <span aria-hidden="true" className="k-link-picker-dot">
            <Led group={value} bare={value === null} label={nameOf(value)} />
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" aria-label={labels.trigger} className="min-w-[140px]">
        <DropdownMenuRadioGroup
          value={value ?? NONE}
          onValueChange={(next) => onValueChange(next === NONE ? null : (next as LinkGroup))}
        >
          {LINK_GROUPS.map((group) => (
            <DropdownMenuRadioItem key={group} value={group} data-group={group}>
              <MenuItemLabel>
                <span aria-hidden="true" className="k-link-picker-dot">
                  <Led group={group} label={nameOf(group)} />
                </span>
                {nameOf(group)}
              </MenuItemLabel>
            </DropdownMenuRadioItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuRadioItem value={NONE} data-group={NONE}>
            <MenuItemLabel>
              <span aria-hidden="true" className="k-link-picker-dot">
                <Led group={null} bare label={labels.none} />
              </span>
              {labels.none}
            </MenuItemLabel>
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
