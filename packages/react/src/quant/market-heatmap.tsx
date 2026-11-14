// SPDX-License-Identifier: MIT
import {
  useCallback,
  useId,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
} from 'react'
import { cn } from '../lib/cn.ts'
import { SymbolMark } from '../katana/symbol-mark.tsx'
import { layoutTreemap, type TreemapBlock } from '../katana/treemap-model.ts'
import { ToggleGroup, ToggleGroupItem } from '../primitives/toggle-group.tsx'
import { formatPrice, formatVolume } from './format/index.ts'
import {
  formatLegend,
  formatMetric,
  formatRange,
  HEAT_STEPS,
  neighbour,
  niceUnit,
  stepCenter,
  stepOf,
  type Direction,
  type HeatStep,
} from './market-heatmap-model.ts'

// 市场热力图（#15）：照 TradingView 的股票热力图（帮助中心「TradingView heatmaps: from global trends to details」，2026-11-15 读）：
// 格子面积是所选的大小指标（市值、成交额，或等大），颜色是所选的着色指标落在哪一档，按行业分组或平铺；点组名放大到只看这一组，点格子是选中，
// 悬停出这只票的关键读数，底部图例是各档的值边界、点一档就隐藏这一档的格子。
// 跨市场共用件：A 股、港股、美股、加密都用它，只换数据与分组；不认数据集，品种、指标、文字、数字写法都由调用方传。
// 排布用包里矩形树图的 layoutTreemap（d3 squarify），着色档用它的 colorStep；格子里的徽标用 SymbolMark，工具条是分段控件，数量缩写用 formatVolume。
// 样子（用户 2026-11-15 的校准）：底是 TradingView 的手感加 Arc 的卡片结构：顶上一行汇总读数，再是工具条，不加工业装饰；放在 PanelFrame 里用。

export type HeatmapItem = {
  code: string
  name: string
  /** 分组（行业）；不给的归到 labels.other。 */
  group?: string
  /** 品种徽标的图片地址；不给就画字母圆标。 */
  logo?: string
  price?: number
  /** 各个大小指标的值，键是 HeatmapSizeBy.key。不是正数的格子不画。 */
  size: Record<string, number>
  /** 各个着色指标的值，键是 HeatmapColorBy.key。null 是没有数（画中性灰）。 */
  value: Record<string, number | null>
}

export type HeatmapSizeBy = {
  key: string
  label: string
  /** 等大：每格一样大，不读 size。 */
  equal?: boolean
  /** 大小写成什么样；不给用 formatVolume（835.49 K、2.95 M、7.29 B）。 */
  format?: (value: number) => string
}

export type HeatmapColorBy = {
  key: string
  label: string
  /** 单位，接在数后面（「%」）。 */
  unit?: string
  /** 小数位，默认 2。 */
  digits?: number
  /** 整个写法自己定（覆盖 unit 与 digits）。 */
  format?: (value: number) => string
  /** 一档的宽（指标的单位）。不给就按这批值的最大绝对值自动取好数（载入或切指标时重算）；固定写成 1 就是 TradingView 的 ±3%。 */
  step?: number
}

export type HeatmapScheme = 'classic' | 'mono'

export type MarketHeatmapLabels = {
  sizeBy: string
  colorBy: string
  view: string
  grouped: string
  flat: string
  /** 面包屑的根（放大前是「全部」）。 */
  all: string
  /** 没有分组的品种归到这个名字下。 */
  other: string
  price: string
  group: string
  /** 顶上汇总读数的名字：只数、上涨、下跌。 */
  summary: { count: string; up: string; down: string }
  /** 图例一档的读屏名，range 是写好的值边界，例「隐藏 -2.5% ~ -1.5% 的格子」。 */
  segment: (range: string) => string
  /** 整张图的读屏名。 */
  list: string
  empty: string
}

export type MarketHeatmapProps = {
  items: readonly HeatmapItem[]
  sizeBy: readonly HeatmapSizeBy[]
  colorBy: readonly HeatmapColorBy[]
  labels: MarketHeatmapLabels
  defaultSizeBy?: string
  defaultColorBy?: string
  /** 一开始分不分组（有分组数据时）；默认分组。 */
  defaultGrouped?: boolean
  /** 配色：classic 涨跌色（跟 data-updown）、mono 单色灰阶。色盲友好第二步做。 */
  scheme?: HeatmapScheme
  /** 价格怎么写；不给按 2 位小数。 */
  formatPrice?: (value: number) => string
  selected?: string | null
  onSelect?: (code: string) => void
  className?: string
}

/** 格子多小就不写字（像素）：宽要放得下整个代码（每个字约 7.4，两边内距共 10；12px 半粗体量的），不然画出来是被截断的半截代码；再加一行读数要更高。 */
const MIN_CODE_W = 40
const CODE_CHAR_W = 7.4
const CODE_PAD_W = 10
const MIN_CODE_H = 24
const MIN_VALUE_H = 40
const HEAD_H = 22
const CARD_W = 200
/** 悬停卡片的高（估算）：标题与内距 67，每行 18；只用来别让卡片伸出图的下沿。 */
const CARD_BASE_H = 67
const CARD_ROW_H = 18

type Hover = { code: string; x: number; y: number }

/** 底色的相对亮度（WCAG），画一个 1 像素的画布把任何写法的颜色（color-mix 解出来的也行）读成 sRGB。 */
function luminanceOf(css: string): number | null {
  const ctx = document.createElement('canvas').getContext('2d', { willReadFrequently: true })
  if (!ctx) return null
  ctx.canvas.width = ctx.canvas.height = 1
  ctx.clearRect(0, 0, 1, 1)
  ctx.fillStyle = css
  ctx.fillRect(0, 0, 1, 1)
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data
  const lin = (c: number) => (c / 255 <= 0.04045 ? c / 255 / 12.92 : ((c / 255 + 0.055) / 1.055) ** 2.4)
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

export function MarketHeatmap({
  items,
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
  className,
}: MarketHeatmapProps) {
  const uid = useId()
  const figure = useRef<HTMLElement>(null)
  const plot = useRef<HTMLDivElement>(null)
  const [sizeKey, setSizeKey] = useState(defaultSizeBy ?? sizeBy[0]?.key ?? '')
  const [colorKey, setColorKey] = useState(defaultColorBy ?? colorBy[0]?.key ?? '')
  const [grouped, setGrouped] = useState(defaultGrouped)
  const [drill, setDrill] = useState<string | null>(null)
  const [hiddenSteps, setHiddenSteps] = useState<ReadonlySet<number>>(new Set())
  const [hover, setHover] = useState<Hover | null>(null)
  const [rove, setRove] = useState<Record<string, string>>({})
  const [box, setBox] = useState({ width: 1000, height: 600 })

  const left = useRef<string | null>(null)

  // 放大与返回时焦点跟着走：点组名后组名按钮没了，焦点放到面包屑的「全部」；返回后回到刚才那个组名。Esc 才收得到。
  useEffect(() => {
    const root = figure.current
    if (!root) return
    if (drill !== null) {
      left.current = drill
      root.querySelector<HTMLElement>('[data-slot="heatmap-crumb"] button')?.focus()
    } else if (left.current !== null) {
      const name = left.current
      left.current = null
      ;[...root.querySelectorAll<HTMLElement>('[data-slot="heatmap-group"]')]
        .find((el) => el.textContent === name)
        ?.focus()
    }
  }, [drill])

  const size = sizeBy.find((option) => option.key === sizeKey) ?? sizeBy[0]
  const color = colorBy.find((option) => option.key === colorKey) ?? colorBy[0]
  const hasGroups = items.some((item) => item.group !== undefined)
  const showGroups = hasGroups && grouped

  // 按真实像素排布：这样「格子够不够大」就是像素说了算。
  useLayoutEffect(() => {
    const el = plot.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const read = () => {
      const { width, height } = el.getBoundingClientRect()
      if (width > 0 && height > 0)
        setBox((old) => (old.width === width && old.height === height ? old : { width, height }))
    }
    read()
    const observer = new ResizeObserver(read)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const values = useMemo(() => items.map((item) => (color ? item.value[color.key] : null)), [items, color])
  const unit = color?.step ?? niceUnit(values)

  const blocks = useMemo<TreemapBlock<HeatmapItem>[]>(() => {
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

  // 字色按底色亮度现算黑白：读图例七块色的真实底色，在 bg-000（深字）与 ink-100（浅字）里挑对比度高的，写成容器上的变量 --mheat-ink-0…6；
  // 换主题、涨跌色互换（根上的 data-theme、data-updown）时重读。
  useLayoutEffect(() => {
    const root = figure.current
    if (!root) return
    const apply = () => {
      const style = getComputedStyle(root)
      const dark = luminanceOf(style.getPropertyValue('--bg-000'))
      const light = luminanceOf(style.getPropertyValue('--ink-100'))
      if (dark === null || light === null) return
      for (const swatch of root.querySelectorAll<HTMLElement>('[data-slot="heatmap-swatch"]')) {
        const base = luminanceOf(getComputedStyle(swatch).backgroundColor)
        if (base === null) continue
        const withDark = (base + 0.05) / (dark + 0.05)
        const withLight = (light + 0.05) / (base + 0.05)
        root.style.setProperty(
          `--mheat-ink-${Number(swatch.dataset.step) + 3}`,
          withDark > withLight ? 'var(--bg-000)' : 'var(--ink-100)',
        )
      }
    }
    apply()
    const observer = new MutationObserver(apply)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'data-updown'] })
    return () => observer.disconnect()
  }, [scheme])

  const all = useMemo(() => blocks.flatMap((block) => block.cells), [blocks])
  const stepFor = useCallback(
    (item: HeatmapItem) => (color ? stepOf(item.value[color.key], unit) : null),
    [color, unit],
  )
  const hiddenOf = (item: HeatmapItem) => {
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

  const move = (event: KeyboardEvent<HTMLElement>, block: TreemapBlock<HeatmapItem>, code: string) => {
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
    const boxes = block.cells.filter((cell) => !hiddenOf(cell.data)).map((cell) => ({ ...cell, code: cell.data.code }))
    const next = neighbour(boxes, code, direction)
    if (next)
      plot.current?.querySelector<HTMLElement>(`[data-slot="heatmap-cell"][data-code="${CSS.escape(next)}"]`)?.focus()
  }

  const showCard = (code: string, event: PointerEvent<HTMLElement>) => {
    const rect = plot.current?.getBoundingClientRect()
    if (!rect) return
    setHover({ code, x: event.clientX - rect.left, y: event.clientY - rect.top })
  }

  const hovered = hover ? all.find((cell) => cell.data.code === hover.code)?.data : undefined
  const cardLeft = hover ? (hover.x + 14 + CARD_W > box.width ? hover.x - 14 - CARD_W : hover.x + 14) : 0
  const cardRows =
    (hovered?.price === undefined ? 0 : 1) +
    colorBy.length +
    (size.equal ? 0 : 1) +
    (showGroups && hovered?.group ? 1 : 0)
  const cardHeight = CARD_BASE_H + cardRows * CARD_ROW_H
  const cardTop = hover ? Math.max(0, Math.min(hover.y + 14, box.height - cardHeight)) : 0

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
        {showGroups ? (
          <nav className="k-mheat-crumb" data-slot="heatmap-crumb" aria-label={labels.group}>
            {drill === null ? (
              <span aria-current="page">{labels.all}</span>
            ) : (
              <>
                <button type="button" onClick={() => setDrill(null)}>
                  {labels.all}
                </button>
                <span aria-hidden="true">›</span>
                <span aria-current="page">{drill}</span>
              </>
            )}
          </nav>
        ) : null}
      </div>
      <div className="k-mheat-bar" data-slot="heatmap-toolbar">
        <div className="k-mheat-field">
          <span className="k-mheat-field-label">{labels.sizeBy}</span>
          <ToggleGroup variant="sm" aria-label={labels.sizeBy} value={size.key} onValueChange={setSizeKey}>
            {sizeBy.map((option) => (
              <ToggleGroupItem key={option.key} value={option.key}>
                {option.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
        <div className="k-mheat-field">
          <span className="k-mheat-field-label">{labels.colorBy}</span>
          <ToggleGroup
            variant="sm"
            aria-label={labels.colorBy}
            value={color.key}
            onValueChange={(next) => {
              setColorKey(next)
              setHiddenSteps(new Set())
            }}
          >
            {colorBy.map((option) => (
              <ToggleGroupItem key={option.key} value={option.key}>
                {option.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
        {hasGroups ? (
          <div className="k-mheat-field">
            <span className="k-mheat-field-label">{labels.view}</span>
            <ToggleGroup
              variant="sm"
              aria-label={labels.view}
              value={grouped ? 'grouped' : 'flat'}
              onValueChange={(next) => {
                setGrouped(next === 'grouped')
                setDrill(null)
              }}
            >
              <ToggleGroupItem value="grouped">{labels.grouped}</ToggleGroupItem>
              <ToggleGroupItem value="flat">{labels.flat}</ToggleGroupItem>
            </ToggleGroup>
          </div>
        ) : null}
      </div>
      <div
        className="k-mheat-plot"
        ref={plot}
        role="group"
        aria-label={labels.list}
        onPointerLeave={() => setHover(null)}
      >
        {blocks.map((block) => {
          const visible = block.cells.filter((cell) => !hiddenOf(cell.data))
          const tabbable =
            visible.find((cell) => cell.data.code === rove[block.name])?.data.code ?? visible[0]?.data.code
          const headingId = `${uid}-${block.name}`
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
                  style={{ left: block.x0, top: block.y0, width: block.x1 - block.x0, height: HEAD_H }}
                  onClick={() => {
                    setDrill(block.name)
                    setHover(null)
                  }}
                >
                  {block.name}
                </button>
              ) : null}
              {block.cells.map((cell) => {
                const item = cell.data
                const step = stepFor(item)
                const hidden = hiddenOf(item)
                const w = cell.x1 - cell.x0
                const h = cell.y1 - cell.y0
                const showCode =
                  w >= Math.max(MIN_CODE_W, item.code.length * CODE_CHAR_W + CODE_PAD_W) && h >= MIN_CODE_H
                const showValue = showCode && h >= MIN_VALUE_H
                const text = formatMetric(item.value[color.key], color)
                return (
                  <div
                    key={item.code}
                    role="button"
                    tabIndex={hidden ? -1 : item.code === tabbable ? 0 : -1}
                    aria-label={`${item.name} ${item.code} ${text}`}
                    aria-pressed={item.code === selected}
                    aria-hidden={hidden || undefined}
                    className="k-mheat-cell"
                    data-slot="heatmap-cell"
                    data-code={item.code}
                    data-size={size.equal ? 1 : (item.size[size.key] ?? 0)}
                    data-step={step ?? 'na'}
                    data-hidden={hidden || undefined}
                    data-selected={item.code === selected || undefined}
                    data-labelled={showCode}
                    style={{ left: cell.x0, top: cell.y0, width: w, height: h } satisfies CSSProperties}
                    onClick={() => onSelect?.(item.code)}
                    onKeyDown={(event) => move(event, block, item.code)}
                    onPointerMove={(event) => showCard(item.code, event)}
                    onFocus={(event) => {
                      setRove((old) => ({ ...old, [block.name]: item.code }))
                      const rect = plot.current?.getBoundingClientRect()
                      const own = event.currentTarget.getBoundingClientRect()
                      if (rect) setHover({ code: item.code, x: own.right - rect.left - 24, y: own.top - rect.top + 8 })
                    }}
                    onBlur={() => setHover(null)}
                  >
                    {showCode ? (
                      <>
                        <span className="k-mheat-code">{item.code}</span>
                        {showValue ? <span className="k-mheat-value">{text}</span> : null}
                      </>
                    ) : null}
                  </div>
                )
              })}
            </div>
          )
        })}
        {hovered && hover ? (
          <div
            className="k-mheat-card"
            data-slot="heatmap-card"
            role="tooltip"
            style={{ left: cardLeft, top: cardTop, width: CARD_W }}
          >
            <div className="k-mheat-card-title">
              <SymbolMark code={hovered.code} name={hovered.name} src={hovered.logo} size={18} />
              <span className="k-mheat-card-code">{hovered.code}</span>
              <span className="k-mheat-card-name">{hovered.name}</span>
            </div>
            <dl className="k-mheat-card-rows">
              {hovered.price === undefined ? null : (
                <div>
                  <dt>{labels.price}</dt>
                  <dd>{priceText(hovered.price)}</dd>
                </div>
              )}
              {colorBy.map((option) => (
                <div key={option.key} data-active={option.key === color.key || undefined}>
                  <dt>{option.label}</dt>
                  <dd
                    className={cn(
                      (hovered.value[option.key] ?? 0) > 0 && 'is-up',
                      (hovered.value[option.key] ?? 0) < 0 && 'is-down',
                    )}
                  >
                    {formatMetric(hovered.value[option.key], option)}
                  </dd>
                </div>
              ))}
              {size.equal ? null : (
                <div>
                  <dt>{size.label}</dt>
                  <dd>{(size.format ?? formatVolume)(hovered.size[size.key] ?? 0)}</dd>
                </div>
              )}
              {showGroups && hovered.group ? (
                <div>
                  <dt>{labels.group}</dt>
                  <dd>{hovered.group}</dd>
                </div>
              ) : null}
            </dl>
          </div>
        ) : null}
      </div>
      <ol className="k-mheat-legend" data-slot="heatmap-legend" aria-label={color.label}>
        {HEAT_STEPS.map((step: HeatStep) => {
          const off = hiddenSteps.has(step)
          return (
            <li key={step}>
              <button
                type="button"
                aria-pressed={off}
                aria-label={labels.segment(formatRange(step, unit, color))}
                title={formatRange(step, unit, color)}
                className="k-mheat-segment"
                data-slot="heatmap-segment"
                data-step={step}
                onClick={() =>
                  setHiddenSteps((old) => {
                    const next = new Set(old)
                    if (next.has(step)) next.delete(step)
                    else next.add(step)
                    return next
                  })
                }
              >
                <i className="k-mheat-swatch" data-slot="heatmap-swatch" data-step={step} data-off={off || undefined} />
                <span>{formatLegend(stepCenter(step, unit), color)}</span>
              </button>
            </li>
          )
        })}
      </ol>
    </figure>
  )
}
