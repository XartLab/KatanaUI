// SPDX-License-Identifier: MIT
import { ChartCandlestickIcon, BellPlusIcon, CopyIcon, StarIcon } from 'lucide-react'
import { useState, type KeyboardEvent, type MouseEvent, type ReactNode } from 'react'
import { cn } from '../lib/cn.ts'
import { ContextMenu, ContextMenuContent, ContextMenuTrigger } from '../primitives/context-menu.tsx'
import { useMenuParts } from '../primitives/menu-any.tsx'
import { MenuItemHint, MenuItemLabel } from '../primitives/menu-parts.tsx'

// 行快捷操作（TradingView 便利交互 #22 第 1 条，#23）：所有带品种的行（DataGrid、连板天梯、报价表）悬停或键盘落到这一行时，
// 行右端浮出几颗无边框图标按钮；右键（或菜单键 / Shift+F10）出同一份菜单，热力图的格子也一样。件不认识「图表」「自选」，
// 只认 { key, label, icon?, shortcut?, onSelect }：文案与动作都由调用方传，包里不带语言。
// 功能参照 TradingView 品种搜索结果行悬停出「开图 / 看概览」（帮助中心「Symbol search tips」，2026-11-15 读）；
// 自选行悬停显示哪些按钮、右键菜单有哪些项，页面没写，待核对，这里不编。样子照连板天梯那套：按钮无边框、悬停灰底、不加橙色。

export type RowAction = {
  key: string
  label: string
  /** 悬停按钮用它；没有图标的项只出现在菜单里。 */
  icon?: ReactNode
  /** 快捷键的字（已经写好的，例：Alt+W）：菜单里画在行尾，按钮的悬停提示里跟在名字后面。 */
  shortcut?: string
  disabled?: boolean
  onSelect: () => void
}

/** 悬停按钮默认出几颗（取菜单里前几个带图标的项）；照连板天梯的行宽，三颗以内不盖住数字列。 */
export const ROW_ACTIONS_MAX = 3

type SymbolSlot = Omit<RowAction, 'key'>

export type SymbolMenuInput = {
  /** 打开图表。 */
  openChart?: SymbolSlot
  /** 加入自选。 */
  addToWatchlist?: SymbolSlot
  /** 新建告警。 */
  newAlert?: SymbolSlot
  /** 复制代码。 */
  copyCode?: SymbolSlot
  /** 调用方自己的项，排在标准四项后面。 */
  extra?: readonly RowAction[]
}

const SYMBOL_ICONS = {
  'open-chart': <ChartCandlestickIcon size={14} aria-hidden="true" />,
  'add-to-watchlist': <StarIcon size={14} aria-hidden="true" />,
  'new-alert': <BellPlusIcon size={14} aria-hidden="true" />,
  'copy-code': <CopyIcon size={14} aria-hidden="true" />,
} as const

/**
 * 标准品种菜单段：开图、加自选、新建告警、复制代码，固定这个次序，没传的跳过；调用方的项接在后面。
 * 没传 icon 的标准项用包里的默认图标；返回值直接给 RowActions、DataGrid 的 rowActions、LimitLadder 与 MarketHeatmap。
 */
export function symbolMenu(input: SymbolMenuInput): RowAction[] {
  const slots = [
    ['open-chart', input.openChart],
    ['add-to-watchlist', input.addToWatchlist],
    ['new-alert', input.newAlert],
    ['copy-code', input.copyCode],
  ] as const
  const standard = slots.flatMap(([key, slot]): RowAction[] =>
    slot ? [{ ...slot, key, icon: slot.icon ?? SYMBOL_ICONS[key] }] : [],
  )
  return [...standard, ...(input.extra ?? [])]
}

/** 悬停按钮要画的那几项：带图标的前 max 个。 */
export function stripActions(items: readonly RowAction[], max = ROW_ACTIONS_MAX): RowAction[] {
  return items.filter((item) => item.icon != null).slice(0, max)
}

export type RowActionsProps = {
  items: readonly RowAction[]
  /** 屏幕阅读器念的组名。 */
  label: string
  max?: number
  /** 按钮能不能用 Tab 走到；行自己管键盘的表与列表（行内用上下键）传 false，菜单键开完整的菜单。默认 true。 */
  focusable?: boolean
  /** 宿主行是表里的一格时给 gridcell 这类角色；默认 group。 */
  role?: string
  /**
   * 只给指针用：按钮画成不可聚焦、对读屏隐藏的 span，不是 button。宿主行本身是 option 这类「里面不许有可聚焦子项」的角色时用
   * （连板天梯：axe 的 nested-interactive）；键盘与读屏用户走菜单键开的整份菜单。
   */
  pointerOnly?: boolean
  className?: string
}

/**
 * 行右端浮出的图标按钮条：绝对定位浮在宿主行上、不占列宽；宿主行要 position: relative。
 * 什么时候出现由宿主行的悬停、焦点样式定（theme/row-actions.css 列了 DataGrid 与连板天梯的）；单独用时靠 :focus-within 与父级悬停。
 */
export function RowActions({
  items,
  label,
  max,
  focusable = true,
  role = 'group',
  pointerOnly,
  className,
}: RowActionsProps) {
  const shown = stripActions(items, max)
  if (shown.length === 0) return null
  if (pointerOnly)
    return (
      <span aria-hidden="true" className={cn('k-row-actions', className)} data-slot="row-actions">
        {shown.map((item) => (
          <span
            key={item.key}
            className="k-row-action"
            data-action={item.key}
            title={item.shortcut ? `${item.label} (${item.shortcut})` : item.label}
            aria-disabled={item.disabled || undefined}
            onClick={(event) => {
              event.stopPropagation()
              if (!item.disabled) item.onSelect()
            }}
            onDoubleClick={(event) => event.stopPropagation()}
          >
            {item.icon}
          </span>
        ))}
      </span>
    )
  return (
    <span role={role} aria-label={label} className={cn('k-row-actions', className)} data-slot="row-actions">
      {shown.map((item) => (
        <button
          key={item.key}
          type="button"
          className="k-row-action"
          data-action={item.key}
          aria-label={item.label}
          title={item.shortcut ? `${item.label} (${item.shortcut})` : item.label}
          disabled={item.disabled}
          tabIndex={focusable ? undefined : -1}
          onClick={(event) => {
            event.stopPropagation()
            item.onSelect()
          }}
          onDoubleClick={(event) => event.stopPropagation()}
        >
          {item.icon}
        </button>
      ))}
    </span>
  )
}

/** 当前菜单（右键或下拉）里的整份项：一项一行，图标在名字前，快捷键在行尾。 */
export function RowActionMenuItems({ items }: { items: readonly RowAction[] }) {
  const Menu = useMenuParts()
  return (
    <>
      {items.map((item) => (
        <Menu.Item key={item.key} data-action={item.key} disabled={item.disabled} onSelect={item.onSelect}>
          <MenuItemLabel>
            {item.icon}
            {item.label}
          </MenuItemLabel>
          {item.shortcut && <MenuItemHint>{item.shortcut}</MenuItemHint>}
        </Menu.Item>
      ))}
    </>
  )
}

export type RowContextMenuProps = {
  /** 按行的键（data-code 的值）给这一行的项；空数组不出菜单；不传就什么都不包（调用方没打开这个功能时原样画孩子）。 */
  actionsFor?: (key: string) => readonly RowAction[]
  /** 屏幕阅读器念的菜单名。 */
  label: string
  /** 行（或格子）元素上带键的属性名，默认 data-code。 */
  keyAttribute?: string
  children: ReactNode
}

/**
 * 给一组行（连板天梯的行、热力图的格子）包上同一份右键菜单：右键、菜单键、Shift+F10 都开它。
 * 自己不画任何盒子（display: contents），只在事件冒泡路径上认「最近的带键元素」；没落在行上就不开菜单。
 */
export function RowContextMenu({ actionsFor, label, keyAttribute = 'data-code', children }: RowContextMenuProps) {
  const [target, setTarget] = useState<string | null>(null)
  const selector = `[${keyAttribute}]`
  const keyOf = (node: EventTarget | null) =>
    node instanceof Element ? (node.closest<HTMLElement>(selector)?.getAttribute(keyAttribute) ?? null) : null
  const items = target === null || !actionsFor ? [] : actionsFor(target)

  const onContextMenu = (event: MouseEvent<HTMLElement>) => {
    const key = keyOf(event.target)
    // 没落在行上、或这一行没有项：目标置空，菜单里没有内容可画（Radix 的右键触发器仍会拦下浏览器自己的菜单）。
    setTarget(key !== null && (actionsFor?.(key).length ?? 0) > 0 ? key : null)
  }
  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (!(event.key === 'ContextMenu' || (event.key === 'F10' && event.shiftKey))) return
    const row = (event.target as Element).closest<HTMLElement>(selector)
    if (!row) return
    event.preventDefault()
    const box = row.getBoundingClientRect()
    row.dispatchEvent(
      new globalThis.MouseEvent('contextmenu', {
        bubbles: true,
        cancelable: true,
        clientX: box.left + Math.min(24, box.width / 2),
        clientY: box.bottom,
      }),
    )
  }

  if (!actionsFor) return <>{children}</>
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div style={{ display: 'contents' }} onContextMenu={onContextMenu} onKeyDown={onKeyDown}>
          {children}
        </div>
      </ContextMenuTrigger>
      {items.length > 0 && (
        <ContextMenuContent aria-label={label}>
          <RowActionMenuItems items={items} />
        </ContextMenuContent>
      )}
    </ContextMenu>
  )
}
