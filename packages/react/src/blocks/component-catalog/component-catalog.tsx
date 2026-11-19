// SPDX-License-Identifier: MIT
// 添加组件的目录（2026-11-19，配 PanelTabs 的「+」）。功能参照 OKX 交易页的「添加组件」抽屉（2026-11-19 实际打开看的）：
// 顶上标题与「重置布局」、一句说明、类别页签（全部 / 市场信息 / 订单仓位 / 交易面板），下面按类别分组的三列卡片，每张一个缩略图加名字；
// 已经在工作区里的打勾，当前品种用不了的置灰；卡片可以拖到工作区。实现原创。
// OKX 没有、我们加的：搜索框（名字与别名）、「推荐」一组（宿主按当前品种与市场包标 recommended）、置灰的卡写明原因。
// 只是目录本身：放进 Sheet、Popover 还是侧栏由宿主定；点卡片回调 onToggle，拖放的落点也是宿主的事。
import { Check, RotateCcw } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { cn } from '../../lib/cn.ts'
import { focusRing } from '../../lib/focus.ts'
import { Button } from '../../primitives/button.tsx'
import { Input } from '../../primitives/input.tsx'
import { Tabs, TabsList, TabsTrigger } from '../../primitives/tabs.tsx'
import { groupCatalog, type CatalogCategory, type CatalogItem, type CatalogKind } from './component-catalog-model.ts'

/** The drag payload type set on dataTransfer when a catalog card is dragged. */
export const CATALOG_ITEM_MIME = 'application/x-katana-component'

export type ComponentCatalogLabels = {
  title: string
  /** One line under the title. */
  hint?: string
  reset?: string
  search: string
  all: string
  /** Heading of the recommended group; leave out to not show one. */
  recommended?: string
  /** Shown when the search finds nothing. */
  empty: string
  /** Appended to the accessible name of a card that is already in the workspace. */
  inUse: string
}

/** 缩略图：没给 thumbnail 时按 kind 画一张示意，只用中性色与一点涨跌色，不是真实截图。 */
function Glyph({ kind }: { kind: CatalogKind }) {
  const bar = (x: number, y: number, w: number, h = 4, o = 0.5) => (
    <rect key={`${x}-${y}-${w}`} x={x} y={y} width={w} height={h} rx={2} fill="currentColor" opacity={o} />
  )
  const body = {
    table: [0, 1, 2, 3, 4].flatMap((row) => [
      bar(10, 14 + row * 11, 30),
      bar(46, 14 + row * 11, 22, 4, 0.3),
      bar(74, 14 + row * 11, 24, 4, 0.3),
    ]),
    list: [0, 1, 2, 3].flatMap((row) => [
      <circle key={`c${row}`} cx={14} cy={18 + row * 13} r={3.5} fill="currentColor" opacity={0.5} />,
      bar(24, 16 + row * 13, 44),
      bar(74, 16 + row * 13, 24, 4, 0.3),
    ]),
    form: [bar(10, 12, 88, 12, 0.18), bar(10, 30, 88, 12, 0.18), bar(10, 50, 40, 12, 0.5), bar(58, 50, 40, 12, 0.3)],
    text: [
      bar(10, 14, 60, 5),
      bar(10, 26, 88, 4, 0.3),
      bar(10, 36, 88, 4, 0.3),
      bar(10, 46, 70, 4, 0.3),
      bar(10, 56, 80, 4, 0.3),
    ],
    chart: [
      <polyline
        key="line"
        points="8,52 22,44 34,48 48,30 60,36 74,20 88,26 100,14"
        fill="none"
        stroke="var(--pnl-up)"
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />,
      bar(8, 62, 92, 1, 0.25),
    ],
    gauge: [
      <path
        key="track"
        d="M24 56 A30 30 0 0 1 84 56"
        fill="none"
        stroke="currentColor"
        strokeOpacity={0.25}
        strokeWidth={6}
      />,
      <path key="value" d="M24 56 A30 30 0 0 1 66 29" fill="none" stroke="var(--pnl-up)" strokeWidth={6} />,
      bar(40, 62, 28),
    ],
  } satisfies Record<CatalogKind, ReactNode[]>
  return (
    <svg viewBox="0 0 108 72" aria-hidden="true" className="size-full text-ink-3">
      {body[kind]}
    </svg>
  )
}

/** Component catalog: search and category tabs over a grid of cards; click a card to add or remove it, or drag it out. */
export function ComponentCatalog({
  items,
  categories,
  thumbnails,
  onToggle,
  onReset,
  labels,
  className,
}: {
  /** Everything that can be added, with its category, in-use and availability flags. */
  items: readonly CatalogItem[]
  /** The categories, in the order their groups appear. */
  categories: readonly CatalogCategory[]
  /** Thumbnail node per item id; items without one get a stock drawing by kind. */
  thumbnails?: Readonly<Record<string, ReactNode>>
  /** Called when a card is clicked: `add` is true for a card not yet in the workspace, false to remove one that is. */
  onToggle: (id: string, add: boolean) => void
  /** Called when the reset button is clicked; leave out to hide it. */
  onReset?: () => void
  /** All visible text and accessible names. */
  labels: ComponentCatalogLabels
  /** Extra class name on the catalog. */
  className?: string
}) {
  const [category, setCategory] = useState('all')
  const [query, setQuery] = useState('')
  const groups = groupCatalog(items, categories, {
    category: category === 'all' ? null : category,
    query,
    recommendedName: query ? undefined : labels.recommended,
  })

  return (
    <div data-slot="component-catalog" className={cn('k-text-body flex w-full flex-col gap-3', className)}>
      <div className="flex items-center justify-between gap-2">
        <h2 className="m-0 text-[15px] font-semibold text-ink">{labels.title}</h2>
        {onReset && labels.reset ? (
          <Button size="sm" onClick={onReset}>
            <RotateCcw aria-hidden="true" />
            {labels.reset}
          </Button>
        ) : null}
      </div>
      {labels.hint ? <p className="k-text-caption m-0 text-ink-3">{labels.hint}</p> : null}
      <Input
        type="search"
        aria-label={labels.search}
        placeholder={labels.search}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      <Tabs value={category} onValueChange={setCategory}>
        <TabsList variant="line" aria-label={labels.title}>
          <TabsTrigger value="all">{labels.all}</TabsTrigger>
          {categories.map((item) => (
            <TabsTrigger key={item.id} value={item.id}>
              {item.name}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      {groups.length === 0 ? (
        <p data-slot="catalog-empty" className="k-text-caption m-0 py-6 text-center text-ink-3">
          {labels.empty}
        </p>
      ) : null}
      {groups.map((group) => (
        <section key={group.id} data-slot="catalog-group" data-group={group.id} className="flex flex-col gap-2">
          <h3 className="k-text-caption m-0 font-normal text-ink-3">{group.name}</h3>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(104px,1fr))] gap-x-2 gap-y-3">
            {group.items.map((item) => {
              const blocked = Boolean(item.unavailable)
              return (
                <button
                  key={item.id}
                  type="button"
                  data-slot="catalog-item"
                  data-id={item.id}
                  aria-pressed={item.inUse === true}
                  aria-disabled={blocked || undefined}
                  aria-label={item.inUse ? `${item.name} · ${labels.inUse}` : item.name}
                  title={item.unavailable}
                  draggable={!blocked}
                  onDragStart={(event) => {
                    event.dataTransfer.effectAllowed = 'copy'
                    event.dataTransfer.setData(CATALOG_ITEM_MIME, item.id)
                    event.dataTransfer.setData('text/plain', item.id)
                  }}
                  onClick={() => {
                    if (!blocked) onToggle(item.id, !item.inUse)
                  }}
                  className={cn(
                    'group/card flex cursor-pointer flex-col items-stretch gap-1.5 border-0 bg-transparent p-0 text-center',
                    blocked && 'cursor-not-allowed opacity-40',
                    focusRing,
                  )}
                >
                  <span
                    className={cn(
                      'relative block aspect-[3/2] overflow-hidden rounded-[var(--radius-control)] border border-line bg-surface-0',
                      !blocked && 'group-hover/card:border-line-strong',
                      item.inUse && 'border-line-strong',
                    )}
                  >
                    {thumbnails?.[item.id] ?? <Glyph kind={item.kind ?? 'table'} />}
                    {item.inUse ? (
                      <span
                        data-slot="catalog-check"
                        className="absolute inset-0 grid place-items-center bg-[color-mix(in_srgb,var(--k-surface-sunken-background)_55%,transparent)] text-ink [&_svg]:size-5"
                      >
                        <Check aria-hidden="true" />
                      </span>
                    ) : null}
                  </span>
                  <span className={cn('k-text-caption', item.inUse ? 'font-semibold text-ink' : 'text-ink-2')}>
                    {item.name}
                  </span>
                  {item.unavailable ? (
                    <span className="k-text-caption -mt-1 text-ink-4">{item.unavailable}</span>
                  ) : null}
                </button>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}
