// SPDX-License-Identifier: MIT
// 面板页签组（2026-11-19，用户：「TAB 栏不够智能……OKX 工具栏的设置方法跟我们不一样，我们也可以支持这种做法」）。
// 功能参照 OKX 交易页每个面板顶上的页签栏（2026-11-19 实际打开看的）：一个面板格子里叠几个组件，各一个页签；悬停页签出「×」移除；
// 末尾「+」打开添加组件；栏的右端是这个面板自己的动作（设置、浮窗）。实现原创。
// 与 PanelFrame 的分工：PanelFrame 是「一个面板一个固定标题」（我们原来的做法）；PanelTabs 是「一个格子一组页签」（OKX 的做法），两种都支持，
// PanelTabs 可以直接放进 PanelFrame 的标题栏。宿主给数据与回调，包里不知道工作区模型；跨面板拖放由宿主接 onDragStart 里的 id。
// 放不下的页签收进「…」下拉，当前页签始终可见（规则与 WorkspaceTabs 同一个纯函数）。键盘照 WAI-ARIA APG 的 Tabs（手动激活）：
// ← → Home End 移焦点，Enter / 空格切换，Delete 移除，Alt+← / → 挪位置。
import { Ellipsis, Plus, X } from 'lucide-react'
import { useLayoutEffect, useRef, useState, type DragEvent, type KeyboardEvent, type ReactNode } from 'react'
import { cn } from '../../lib/cn.ts'
import { focusRingInset } from '../../lib/focus.ts'
import { fontFor, measureText } from '../../lib/text-measure.ts'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../primitives/dropdown-menu.tsx'
import { visibleTabs } from '../workspace-tabs/workspace-tabs-model.ts'

/** The drag payload type set on dataTransfer, so a host drop zone can tell a panel tab from other drags. */
export const PANEL_TAB_MIME = 'application/x-katana-panel-tab'

export type PanelTab = {
  id: string
  name: string
  /** Small node before the name (an icon or a status dot). */
  icon?: ReactNode
  /** Small text after the name, for example a count. */
  badge?: string
  /** False keeps the tab from being removed (no × and Delete does nothing). Defaults to true when onClose is given. */
  closable?: boolean
}

export type PanelTabsLabels = {
  /** Accessible name of a tab's remove button, with {name}. */
  close?: string
  /** Accessible name of the add button. */
  add?: string
  /** Accessible name of the overflow button. */
  more?: string
}

export type PanelTabsProps = {
  /** The tabs, in order. */
  tabs: readonly PanelTab[]
  /** Id of the selected tab. */
  activeId: string
  /** Called when a tab is chosen. */
  onSelect: (id: string) => void
  /** Called when a tab's × is clicked or Delete is pressed on it; leave out to make tabs permanent. */
  onClose?: (id: string) => void
  /** Called when the + is clicked, to open the component catalog; leave out to hide it. */
  onAdd?: () => void
  /** Moves tab `id` to where `targetId` is (drag within the bar, Alt+arrows); leave out to fix the order. */
  onReorder?: (id: string, targetId: string) => void
  /** This panel's own actions at the right end (settings, pop out). */
  actions?: ReactNode
  /** Accessible name of the tab list. */
  label: string
  /** Accessible names of the buttons. */
  labels?: PanelTabsLabels
  /** Extra class name on the bar. */
  className?: string
}

const MORE_WIDTH = 32
const TAB_GAP = 16
const ICON_WIDTH = 18

/** 一个页签排出来的宽度：名字用 pretext 预先算（12px、500），加图标与角标；「×」浮在页签右上角，不占宽度（照 OKX）。 */
function tabWidth(tab: PanelTab): number {
  const name = measureText(tab.name, fontFor(500, 12, '--font-sans'))
  const badge = tab.badge ? 4 + measureText(tab.badge, fontFor(400, 11, '--font-num')) : 0
  return Math.ceil(name + badge) + (tab.icon ? ICON_WIDTH : 0) + TAB_GAP
}

/** Panel tab group: several components stacked in one panel slot, one tab each, with remove, add and overflow. */
export function PanelTabs({
  tabs,
  activeId,
  onSelect,
  onClose,
  onAdd,
  onReorder,
  actions,
  label,
  labels,
  className,
}: PanelTabsProps) {
  const root = useRef<HTMLDivElement>(null)
  const list = useRef<HTMLDivElement>(null)
  const aside = useRef<HTMLDivElement>(null)
  const [shownIds, setShownIds] = useState<readonly string[] | null>(null)
  const [over, setOver] = useState<string | null>(null)
  const dragged = useRef<string | null>(null)
  const active = tabs.some((tab) => tab.id === activeId) ? activeId : (tabs[0]?.id ?? '')
  const canClose = (tab: PanelTab) => Boolean(onClose) && tab.closable !== false

  const fit = () => {
    const box = root.current
    if (!box) return
    const widths = tabs.map(tabWidth)
    const next = visibleTabs(
      widths,
      tabs.findIndex((tab) => tab.id === active),
      box.clientWidth - (aside.current?.offsetWidth ?? 0) - 16,
      MORE_WIDTH,
    ).map((index) => tabs[index]!.id)
    setShownIds((prev) => (prev && prev.join('|') === next.join('|') ? prev : next))
  }
  const latestFit = useRef(fit)
  useLayoutEffect(() => {
    latestFit.current = fit
    fit()
  })
  useLayoutEffect(() => {
    const box = root.current
    if (!box) return
    const run = () => latestFit.current()
    const observer = new ResizeObserver(run)
    observer.observe(box)
    document.fonts?.addEventListener?.('loadingdone', run)
    return () => {
      observer.disconnect()
      document.fonts?.removeEventListener?.('loadingdone', run)
    }
  }, [])

  const shown = shownIds === null ? tabs : tabs.filter((tab) => shownIds.includes(tab.id))
  const folded = tabs.filter((tab) => !shown.includes(tab))
  const nodes = () => [...(list.current?.querySelectorAll<HTMLElement>('[role="tab"]') ?? [])]
  const focusTab = (id: string) =>
    requestAnimationFrame(() =>
      nodes()
        .find((node) => node.dataset.id === id)
        ?.focus(),
    )

  const onKeyDown = (event: KeyboardEvent<HTMLElement>, index: number, tab: PanelTab) => {
    if ((event.key === 'Delete' || event.key === 'Backspace') && canClose(tab)) {
      event.preventDefault()
      const neighbour = shown[index + 1] ?? shown[index - 1]
      onClose?.(tab.id)
      if (neighbour) focusTab(neighbour.id)
      return
    }
    if (event.altKey && (event.key === 'ArrowLeft' || event.key === 'ArrowRight') && onReorder) {
      const target = shown[index + (event.key === 'ArrowLeft' ? -1 : 1)]
      if (!target) return
      event.preventDefault()
      onReorder(tab.id, target.id)
      focusTab(tab.id)
      return
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onSelect(tab.id)
      return
    }
    const last = shown.length - 1
    const to =
      event.key === 'ArrowRight'
        ? Math.min(index + 1, last)
        : event.key === 'ArrowLeft'
          ? Math.max(index - 1, 0)
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? last
              : null
    if (to === null) return
    event.preventDefault()
    nodes()[to]?.focus()
  }
  const drop = (event: DragEvent, target: string) => {
    const from = dragged.current
    dragged.current = null
    setOver(null)
    // 只接本栏里拖起来的页签；别的栏拖来的不拦，留给宿主的落点处理。
    if (!from) return
    event.preventDefault()
    if (from !== target) onReorder?.(from, target)
  }
  const iconButton = cn(
    'grid size-6 shrink-0 cursor-pointer place-items-center rounded-[var(--radius-inner)] border-0 bg-transparent text-(color:--k-actionable-subtle-foreground)',
    'hover:bg-(--k-actionable-subtle-background-hover) hover:text-(color:--k-actionable-subtle-foreground-hover) [&_svg]:size-[14px]',
    focusRingInset,
  )

  return (
    <div
      ref={root}
      data-slot="panel-tabs"
      className={cn('flex h-8 w-full min-w-0 items-center border-b border-line px-2', className)}
    >
      <div ref={list} role="tablist" aria-label={label} className="flex h-full min-w-0 items-stretch">
        {shown.map((tab, index) => {
          const selected = tab.id === active
          const closable = canClose(tab)
          return (
            <span
              key={tab.id}
              data-slot="panel-tab"
              data-over={over === tab.id ? '' : undefined}
              className="group/tab relative mr-4 flex items-center data-[over]:shadow-[inset_2px_0_0_var(--k-content-primary-foreground)]"
            >
              <button
                type="button"
                role="tab"
                data-id={tab.id}
                aria-selected={selected}
                tabIndex={selected ? 0 : -1}
                draggable
                onClick={() => onSelect(tab.id)}
                onKeyDown={(event) => onKeyDown(event, index, tab)}
                onDragStart={(event) => {
                  dragged.current = tab.id
                  event.dataTransfer.effectAllowed = 'move'
                  event.dataTransfer.setData(PANEL_TAB_MIME, tab.id)
                  event.dataTransfer.setData('text/plain', tab.id)
                }}
                onDragOver={(event) => {
                  if (!dragged.current || !onReorder) return
                  event.preventDefault()
                  setOver(tab.id)
                }}
                onDragLeave={() => setOver((prev) => (prev === tab.id ? null : prev))}
                onDrop={(event) => drop(event, tab.id)}
                onDragEnd={() => {
                  dragged.current = null
                  setOver(null)
                }}
                className={cn(
                  'relative flex h-full cursor-pointer items-center gap-1.5 border-0 bg-transparent p-0 text-[12px] leading-none font-medium whitespace-nowrap',
                  'after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-(--k-content-primary-foreground) after:opacity-0 aria-selected:after:opacity-100',
                  selected ? 'text-ink' : 'text-ink-3 hover:text-ink-2',
                  focusRingInset,
                )}
              >
                {tab.icon}
                {tab.name}
                {tab.badge ? (
                  <span className="font-(family-name:--font-num) text-[11px] text-ink-4">{tab.badge}</span>
                ) : null}
              </button>
              {closable ? (
                <button
                  type="button"
                  tabIndex={-1}
                  data-slot="panel-tab-close"
                  aria-label={(labels?.close ?? '').replace('{name}', tab.name)}
                  onClick={() => onClose?.(tab.id)}
                  className="absolute top-0.5 -right-2.5 grid size-3.5 cursor-pointer place-items-center rounded-full border-0 bg-surface-4 p-0 text-ink-2 opacity-0 group-focus-within/tab:opacity-100 group-hover/tab:opacity-100 hover:text-ink [&_svg]:size-2.5"
                >
                  <X aria-hidden="true" />
                </button>
              ) : null}
            </span>
          )
        })}
      </div>
      {folded.length > 0 ? (
        <DropdownMenu>
          <DropdownMenuTrigger className={iconButton} aria-label={labels?.more} data-slot="panel-tabs-more">
            <Ellipsis aria-hidden="true" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {folded.map((tab) => (
              <DropdownMenuItem key={tab.id} onSelect={() => onSelect(tab.id)}>
                {tab.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
      {onAdd ? (
        <button
          type="button"
          className={iconButton}
          aria-label={labels?.add}
          data-slot="panel-tabs-add"
          onClick={onAdd}
        >
          <Plus aria-hidden="true" />
        </button>
      ) : null}
      <div ref={aside} className="ml-auto flex shrink-0 items-center gap-0.5 pl-2">
        {actions}
      </div>
    </div>
  )
}
