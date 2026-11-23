// SPDX-License-Identifier: MIT
/**
 * Link group picker for a panel title bar (TradingView symbol linking): a small dot button that opens the group menu.
 * 联动组选择件（#150）：放在件的标题栏里的一个小按钮，点开列出 A–D 四组与「不联动」，选中的那项打勾，每组行尾写这组现在的品种。
 * 出处：TradingView 的符号联动（帮助中心 Symbol syncing between tabs，2026-11-23 读：给几个标签页设同一个颜色标签就联动）。只学交互，实现原创。
 * 按钮里是联动灯（Led 的组色，token link-a…d；不联动是一圈 3:1 的空环，同 PanelFrameHeader 的色点），不用 TradingView 蓝。
 * 联动的状态在 lib/link-group 的联动表里（#22 的 useLinkHub，没有 Provider 时是默认那张）：菜单读表里每组的品种；进组时把件现在的品种、周期、
 * 可见区间交给表里还没设过的字段（joinLinkGroup），件进空组不跳回 initial。件不存组：value 与 onValueChange 由调用方接（同 useLinkGroup 的 group 参数）。
 */
import { useCallback, useSyncExternalStore } from 'react'
import { cn } from '../lib/cn.ts'
import { useLinkHub, type LinkField, type LinkGroupState, type LinkHub } from '../lib/link-group.tsx'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../primitives/dropdown-menu.tsx'
import { MenuItemHint, MenuItemLabel } from '../primitives/menu-parts.tsx'
import { LINK_GROUPS, Led, type LinkGroup } from './led.tsx'

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
  /**
   * What the panel shows now (the state from useLinkGroup). A group joined from the menu takes the fields it has not set yet from here.
   * 件现在显示的联动状态（useLinkGroup 返回的状态）；从菜单进组时，组里还没设过的字段取它（见 joinLinkGroup）。不给就不交。
   */
  carry?: LinkGroupState
  /** Texts written by the caller. */
  labels: LinkGroupPickerLabels
  /** Extra class name of the button. */
  className?: string
}

// 进组时交给组的字段：十字线时刻只活在指针移动的这一会儿（#22），不交。
const CARRIED: readonly LinkField[] = ['symbol', 'interval', 'range']

/**
 * Hands a panel's state to a group it joins: fields the group has not set yet (symbol, interval, range) take the panel's values; set fields stay.
 * 进组：组里还没设过的品种、周期、可见区间取件现在的值（经 hub.set），设过的不动。所以进空组时件还显示原来的品种，进有值的组时件改看组的。
 */
export function joinLinkGroup(hub: LinkHub, group: LinkGroup, carry: LinkGroupState): void {
  const current = hub.get(group)
  const patch = Object.fromEntries(
    CARRIED.filter((field) => current[field] === undefined && carry[field] !== undefined).map((field) => [
      field,
      carry[field],
    ]),
  )
  hub.set(group, patch)
}

// 「不联动」在菜单的单选组里要一个字符串值；组名只有 A–D，用不会撞上的 none。
const NONE = 'none'

/** 菜单里的一组：行尾写这组现在的品种（订阅联动表；菜单开着才挂上）。 */
function GroupItem({ hub, group, name }: { hub: LinkHub; group: LinkGroup; name: string }) {
  const watch = useCallback(
    (notify: () => void) =>
      hub.subscribe(group, (changed) => {
        if (changed.includes('symbol')) notify()
      }),
    [hub, group],
  )
  const read = () => hub.get(group).symbol
  const symbol = useSyncExternalStore(watch, read, read)
  return (
    <DropdownMenuRadioItem value={group} data-group={group}>
      <MenuItemLabel>
        <span aria-hidden="true" className="k-link-picker-dot">
          <Led group={group} label={name} />
        </span>
        {name}
      </MenuItemLabel>
      {symbol === undefined ? null : <MenuItemHint data-slot="link-group-symbol">{symbol}</MenuItemHint>}
    </DropdownMenuRadioItem>
  )
}

/** Dot button plus menu that puts a panel into link group A–D or unlinks it. */
export function LinkGroupPicker({ value, onValueChange, carry, labels, className }: LinkGroupPickerProps) {
  const hub = useLinkHub()
  const nameOf = (group: LinkGroup | null) => (group === null ? labels.none : (labels.groups?.[group] ?? group))
  const name = `${labels.trigger}: ${nameOf(value)}`
  const pick = (picked: string) => {
    const next = picked === NONE ? null : (picked as LinkGroup)
    if (next === value) return
    if (next !== null && carry) joinLinkGroup(hub, next, carry)
    onValueChange(next)
  }
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
        <DropdownMenuRadioGroup value={value ?? NONE} onValueChange={pick}>
          {LINK_GROUPS.map((group) => (
            <GroupItem key={group} hub={hub} group={group} name={nameOf(group)} />
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
