// SPDX-License-Identifier: MIT
import { useCallback, useId, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { cn } from '../lib/cn.ts'
import { RowContextMenu } from '../patterns/row-actions.tsx'
import { layoutTreemap, type TreemapBlock } from '../katana/treemap-model.ts'
import { formatPrice } from '../lib/chart/format/index.ts'
import { formatMetric, neighbour, niceUnit, stepOf, type Direction } from './market-heatmap-model.ts'
import { HeatmapCard, type Hover } from './market-heatmap-card.tsx'
import { HeatmapCell } from './market-heatmap-cell.tsx'
import { useCellFlip, useDrillFocus, useInkContrast, usePlotBox, useTurnFlash } from './market-heatmap-hooks.ts'
import { HeatmapLegend } from './market-heatmap-legend.tsx'
import { HeatmapToolbar } from './market-heatmap-toolbar.tsx'
import type { HeatmapEntry, HeatmapTitleMode, HeatmapValueMode, MarketHeatmapProps } from './market-heatmap-types.ts'

export type {
  HeatmapColorBy,
  HeatmapDisplayLabels,
  HeatmapItem,
  HeatmapScheme,
  HeatmapSizeBy,
  HeatmapTitleMode,
  HeatmapValueMode,
  MarketHeatmapLabels,
  MarketHeatmapProps,
} from './market-heatmap-types.ts'

// 市场热力图（#15）：照 TradingView 的股票热力图（帮助中心「TradingView heatmaps: from global trends to details」，2026-11-15 读）：
// 格子面积是所选的大小指标（市值、成交额，或等大），颜色是所选的着色指标落在哪一档，按行业分组或平铺；点组名放大到只看这一组，点格子是选中，
// 悬停出这只票的关键读数，底部图例是各档的值边界、点一档就隐藏这一档的格子。
// 跨市场共用件：A 股、港股、美股、加密都用它，只换数据与分组；不认数据集，品种、指标、文字、数字写法都由调用方传。
// 排布用包里矩形树图的 layoutTreemap（d3 squarify），着色档用它的 colorStep；格子里的徽标用 SymbolMark，工具条是分段控件，数量缩写用 formatVolume。
// 样子（用户 2026-11-15 的校准）：底是 TradingView 的手感加 Arc 的卡片结构：顶上一行汇总读数，再是工具条，不加工业装饰；放在 PanelFrame 里用。
// 文件拆分（G5）：类型 market-heatmap-types、工具条 -toolbar、一格 -cell、悬停卡片 -card、图例 -legend、副作用钩子 -hooks；这里留状态、排布与键盘。

/** 组头的高（像素）。 */
const HEAD_H = 22

export function MarketHeatmap({
  items: rawItems,
  sizeBy,
  colorBy,
  labels,
  defaultSizeBy,
  defaultColorBy,
  defaultGrouped = true,
  scheme = 'classic',
  formatPrice: priceText = (value) => formatPrice(value, { precision: 2 }),
  selected = null,
  onSelect,
  cellActions,
  toolbar = 'dropdowns',
  datasets,
  dataset,
  onDatasetChange,
  onOpenInScreener,
  className,
}: MarketHeatmapProps) {
  // 旧名 code 映射到 symbol（@deprecated，留一个版本）。
  const items = useMemo<HeatmapEntry[]>(
    () => rawItems.map((item) => (item.symbol !== undefined ? item : { ...item, symbol: item.code })) as HeatmapEntry[],
    [rawItems],
  )
  const uid = useId()
  const figure = useRef<HTMLElement>(null)
  const plot = useRef<HTMLDivElement>(null)
  const [sizeKey, setSizeKey] = useState(defaultSizeBy ?? sizeBy[0]?.key ?? '')
  const [colorKey, setColorKey] = useState(defaultColorBy ?? colorBy[0]?.key ?? '')
  const [grouped, setGrouped] = useState(defaultGrouped)
  const [drill, setDrill] = useState<string | null>(null)
  const [showLogo, setShowLogo] = useState(true)
  const [titleMode, setTitleMode] = useState<HeatmapTitleMode>('code')
  const [valueMode, setValueMode] = useState<HeatmapValueMode>('change')
  const [hiddenSteps, setHiddenSteps] = useState<ReadonlySet<number>>(new Set())
  const [hover, setHover] = useState<Hover | null>(null)
  const [hoverGroup, setHoverGroup] = useState<string | null>(null)
  const [previewStep, setPreviewStep] = useState<number | null>(null)
  const [rove, setRove] = useState<Record<string, string>>({})

  useDrillFocus(figure, drill)

  const size = sizeBy.find((option) => option.key === sizeKey) ?? sizeBy[0]
  const color = colorBy.find((option) => option.key === colorKey) ?? colorBy[0]
  const hasGroups = items.some((item) => item.group !== undefined)
  const showGroups = hasGroups && grouped

  const box = usePlotBox(plot)

  const values = useMemo(() => items.map((item) => (color ? item.value[color.key] : null)), [items, color])
  const unit = color?.step ?? niceUnit(values)

  const blocks = useMemo<TreemapBlock<HeatmapEntry>[]>(() => {
    if (!size) return []
    const inGroup = drill === null ? items : items.filter((item) => (item.group ?? labels.other) === drill)
    const layoutItems = inGroup.map((item) => ({
      data: item,
      size: size.equal ? 1 : (item.size[size.key] ?? 0),
      group: item.group ?? labels.other,
    }))
    return layoutTreemap(layoutItems, showGroups && drill === null, {
      width: box.width,
      height: box.height,
      head: HEAD_H,
    })
  }, [items, size, drill, showGroups, labels.other, box])

  useInkContrast(figure, scheme)

  const all = useMemo(() => blocks.flatMap((block) => block.cells), [blocks])
  useCellFlip(plot, all, box, drill)
  const flashing = useTurnFlash(items, color)

  const stepFor = useCallback(
    (item: HeatmapEntry) => (color ? stepOf(item.value[color.key], unit) : null),
    [color, unit],
  )
  const hiddenOf = (item: HeatmapEntry) => {
    const step = stepFor(item)
    return step !== null && hiddenSteps.has(step)
  }

  const summary = useMemo(() => {
    let up = 0
    let down = 0
    for (const cell of all) {
      const v = color ? cell.data.value[color.key] : null
      if (typeof v !== 'number') continue
      if (v > 0) up += 1
      else if (v < 0) down += 1
    }
    return { count: all.length, up, down }
  }, [all, color])

  if (!size || !color || all.length === 0) {
    return (
      <div className={cn('k-mheat', className)} data-slot="market-heatmap" role="status">
        <p className="k-mheat-empty">{labels.empty}</p>
      </div>
    )
  }

  const move = (event: KeyboardEvent<HTMLElement>, block: TreemapBlock<HeatmapEntry>, code: string) => {
    const keys: Record<string, Direction> = {
      ArrowLeft: 'left',
      ArrowRight: 'right',
      ArrowUp: 'up',
      ArrowDown: 'down',
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onSelect?.(code)
      return
    }
    const direction = keys[event.key]
    if (!direction) return
    event.preventDefault()
    const boxes = block.cells
      .filter((cell) => !hiddenOf(cell.data))
      .map((cell) => ({ ...cell, code: cell.data.symbol }))
    const next = neighbour(boxes, code, direction)
    if (next)
      plot.current?.querySelector<HTMLElement>(`[data-slot="heatmap-cell"][data-code="${CSS.escape(next)}"]`)?.focus()
  }

  // 卡片跟着鼠标：在格子上换内容、位置由 CSS 的弹簧过渡跟过去；在缝隙上只动位置；在组头上与离开面板才收起。
  const trackPointer = (event: PointerEvent<HTMLElement>) => {
    const rect = plot.current?.getBoundingClientRect()
    if (!rect) return
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    const target = event.target as HTMLElement
    const code = target.closest<HTMLElement>('[data-slot="heatmap-cell"]')?.dataset.code
    if (code) setHover((old) => ({ code, x, y, open: true, snap: !old?.open }))
    else if (target.closest('[data-slot="heatmap-group"]')) setHover((old) => (old ? { ...old, open: false } : old))
    else setHover((old) => (old?.open ? { ...old, x, y, snap: false } : old))
  }

  const hovered = hover ? all.find((cell) => cell.data.symbol === hover.code)?.data : undefined

  return (
    <figure
      ref={figure}
      className={cn('k-mheat', className)}
      data-slot="market-heatmap"
      data-scheme={scheme}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && drill !== null) setDrill(null)
      }}
    >
      <div className="k-mheat-summary">
        <dl className="k-mheat-reads" data-slot="heatmap-summary">
          {[
            [labels.summary.count, summary.count, ''],
            [labels.summary.up, summary.up, 'is-up'],
            [labels.summary.down, summary.down, 'is-down'],
          ].map(([name, value, tone]) => (
            <div key={name} className="k-mheat-read">
              <dt>{name}</dt>
              <dd className={String(tone)}>{value}</dd>
            </div>
          ))}
        </dl>
        {showGroups && drill !== null ? (
          <nav className="k-mheat-crumb" data-slot="heatmap-crumb" aria-label={labels.group}>
            <button type="button" onClick={() => setDrill(null)}>
              {labels.all}
            </button>
            <span aria-hidden="true">›</span>
            <span aria-current="page">{drill}</span>
          </nav>
        ) : null}
      </div>
      <HeatmapToolbar
        labels={labels}
        sizeBy={sizeBy}
        colorBy={colorBy}
        size={size}
        color={color}
        onSizeKey={setSizeKey}
        onColorKey={(next) => {
          setColorKey(next)
          setHiddenSteps(new Set())
        }}
        hasGroups={hasGroups}
        grouped={grouped}
        onGrouped={(next) => {
          setGrouped(next)
          setDrill(null)
        }}
        onFullscreen={() => {
          const root = figure.current
          if (!root) return
          if (document.fullscreenElement === root) void document.exitFullscreen()
          else void root.requestFullscreen?.()
        }}
        showLogo={showLogo}
        setShowLogo={setShowLogo}
        titleMode={titleMode}
        setTitleMode={setTitleMode}
        valueMode={valueMode}
        setValueMode={setValueMode}
        toolbar={toolbar}
        datasets={datasets}
        dataset={dataset}
        onDatasetChange={onDatasetChange}
        onOpenInScreener={onOpenInScreener}
      />
      <RowContextMenu
        actionsFor={
          cellActions
            ? (code) => {
                const item = items.find((entry) => entry.symbol === code)
                return item ? cellActions(item) : []
              }
            : undefined
        }
        label={labels.cellMenu ?? 'Cell menu'}
      >
        <div
          className="k-mheat-plot"
          ref={plot}
          role="group"
          aria-label={labels.list}
          onPointerMove={trackPointer}
          onPointerLeave={() => {
            setHover((old) => (old ? { ...old, open: false } : old))
            setHoverGroup(null)
          }}
        >
          {blocks.map((block) => {
            const visible = block.cells.filter((cell) => !hiddenOf(cell.data))
            const tabbable =
              visible.find((cell) => cell.data.symbol === rove[block.name])?.data.symbol ?? visible[0]?.data.symbol
            const headingId = `${uid}-${block.name}`
            // 组头右边的平均涨跌：这一组着色指标的简单平均（没有数的格子不算）。
            const nums = block.cells.flatMap((cell) => {
              const v = cell.data.value[color.key]
              return typeof v === 'number' && Number.isFinite(v) ? [v] : []
            })
            const mean = nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : null
            return (
              <div
                key={block.name}
                className="k-mheat-group"
                data-slot="heatmap-group-block"
                role="group"
                aria-labelledby={block.name ? headingId : undefined}
              >
                {showGroups && drill === null ? (
                  <button
                    type="button"
                    id={headingId}
                    className="k-mheat-head"
                    data-slot="heatmap-group"
                    data-group={block.name}
                    style={{ left: block.x0, top: block.y0, width: block.x1 - block.x0, height: HEAD_H }}
                    onPointerEnter={() => setHoverGroup(block.name)}
                    onPointerLeave={() => setHoverGroup(null)}
                    onFocus={() => setHoverGroup(block.name)}
                    onBlur={() => setHoverGroup(null)}
                    onClick={() => {
                      setDrill(block.name)
                      setHover(null)
                      setHoverGroup(null)
                    }}
                  >
                    <span className="k-mheat-head-name">{block.name}</span>
                    {mean === null ? null : (
                      <span
                        className={cn('k-mheat-head-avg', mean > 0 && 'is-up', mean < 0 && 'is-down')}
                        data-slot="heatmap-group-avg"
                      >
                        {formatMetric(mean, color)}
                      </span>
                    )}
                  </button>
                ) : null}
                {showGroups && drill === null && hoverGroup === block.name ? (
                  <span
                    className="k-mheat-ring"
                    data-slot="heatmap-group-ring"
                    style={{ left: block.x0, top: block.y0, width: block.x1 - block.x0, height: block.y1 - block.y0 }}
                  />
                ) : null}
                {block.cells.map((cell) => {
                  const item = cell.data
                  const step = stepFor(item)
                  return (
                    <HeatmapCell
                      key={item.symbol}
                      cell={cell}
                      size={size}
                      color={color}
                      step={step}
                      hidden={hiddenOf(item)}
                      tabbable={item.symbol === tabbable}
                      selected={item.symbol === selected}
                      flash={flashing.get(item.symbol)}
                      dim={
                        previewStep !== null && step !== previewStep
                          ? 'legend'
                          : hoverGroup !== null && hoverGroup !== block.name
                            ? 'group'
                            : undefined
                      }
                      showLogo={showLogo}
                      titleMode={titleMode}
                      valueMode={valueMode}
                      priceText={priceText}
                      onSelect={onSelect}
                      onKeyDown={(event) => move(event, block, item.symbol)}
                      onFocus={(event) => {
                        setRove((old) => ({ ...old, [block.name]: item.symbol }))
                        const rect = plot.current?.getBoundingClientRect()
                        const own = event.currentTarget.getBoundingClientRect()
                        if (rect)
                          setHover({
                            code: item.symbol,
                            x: own.right - rect.left - 24,
                            y: own.top - rect.top + 8,
                            open: true,
                            snap: true,
                          })
                      }}
                      onBlur={() => setHover((old) => (old ? { ...old, open: false } : old))}
                    />
                  )
                })}
              </div>
            )
          })}
          {hovered && hover ? (
            <HeatmapCard
              hover={hover}
              hovered={hovered}
              box={box}
              labels={labels}
              colorBy={colorBy}
              color={color}
              size={size}
              showGroups={showGroups}
              priceText={priceText}
            />
          ) : null}
        </div>
      </RowContextMenu>
      <HeatmapLegend
        color={color}
        unit={unit}
        hiddenSteps={hiddenSteps}
        labels={labels}
        onPreview={setPreviewStep}
        onToggle={(step) =>
          setHiddenSteps((old) => {
            const next = new Set(old)
            if (next.has(step)) next.delete(step)
            else next.add(step)
            return next
          })
        }
      />
    </figure>
  )
}
