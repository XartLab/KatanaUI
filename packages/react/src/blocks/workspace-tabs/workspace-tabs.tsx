// SPDX-License-Identifier: MIT
import { Ellipsis, Plus } from 'lucide-react'
import { useLayoutEffect, useRef, useState, type DragEvent, type KeyboardEvent } from 'react'
import { cn } from '../../lib/cn.ts'
import { fontFor, measureText } from '../../lib/text-measure.ts'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../primitives/dropdown-menu.tsx'
import { visibleTabs } from './workspace-tabs-model.ts'

// 工作区标签条（#1901）：顶层的工作区切换，一个标签一个工作区。组件卡 WorkspaceTabs：当前标签凹陷、底部 2px 橙线用 snappy 弹簧从旧标签滑到新标签，
// 右侧 mono 9px 快捷键提示，最右一个「+」新建。宿主给数据与回调；包里不知道工作区模型，也没有文字。
// 溢出照卡：放不下的标签收进末尾的「更多」下拉；当前标签始终可见（它被收起时与最后一个可见的换位）；条宽由 ResizeObserver 量。
// 键盘照 WAI-ARIA APG 的 Tabs 模式（手动激活）：整条只占一个 Tab 站，← → Home End 移焦点，Enter / 空格切换；
// Alt+← / Alt+→ 把当前聚焦的标签往前 / 往后挪一位；F2 与双击进改名。拖动排序用原生拖放（标签 draggable），落在谁上就换到谁的位置。
// 「⌘1–9 直达、Ctrl+Tab 循环」是全局快捷键，由宿主的快捷键表管，这里不绑。

const MORE_WIDTH = 40

// 标签的固定宽（px），来源 theme/workspace-tabs.css：左右 padding 各 16（第 27 行）、右边线 1（第 29 行）、名字与快捷键的 gap 8（第 24 行）、
// 最宽 200（第 26 行，按钮是 border-box，含 padding 与边线）。名字 600 14px --font-sans、字距 0.06em 且大写（第 32–34 行）；
// 快捷键 9px --font-num、字距 0（第 57–58 行）。
const TAB_PADDING = 32
const TAB_BORDER = 1
const TAB_GAP = 8
const TAB_MAX = 200
const NAME_TRACKING = 0.06 * 14

/** 一个标签排出来的宽度：用 pretext 按字体预先算，不渲染出来量（换字体时由 fit 重算）。 */
function tabWidth(item: WorkspaceTab): number {
  const name = measureText(item.name.toUpperCase(), fontFor(600, 14, '--font-sans'), NAME_TRACKING)
  const key = item.hotkey ? TAB_GAP + measureText(item.hotkey, fontFor(400, 9, '--font-num')) : 0
  return Math.min(Math.ceil(name + key) + TAB_PADDING + TAB_BORDER, TAB_MAX)
}

export type WorkspaceTab = {
  id: string
  name: string
  /** 快捷键提示（如 ⌘1），只显示，不绑定。 */
  hotkey?: string
}

/** Texts of WorkspaceTabs (screen-reader names). */
export type WorkspaceTabsLabels = {
  /** 「+」的名字（给了 onCreate 时要给）。 */
  create?: string
  /** 「更多」下拉按钮的名字。 */
  more?: string
}

export type WorkspaceTabsProps = {
  workspaces: readonly WorkspaceTab[]
  activeId: string
  onSelect: (id: string) => void
  /** 把 id 这个标签挪到 targetId 现在的位置（拖放、Alt+方向键都走这里）。不给就不能排序。 */
  onReorder?: (id: string, targetId: string) => void
  /** 进改名（双击、F2）；改名的输入框是宿主的事。不给就不能改名。 */
  onRename?: (id: string) => void
  /** 新建；不给就不画「+」。 */
  onCreate?: () => void
  /** 条的名字（读屏念）。 */
  label: string
  labels?: WorkspaceTabsLabels
  /** @deprecated Use `labels.create`; kept for one version. */
  createLabel?: string
  /** @deprecated Use `labels.more`; kept for one version. */
  moreLabel?: string
  className?: string
}

export function WorkspaceTabs({
  workspaces,
  activeId,
  onSelect,
  onReorder,
  onRename,
  onCreate,
  label,
  labels,
  createLabel = labels?.create ?? '',
  moreLabel = labels?.more ?? '',
  className,
}: WorkspaceTabsProps) {
  const root = useRef<HTMLDivElement>(null)
  const list = useRef<HTMLDivElement>(null)
  const [shownIds, setShownIds] = useState<readonly string[] | null>(null)
  const [mark, setMark] = useState<{ left: number; width: number } | null>(null)
  const [over, setOver] = useState<string | null>(null)
  const dragged = useRef<string | null>(null)
  const active = workspaces.some((item) => item.id === activeId) ? activeId : (workspaces[0]?.id ?? '')

  const fit = () => {
    const box = root.current
    if (!box) return
    const widths = workspaces.map(tabWidth)
    const aside = [...box.querySelectorAll<HTMLElement>('.k-wtabs-create')].reduce(
      (sum, node) => sum + node.offsetWidth,
      0,
    )
    const next = visibleTabs(
      widths,
      workspaces.findIndex((item) => item.id === active),
      box.clientWidth - aside,
      MORE_WIDTH,
    ).map((index) => workspaces[index]!.id)
    setShownIds((prev) => (prev && prev.join('|') === next.join('|') ? prev : next))
  }
  const latestFit = useRef(fit)
  // 渲染后再换成最新的 fit：观察者回调里拿到的是最新数据，又不在渲染中写 ref
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
    // Web 字体加载完字宽会变，预算宽度要跟着重算（text-measure 已先清缓存）
    document.fonts?.addEventListener?.('loadingdone', run)
    return () => {
      observer.disconnect()
      document.fonts?.removeEventListener?.('loadingdone', run)
    }
    // fit 只读 ref 与当前数据，每次渲染后的量由上面的 useLayoutEffect 管
  }, [])
  const shown =
    shownIds === null ? workspaces : shownIds.map((id) => workspaces.find((item) => item.id === id)!).filter(Boolean)
  const folded = workspaces.filter((item) => !shown.includes(item))

  const tabs = () => [...(list.current?.querySelectorAll<HTMLElement>('[role="tab"]') ?? [])]
  const place = () => {
    const node = tabs().find((tab) => tab.dataset.id === active)
    setMark((prev) => {
      if (!node) return null
      const next = { left: node.offsetLeft, width: node.offsetWidth }
      return prev && prev.left === next.left && prev.width === next.width ? prev : next
    })
  }
  useLayoutEffect(() => {
    place()
    // 条自己或任何一个标签的宽度变了（字体加载完、改名、条被拉宽）都要重新量，橙线才不偏
    const node = list.current
    if (!node) return
    const observer = new ResizeObserver(place)
    observer.observe(node)
    for (const tab of tabs()) observer.observe(tab)
    return () => observer.disconnect()
    // place 只读 ref；换了当前标签、标签的名字或数量就重新量并重新观察
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [active, workspaces, shownIds])

  const onKeyDown = (event: KeyboardEvent<HTMLElement>, index: number, id: string) => {
    if (event.key === 'F2' && onRename) {
      event.preventDefault()
      onRename(id)
      return
    }
    if (event.altKey && (event.key === 'ArrowLeft' || event.key === 'ArrowRight') && onReorder) {
      const target = shown[index + (event.key === 'ArrowLeft' ? -1 : 1)]
      if (!target) return
      event.preventDefault()
      onReorder(id, target.id)
      // 标签重排后焦点留在同一个标签上（它换了位置，节点可能重建）
      requestAnimationFrame(() =>
        tabs()
          .find((tab) => tab.dataset.id === id)
          ?.focus(),
      )
      return
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onSelect(id)
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
    tabs()[to]?.focus()
  }
  const drop = (event: DragEvent, target: string) => {
    event.preventDefault()
    const from = dragged.current
    dragged.current = null
    setOver(null)
    if (from && from !== target) onReorder?.(from, target)
  }

  return (
    <div className={cn('k-wtabs', className)} data-slot="workspace-tabs" ref={root}>
      <div ref={list} role="tablist" aria-label={label} className="k-wtabs-list">
        {shown.map((item, index) => {
          const selected = item.id === active
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              data-id={item.id}
              aria-selected={selected}
              tabIndex={selected ? 0 : -1}
              title={item.name}
              draggable={onReorder ? true : undefined}
              data-over={over === item.id ? '' : undefined}
              className="k-wtab"
              onClick={() => onSelect(item.id)}
              onDoubleClick={onRename ? () => onRename(item.id) : undefined}
              onKeyDown={(event) => onKeyDown(event, index, item.id)}
              onDragStart={(event) => {
                dragged.current = item.id
                event.dataTransfer.effectAllowed = 'move'
                event.dataTransfer.setData('text/plain', item.id)
              }}
              onDragOver={(event) => {
                if (!dragged.current) return
                event.preventDefault()
                setOver(item.id)
              }}
              onDragLeave={() => setOver((prev) => (prev === item.id ? null : prev))}
              onDrop={(event) => drop(event, item.id)}
              onDragEnd={() => {
                dragged.current = null
                setOver(null)
              }}
            >
              <span className="k-wtab-name">{item.name}</span>
              {item.hotkey && <span className="k-wtab-key">{item.hotkey}</span>}
            </button>
          )
        })}
        {mark && <span className="k-wtabs-mark" aria-hidden="true" style={{ left: mark.left, width: mark.width }} />}
      </div>
      {folded.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger className="k-wtabs-more" aria-label={moreLabel}>
            <Ellipsis aria-hidden="true" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {folded.map((item) => (
              <DropdownMenuItem key={item.id} onSelect={() => onSelect(item.id)}>
                {item.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      {onCreate && (
        <button
          type="button"
          className="k-wtabs-create"
          aria-label={createLabel}
          title={createLabel}
          onClick={onCreate}
        >
          <Plus aria-hidden="true" />
        </button>
      )}
    </div>
  )
}
