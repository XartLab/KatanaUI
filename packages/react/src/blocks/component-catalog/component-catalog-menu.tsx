// SPDX-License-Identifier: MIT
// ComponentCatalog 的 menu 样式：OKX 面板页签栏「+」垂下来的紧凑清单（2026-11-26 在用户的 Chrome 里看的）。实现原创。
// 每类一个可折叠的分组标题（点开合，aria-expanded），每行一个名字加右边的「+」；已添加的与不可用的整行置灰，悬停或键盘聚焦时用提示说明原因：
// 已添加用 labels.inUse（「已添加此组件」），不可用用条目自带的 unavailable 文字。读屏名里也带着原因，不只靠提示。
// 灰的行用 aria-disabled 而不是 disabled：要能聚焦才看得到提示。分组、推荐、排序全用 groupCatalog，没有另写一份；也没有搜索与类别页签（紧凑清单靠分组折叠）。
// 点一行只添加（onToggle(id, true)）：已在用的行是灰的、点了没反应，要移除走面板页签上的「×」。行也可拖（带 CATALOG_ITEM_MIME）。
import { ChevronDown, Plus } from 'lucide-react'
import { useId, useState } from 'react'
import { cn } from '../../lib/cn.ts'
import { focusRingInset } from '../../lib/focus.ts'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../primitives/tooltip.tsx'
import { groupCatalog, setCatalogDrag, type CatalogCategory, type CatalogItem } from './component-catalog-model.ts'

type MenuLabels = { title: string; recommended?: string; empty: string; inUse: string }

/** The compact menu variant of ComponentCatalog: collapsible groups of name + plus rows, greyed with a reason when not addable. */
export function CatalogMenu({
  items,
  categories,
  context,
  onToggle,
  labels,
  className,
}: {
  items: readonly CatalogItem[]
  categories: readonly CatalogCategory[]
  context?: string
  onToggle: (id: string, add: boolean) => void
  labels: MenuLabels
  className?: string
}) {
  const prefix = useId()
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(new Set())
  const groups = groupCatalog(items, categories, { recommendedName: labels.recommended, context })
  const toggle = (id: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  return (
    <TooltipProvider>
      <div
        role="group"
        aria-label={labels.title}
        data-slot="component-catalog"
        data-variant="menu"
        className={cn('k-text-body flex w-full min-w-[200px] flex-col gap-1', className)}
      >
        {groups.length === 0 ? (
          <p data-slot="catalog-empty" className="k-text-caption m-0 px-2 py-3 text-center text-ink-3">
            {labels.empty}
          </p>
        ) : null}
        {groups.map((group) => {
          const open = !collapsed.has(group.id)
          const listId = `${prefix}-${group.id}`
          return (
            <section key={group.id} data-slot="catalog-group" data-group={group.id}>
              <h3 className="m-0 font-normal">
                <button
                  type="button"
                  data-slot="catalog-group-toggle"
                  aria-expanded={open}
                  aria-controls={listId}
                  onClick={() => toggle(group.id)}
                  className={cn(
                    'k-text-caption flex w-full cursor-pointer items-center gap-1 rounded-[var(--radius-control)] border-0 bg-transparent px-2 py-1.5 text-left text-ink-3 hover:text-ink',
                    focusRingInset,
                  )}
                >
                  <ChevronDown
                    aria-hidden="true"
                    className={cn('size-3 shrink-0 transition-transform', !open && '-rotate-90')}
                  />
                  {group.name}
                </button>
              </h3>
              <ul id={listId} hidden={!open} className="m-0 flex list-none flex-col p-0 [&[hidden]]:hidden">
                {group.items.map((item) => {
                  const reason = item.unavailable ?? (item.inUse ? labels.inUse : undefined)
                  const row = (
                    <button
                      type="button"
                      data-slot="catalog-item"
                      data-id={item.id}
                      aria-disabled={reason !== undefined || undefined}
                      aria-label={reason ? `${item.name} · ${reason}` : undefined}
                      draggable={reason === undefined}
                      onDragStart={(event) => setCatalogDrag(event, item.id)}
                      onClick={() => {
                        if (reason === undefined) onToggle(item.id, true)
                      }}
                      className={cn(
                        'flex min-h-8 w-full items-center justify-between gap-3 rounded-[var(--radius-control)] border-0 bg-transparent px-2 py-1.5 text-left text-ink',
                        reason === undefined
                          ? 'cursor-pointer hover:bg-(--k-actionable-subtle-background-hover)'
                          : 'cursor-not-allowed text-ink-3 opacity-60',
                        focusRingInset,
                      )}
                    >
                      <span className="min-w-0 truncate">{item.name}</span>
                      <Plus aria-hidden="true" className="size-3.5 shrink-0" />
                    </button>
                  )
                  return (
                    <li key={item.id}>
                      {reason === undefined ? (
                        row
                      ) : (
                        <Tooltip>
                          <TooltipTrigger asChild>{row}</TooltipTrigger>
                          <TooltipContent side="right">{reason}</TooltipContent>
                        </Tooltip>
                      )}
                    </li>
                  )
                })}
              </ul>
            </section>
          )
        })}
      </div>
    </TooltipProvider>
  )
}
