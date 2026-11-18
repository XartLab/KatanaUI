// SPDX-License-Identifier: MIT
/**
 * Colored row flags (TradingView watchlist flags): the FlagMark glyph, the useFlags store and the FlagFilter chips.
 * 行的彩色旗标（#77 G7）：FlagMark 旗子、useFlags（受控：哪一行插了哪面旗、按旗过滤）、FlagFilter（按旗过滤的一排按钮）。
 * 出处：TradingView 自选表（主会话 2026-11-18 在 TradingView 里实看）——行最左端一面小燕尾旗；右键菜单头一项「Flag/Unflag <品种>」（Alt+Enter）
 * 下面一排色点直接选色、「Unflag all symbols」；列表上方一排旗标按钮按旗过滤。只学交互，实现原创。
 * 颜色只用状态色（Severity：danger / warn / ok / neutral，走 --k-status-*），不新造色、不用品牌橙；几面旗、各叫什么由调用方给。
 */
import { useState, type ReactNode } from 'react'
import { cn } from '../lib/cn.ts'
import { statusColor, type Severity } from '../lib/severity.ts'

/** 一面旗：id、读屏与菜单里的名字（调用方按界面语言给）、颜色（状态色）。 */
export type FlagDef = { id: string; label: string; color: Severity }

/** 哪一行插了哪面旗：行 id → 旗 id；没插的行不在里面。 */
export type FlagMap = Readonly<Record<string, string>>

/** 旗子的图形：10×12 的燕尾旗（左边一道旗杆）。 */
export type FlagGlyphProps = {
  /** Status color of the flag; omit to inherit the text color. */
  color?: Severity
  /** Draw the outline only (no flag on the row). */
  hollow?: boolean
}

export function FlagGlyph({ color, hollow }: FlagGlyphProps) {
  return (
    <svg
      className="k-flag-glyph"
      width="10"
      height="12"
      viewBox="0 0 10 12"
      aria-hidden="true"
      style={color ? { color: statusColor(color) } : undefined}
    >
      <path
        d="M1.5 1h7.5l-2.6 3.5L9 8H1.5z"
        fill={hollow ? 'none' : 'currentColor'}
        stroke="currentColor"
        strokeWidth={hollow ? 1 : 0}
        strokeLinejoin="round"
      />
      <path d="M1.5 1v10" stroke="currentColor" strokeWidth="1" />
    </svg>
  )
}

export type FlagMarkProps = {
  /**
   * The flag on this row; omit for none (a hollow gray flag shows only on row hover or focus).
   * 插着的旗；省略是没插（只在行悬停或自己获得焦点时出一面空心灰旗）。
   */
  flag?: FlagDef
  /**
   * Click handler, usually toggle(id) from useFlags; without it the mark is read-only.
   * 点它：一般是 useFlags 的 toggle(id)。没给就是只读的标记（span）。
   */
  onToggle?: () => void
  /**
   * Accessible name written by the caller (e.g. "Flag BTCUSDT").
   * 读屏名（「给 BTCUSDT 插旗」这类，调用方写）；插着旗时后面会念 aria-pressed。
   */
  label: string
  /**
   * Set false inside single-tab-stop containers such as DataGrid; keyboard users flag through the row menu. Default true.
   * 在 DataGrid 这类单 Tab 停靠点的容器里设 false：按钮不进 Tab 顺序，键盘走行菜单。
   */
  focusable?: boolean
  /**
   * Keep the hollow flag visible when unflagged (outside a hover row); by default it shows only on row hover or focus.
   * 没插时也一直显示空心旗（不在行里用时）；默认只在行悬停或焦点时出。
   */
  alwaysShown?: boolean
  /** Extra class name. */
  className?: string
}

/** 行里的旗：插着是实心状态色旗，没插是空心灰旗（平时藏着）。 */
export function FlagMark({ flag, onToggle, label, focusable = true, alwaysShown, className }: FlagMarkProps) {
  const glyph = <FlagGlyph color={flag?.color} hollow={!flag} />
  const classes = cn('k-flag-mark', flag ? 'is-flagged' : 'is-empty', alwaysShown && 'is-shown', className)
  if (!onToggle)
    return flag ? (
      <span className={classes} role="img" aria-label={`${label}: ${flag.label}`} data-flag={flag.id}>
        {glyph}
      </span>
    ) : null
  return (
    <button
      type="button"
      className={classes}
      aria-label={label}
      aria-pressed={flag !== undefined}
      title={flag ? `${label}: ${flag.label}` : label}
      tabIndex={focusable ? undefined : -1}
      data-flag={flag?.id}
      data-no-drag=""
      onClick={(event) => {
        event.stopPropagation()
        onToggle()
      }}
    >
      {glyph}
    </button>
  )
}

export type UseFlagsOptions = {
  /** 有哪几面旗（次序就是菜单与过滤按钮的次序）。 */
  flags: readonly FlagDef[]
  /** 受控：哪一行插了哪面旗。 */
  value?: FlagMap
  defaultValue?: FlagMap
  onValueChange?: (next: FlagMap) => void
  /** 受控：按哪面旗过滤（null 是不过滤）。 */
  filter?: string | null
  defaultFilter?: string | null
  onFilterChange?: (next: string | null) => void
}

/** 旗标菜单的一项（形状同 RowAction，能直接接 DataGrid 的 rowActions / menu）。 */
export type FlagMenuItem = { key: string; label: string; icon?: ReactNode; onSelect: () => void }

export type Flags = {
  flags: readonly FlagDef[]
  value: FlagMap
  /** 这一行插的旗。 */
  flagOf: (id: string) => FlagDef | undefined
  /** 插旗（null 是拔掉）。 */
  setFlag: (id: string, flag: string | null) => void
  /** 点旗：插着就拔掉，没插就插上最近用过的那面（头一次是第一面）；照 TradingView 的 Flag/Unflag。 */
  toggle: (id: string) => void
  /** 拔掉所有旗（TradingView 的 Unflag all symbols）。 */
  clearAll: () => void
  /** 每面旗插了几行。 */
  counts: Readonly<Record<string, number>>
  filter: string | null
  setFilter: (flag: string | null) => void
  /** 按当前过滤留下的行（不过滤时原样返回）。 */
  filterRows: <Row>(rows: readonly Row[], rowId: (row: Row) => string) => readonly Row[]
  /** 一行的旗标菜单：每面旗一项（插着的那面再点是拔掉），最后「拔掉」；unflagLabel 不给就没有最后一项。 */
  menu: (id: string, unflagLabel?: string) => FlagMenuItem[]
}

/** 插一面旗、拔掉，返回新的对照表（纯函数）。 */
export function setFlagIn(map: FlagMap, id: string, flag: string | null): FlagMap {
  const next = { ...map }
  if (flag === null) delete next[id]
  else next[id] = flag
  return next
}

/** 每面旗插了几行（纯函数）。 */
export function countFlags(map: FlagMap, flags: readonly FlagDef[]): Record<string, number> {
  const counts = Object.fromEntries(flags.map((flag) => [flag.id, 0]))
  for (const flag of Object.values(map)) if (flag in counts) counts[flag] += 1
  return counts
}

export function useFlags({
  flags,
  value,
  defaultValue = {},
  onValueChange,
  filter,
  defaultFilter = null,
  onFilterChange,
}: UseFlagsOptions): Flags {
  const [own, setOwn] = useState<FlagMap>(defaultValue)
  const [ownFilter, setOwnFilter] = useState<string | null>(defaultFilter)
  const [last, setLast] = useState<string | undefined>(undefined)
  const map = value ?? own
  const active = filter === undefined ? ownFilter : filter
  const byId = new Map(flags.map((flag) => [flag.id, flag]))
  const commit = (next: FlagMap) => {
    if (value === undefined) setOwn(next)
    onValueChange?.(next)
  }
  const setFlag = (id: string, flag: string | null) => {
    if (flag !== null) setLast(flag)
    commit(setFlagIn(map, id, flag))
  }
  const setFilter = (next: string | null) => {
    if (filter === undefined) setOwnFilter(next)
    onFilterChange?.(next)
  }
  return {
    flags,
    value: map,
    flagOf: (id) => byId.get(map[id] ?? ''),
    setFlag,
    toggle: (id) => setFlag(id, map[id] ? null : last && byId.has(last) ? last : (flags[0]?.id ?? null)),
    clearAll: () => commit({}),
    counts: countFlags(map, flags),
    filter: active,
    setFilter,
    filterRows: (rows, rowId) => (active === null ? rows : rows.filter((row) => map[rowId(row)] === active)),
    menu: (id, unflagLabel) => [
      ...flags.map((flag) => ({
        key: `flag-${flag.id}`,
        label: flag.label,
        icon: <FlagGlyph color={flag.color} hollow={map[id] !== flag.id} />,
        onSelect: () => setFlag(id, map[id] === flag.id ? null : flag.id),
      })),
      ...(unflagLabel && map[id] ? [{ key: 'flag-none', label: unflagLabel, onSelect: () => setFlag(id, null) }] : []),
    ],
  }
}

export type FlagFilterProps = {
  /** The store returned by useFlags. */
  flags: Flags
  /**
   * Accessible name of the group (e.g. "Filter by flag").
   * 整组的读屏名（「按旗过滤」）。
   */
  label: string
  /**
   * Name of one flag button; defaults to the flag label and its count.
   * 一面旗的按钮名（默认是旗名加个数）。
   */
  itemLabel?: (flag: FlagDef, count: number) => string
  /**
   * Also show flags that no row carries; by default only used flags and the active filter show.
   * 没插过的旗也出按钮。
   */
  showEmpty?: boolean
  /** Extra class name. */
  className?: string
}

/** 按旗过滤：一排旗标按钮，按下的那面是当前过滤，再点取消（照 TradingView 自选表上方的旗标按钮）。 */
export function FlagFilter({ flags, label, itemLabel, showEmpty, className }: FlagFilterProps) {
  const shown = flags.flags.filter((flag) => showEmpty || flags.counts[flag.id] > 0 || flags.filter === flag.id)
  if (shown.length === 0) return null
  return (
    <div role="group" aria-label={label} className={cn('k-flag-filter', className)}>
      {shown.map((flag) => {
        const count = flags.counts[flag.id] ?? 0
        const pressed = flags.filter === flag.id
        return (
          <button
            key={flag.id}
            type="button"
            className="k-flag-filter-item"
            aria-pressed={pressed}
            aria-label={itemLabel ? itemLabel(flag, count) : `${flag.label} (${count})`}
            title={itemLabel ? itemLabel(flag, count) : `${flag.label} (${count})`}
            onClick={() => flags.setFilter(pressed ? null : flag.id)}
          >
            <FlagGlyph color={flag.color} />
            <span className="k-flag-filter-count" aria-hidden="true">
              {count}
            </span>
          </button>
        )
      })}
    </div>
  )
}
