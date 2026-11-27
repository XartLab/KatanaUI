// SPDX-License-Identifier: MIT
// 面板页签组（2026-11-19，用户：「TAB 栏不够智能……OKX 工具栏的设置方法跟我们不一样，我们也可以支持这种做法」）。
// 功能参照 OKX 交易页每个面板顶上的页签栏（2026-11-19 实际打开看的）：一个面板格子里叠几个组件，各一个页签；悬停页签出「×」移除；
// 末尾「+」打开添加组件；栏的右端是这个面板自己的动作（设置、浮窗）。实现原创。
// 与 PanelFrame 的分工：PanelFrame 是「一个面板一个固定标题」（我们原来的做法）；PanelTabs 是「一个格子一组页签」（OKX 的做法），两种都支持，
// PanelTabs 可以直接放进 PanelFrame 的标题栏。宿主给数据与回调，包里不知道工作区模型；跨面板拖放由宿主接 onDragStart 里的 id。
// 智能的部分（用户 2026-11-19：「看 K 线的肯定跟其他的功能不一样」）：每个页签声明自己的 kind 与 tools，栏上只显示当前页签的工具
// （K 线：品种、周期、指标、画线；表：筛选、列、导出），切页签工具跟着换；一行放不下时工具自动落到第二行，页签不被挤掉；
// 「+」把当前页签的 kind 带给宿主，目录按它给推荐；页签上可带状态点（实时 / 过期 / 出错）与当前对象（BTCUSDT · 15m）。
// 做法参照 Blender 的编辑器头（每个区域的头随编辑器类型换）与 VS Code 编辑器组标题栏上随编辑器换的动作；实现原创。
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
  /** What sort of component this is (chart, table, form…); passed to onAdd so the catalog can recommend companions. */
  kind?: string
  /** This component's own tools, shown in the bar only while its tab is selected. */
  tools?: ReactNode
  /** What it is showing now, drawn after the name while selected (a symbol and interval, say). */
  context?: string
  /** Data state, drawn as a dot before the name: live, stale (not updating) or error. */
  status?: PanelTabStatus
}

export type PanelTabStatus = 'live' | 'stale' | 'error'

export type PanelTabsLabels = {
  /** Accessible name of a tab's remove button, with {name}. */
  close?: string
  /** Accessible name of the add button. */
  add?: string
  /** Accessible name of the overflow button. */
  more?: string
  /** Accessible name of the selected tab's tools group, with {name}. */
  tools?: string
  /** Accessible names of the status dots. */
  status?: Partial<Record<PanelTabStatus, string>>
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
  /** Called when the + is clicked, with the selected tab's kind, to open the component catalog; leave out to hide it. */
  onAdd?: (kind: string | undefined) => void
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
const STATUS_WIDTH = 12
const STATUS_COLOR: Record<PanelTabStatus, string> = {
  live: 'bg-(--k-status-ok-foreground)',
  stale: 'bg-(--k-status-warn-foreground)',
  error: 'bg-(--k-status-danger-foreground)',
}

/** 一个页签排出来的宽度（selected 时算上 context）：名字用 pretext 预先算（12px、500），加图标与角标；「×」浮在页签右上角，不占宽度（照 OKX）。 */
function tabWidth(tab: PanelTab, selected: boolean): number {
  const text = selected && tab.context ? `${tab.name} ${tab.context}` : tab.name
  const name = measureText(text, fontFor(500, 12, '--font-sans')) + (selected && tab.context ? 6 : 0)
  const badge = tab.badge ? 4 + measureText(tab.badge, fontFor(400, 11, '--font-num')) : 0
  return Math.ceil(name + badge) + (tab.icon ? ICON_WIDTH : 0) + (tab.status ? STATUS_WIDTH : 0) + TAB_GAP
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
  const toolbox = useRef<HTMLDivElement>(null)
  const [stacked, setStacked] = useState(false)
  const [shownIds, setShownIds] = useState<readonly string[] | null>(null)
  const [over, setOver] = useState<string | null>(null)
  const dragged = useRef<string | null>(null)
  const active = tabs.some((tab) => tab.id === activeId) ? activeId : (tabs[0]?.id ?? '')
  const canClose = (tab: PanelTab) => Boolean(onClose) && tab.closable !== false

  const activeTab = tabs.find((tab) => tab.id === active)
  const tools = activeTab?.tools

  const fit = () => {
    const box = root.current
    if (!box) return
    const widths = tabs.map((tab) => tabWidth(tab, tab.id === active))
    const fixed = (aside.current?.offsetWidth ?? 0) + (onAdd ? 24 : 0) + 16
    const room = box.clientWidth - fixed
    // 工具想排在页签同一行：页签全放得下、剩下的宽度又够工具的自然宽度才行；不够就落到第二行，页签用整行。
    // 同一行时工具区带 pl-3（12px，算在 scrollWidth 里），落到第二行时没有：第二行量到的要补上这 12，两种排法算出的才是同一个数。
    // 不补的话，剩余宽度落在这 12px 的缝里时，同一行判「放不下」、第二行判「放得下」，来回切到 React 报更新过深、整页不渲染。
    const toolsWidth = toolbox.current ? toolbox.current.scrollWidth + 12 + (stacked ? 12 : 0) : 0
    const tabsWidth = widths.reduce((sum, width) => sum + width, 0)
    const inline = toolsWidth === 0 || tabsWidth + toolsWidth <= room
    setStacked(!inline)
    const next = visibleTabs(
      widths,
      tabs.findIndex((tab) => tab.id === active),
      inline ? room - toolsWidth : room,
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

  const toolsNode = (
    <div
      ref={toolbox}
      role="group"
      data-slot="panel-tab-tools"
      aria-label={(labels?.tools ?? '').replace('{name}', activeTab?.name ?? '')}
      className={cn('flex shrink-0 items-center gap-1', !stacked && 'ml-1 border-l border-line pl-3')}
    >
      {tools}
    </div>
  )

  return (
    <div
      ref={root}
      data-slot="panel-tabs"
      data-kind={activeTab?.kind}
      data-stacked={stacked ? '' : undefined}
      className={cn('flex w-full min-w-0 flex-col border-b border-line', className)}
    >
      <div className="flex h-8 w-full min-w-0 items-center px-2">
        <div ref={list} role="tablist" aria-label={label} className="flex h-full min-w-0 items-stretch overflow-hidden">
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
                  {tab.status ? (
                    <span
                      data-slot="panel-tab-status"
                      data-status={tab.status}
                      role="img"
                      aria-label={labels?.status?.[tab.status]}
                      className={cn('size-1.5 shrink-0 rounded-full', STATUS_COLOR[tab.status])}
                    />
                  ) : null}
                  {tab.icon}
                  {tab.name}
                  {selected && tab.context ? (
                    <span data-slot="panel-tab-context" className="font-normal text-ink-3">
                      {tab.context}
                    </span>
                  ) : null}
                  {tab.badge ? (
                    <span className="font-(family-name:--font-num) text-[11px] text-ink-3">{tab.badge}</span>
                  ) : null}
                </button>
                {closable ? (
                  // × 只给指针用：它在 tablist 里，tablist 只许有 tab（axe aria-required-children，#190）；键盘与读屏用 Delete 移除。
                  <button
                    type="button"
                    tabIndex={-1}
                    aria-hidden="true"
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
            onClick={() => onAdd(activeTab?.kind)}
          >
            <Plus aria-hidden="true" />
          </button>
        ) : null}
        {tools && !stacked ? toolsNode : null}
        <div ref={aside} className="ml-auto flex shrink-0 items-center gap-0.5 pl-2">
          {actions}
        </div>
      </div>
      {tools && stacked ? (
        <div className="flex h-8 w-full min-w-0 items-center overflow-hidden px-2">{toolsNode}</div>
      ) : null}
    </div>
  )
}
