// SPDX-License-Identifier: MIT
// 品种星系：持仓 / 自选 / 筛选结果按行业、市场、因子分位或状态聚成一团团的圆，圆的面积是市值或仓位，颜色是涨跌（七档，跟涨跌配色走）。
// 上面一排切换分组方式，点在团间平滑迁移；悬停一个点读数行写它的详情，点击选中；键盘 Tab 在团间走、方向键在团内走、Enter 选中。
// 功能参照 Arc Customer galaxy（uiarc.dev，2026-11-14 读：账户按套餐或健康度聚成星团、可切换分组），实现原创。
// 点不多时每个点一个 SVG 圆；多时（>= canvasFrom）改画 canvas，团的圈与标签、悬停与选中的标记仍是 SVG（所以键盘与读屏两种画法一样）。
// 文字全由 props 传，包里没有文案。
import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { ChartActions } from '../../quant/chart-kit/chart-actions'
import { ChartTable, type ChartViewProps } from '../../quant/chart-kit/chart-table'
import { divHotThreshold } from '../../quant/chart-kit/series-colors'
import { LcdTooltip, type LcdTooltipRow } from '../../quant/chart-kit/lcd-tooltip'
import { ToggleGroup, ToggleGroupItem } from '../../primitives/toggle-group'
import { galaxyStep, hitNode, layoutGalaxy, stepNode, type GalaxyNode, type GalaxyPlace } from './galaxy-model'

export const GALAXY_W = 800
export const GALAXY_H = 520
const FRAME = { width: GALAXY_W, height: GALAXY_H, pad: 8, headroom: 20 }
/** 迁移动画的时长（毫秒）：与 --dur-snappy 同为 333ms；canvas 里没法用 CSS 过渡，自己插值。 */
const MOVE_MS = 333
const STEPS = [-2, -1, 0, 1, 2]

export type GalaxyGrouping = { id: string; label: string }

export type SymbolGalaxyProps = ChartViewProps & {
  nodes: readonly GalaxyNode[]
  /** 可切换的分组方式；每个点的 groups 里要有这些 id。 */
  groupings: readonly GalaxyGrouping[]
  groupBy?: string
  defaultGroupBy?: string
  onGroupByChange?: (id: string) => void
  /** 整张图的读屏名。 */
  label: string
  /** 分组切换那一排的读屏名，如「分组方式」。 */
  groupingLabel: string
  /** 一个点的整句详情（读数行与键盘读屏）。 */
  describe: (node: GalaxyNode) => string
  /** 一团的读屏名（整句，含个数），如「金融，12 只」。 */
  groupText: (group: string, count: number) => string
  /** 色例每一档写的字（-2 到 +2：±2 只给涨跌幅绝对值在前 20% 的点）。 */
  legendText: (step: number) => string
  /** 悬停时的 LCD 提示：标题与几行「名字 / 数值」；不给就只有读数行。 */
  tooltip?: (node: GalaxyNode) => { title: ReactNode; rows: readonly LcdTooltipRow[] }
  onSelect?: (node: GalaxyNode) => void
  selectedId?: string | null
  /** 点数达到它就改画 canvas。默认 2000（出自 issue #1918 的设想，待测量，测量票 #1923：没有实测的依据）。 */
  canvasFrom?: number
  /** 没有悬停也没有聚焦时读数行写什么。 */
  idle?: ReactNode
  className?: string
}

const ease = (t: number) => 1 - Math.pow(1 - t, 3)

export function SymbolGalaxy({
  nodes,
  groupings,
  groupBy,
  defaultGroupBy,
  onGroupByChange,
  label,
  groupingLabel,
  describe,
  groupText,
  legendText,
  tooltip,
  onSelect,
  selectedId = null,
  canvasFrom = 2000,
  idle,
  className,
  actionLabels,
  tableLabel,
  tableHead,
  onExport,
  onFullscreen,
  source,
}: SymbolGalaxyProps) {
  const [tableView, setTableView] = useState(false)
  const [inner, setInner] = useState(defaultGroupBy ?? groupings[0]?.id ?? '')
  const mode = groupBy ?? inner
  const hotAt = useMemo(() => divHotThreshold(nodes.map((node) => node.change ?? Number.NaN)), [nodes])
  const [scale, setScale] = useState(1)
  const layout = useMemo(
    () => layoutGalaxy(nodes, mode, { ...FRAME, headroom: Math.ceil(FRAME.headroom / scale), scale }),
    [nodes, mode, scale],
  )
  useEffect(() => {
    const el = svg.current
    if (!el) return
    // 量到的宽取到 0.05 一档，免得拖动改宽时每个像素都重排。
    const read = () => {
      const width = el.getBoundingClientRect().width
      if (width > 0) setScale(Math.max(0.3, Math.round((width / GALAXY_W) * 20) / 20))
    }
    read()
    const observer = new ResizeObserver(read)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  const byId = useMemo(() => new Map(nodes.map((node) => [node.id, node])), [nodes])
  const members = useMemo(() => {
    const out = new Map<string, string[]>()
    for (const [id, place] of layout.places) out.set(place.group, [...(out.get(place.group) ?? []), id])
    return out
  }, [layout])
  const canvas = layout.places.size >= canvasFrom
  const [hover, setHover] = useState<string | null>(null)
  const [focusGroup, setFocusGroup] = useState<string | null>(null)
  const [activeIn, setActiveIn] = useState<Record<string, string>>({})
  const svg = useRef<SVGSVGElement>(null)
  const surface = useRef<HTMLCanvasElement>(null)
  const legend = useRef<HTMLOListElement>(null)
  const painted = useRef<Map<string, GalaxyPlace>>(new Map())
  const [theme, setTheme] = useState(0)

  /** 一个团当前聚焦在哪个点：记过的（还在团里）否则团里最大的那个（members 按布局顺序，最大的在前）。 */
  const activeOf = (group: string): string | null => {
    const ids = members.get(group) ?? []
    const kept = activeIn[group]
    return kept && ids.includes(kept) ? kept : (ids[0] ?? null)
  }
  const shown = hover ?? (focusGroup === null ? null : activeOf(focusGroup))
  const shownNode = shown === null ? undefined : byId.get(shown)
  const shownPlace = shown === null ? undefined : layout.places.get(shown)

  const toView = (event: { clientX: number; clientY: number }) => {
    const box = svg.current!.getBoundingClientRect()
    return box.width > 0
      ? {
          x: ((event.clientX - box.left) * GALAXY_W) / box.width,
          y: ((event.clientY - box.top) * GALAXY_H) / box.height,
        }
      : { x: -1, y: -1 }
  }
  const onKey = (group: string) => (event: KeyboardEvent) => {
    const current = activeOf(group)
    if (current === null) return
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      const node = byId.get(current)
      if (node && onSelect) onSelect(node)
      return
    }
    const next = stepNode(layout.places, members.get(group) ?? [], current, event.key)
    if (next === null) return
    event.preventDefault()
    setActiveIn((prev) => ({ ...prev, [group]: next }))
  }

  // 主题或涨跌配色一换，canvas 要重画：色例的色块是从 token 算出来的，监听根元素的属性。
  useEffect(() => {
    const observer = new MutationObserver(() => setTheme((n) => n + 1))
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'data-updown'] })
    return () => observer.disconnect()
  }, [])

  // canvas 画法：从上一次画的位置插值到新位置（迁移动画），之后停住不占帧。
  useEffect(() => {
    const el = surface.current
    if (!canvas || !el) {
      painted.current = new Map()
      return
    }
    const context = el.getContext('2d')
    if (!context) return
    const colors = [...(legend.current?.children ?? [])].map((item) => getComputedStyle(item).backgroundColor)
    const neutral = colors[2] ?? 'gray'
    const from = painted.current
    const to = layout.places
    const start = performance.now()
    let frame = 0
    const paint = (t: number) => {
      const box = el.getBoundingClientRect()
      const ratio = window.devicePixelRatio || 1
      const width = Math.max(1, Math.round(box.width * ratio))
      const height = Math.max(1, Math.round(box.height * ratio))
      if (el.width !== width || el.height !== height) {
        el.width = width
        el.height = height
      }
      context.setTransform(width / GALAXY_W, 0, 0, height / GALAXY_H, 0, 0)
      context.clearRect(0, 0, GALAXY_W, GALAXY_H)
      for (const [id, place] of to) {
        const origin = from.get(id)
        const x = origin ? origin.x + (place.x - origin.x) * t : place.x
        const y = origin ? origin.y + (place.y - origin.y) * t : place.y
        const r = origin ? origin.r + (place.r - origin.r) * t : place.r
        const step = galaxyStep(byId.get(id)?.change, hotAt)
        context.fillStyle = step === null ? neutral : (colors[step + 2] ?? neutral)
        context.beginPath()
        context.arc(x, y, Math.max(0, r), 0, Math.PI * 2)
        context.fill()
      }
    }
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / MOVE_MS)
      paint(ease(t))
      if (t < 1) frame = requestAnimationFrame(tick)
      else painted.current = to
    }
    frame = requestAnimationFrame(tick)
    const resize = new ResizeObserver(() => paint(Math.min(1, ease((performance.now() - start) / MOVE_MS))))
    resize.observe(el)
    return () => {
      cancelAnimationFrame(frame)
      resize.disconnect()
    }
  }, [canvas, layout, byId, hotAt, theme])

  const mark = (id: string | null, kind: string) => {
    const place = id === null ? undefined : layout.places.get(id)
    if (!place) return null
    return (
      <circle
        className={`k-galaxy-mark is-${kind}`}
        style={{ transform: `translate(${place.x}px, ${place.y}px)`, r: place.r + 2 }}
        cx={0}
        cy={0}
      />
    )
  }

  return (
    <figure
      className={`k-galaxy${className ? ` ${className}` : ''}`}
      data-slot="symbol-galaxy"
      data-render={canvas ? 'canvas' : 'svg'}
    >
      <div className="k-galaxy-bar">
        <ToggleGroup
          variant="sm"
          aria-label={groupingLabel}
          value={mode}
          onValueChange={(next) => {
            if (groupBy === undefined) setInner(next)
            onGroupByChange?.(next)
          }}
        >
          {groupings.map((grouping) => (
            <ToggleGroupItem key={grouping.id} value={grouping.id}>
              {grouping.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <ChartActions
          labels={actionLabels}
          tableView={tableView}
          onTableView={setTableView}
          onExport={onExport}
          onFullscreen={onFullscreen}
        />
      </div>
      {tableView && (
        <ChartTable
          slot="galaxy-table"
          label={tableLabel}
          head={tableHead}
          rows={nodes.map((node) => ({ key: node.id, cells: [node.label, node.groups[mode] ?? '', describe(node)] }))}
        />
      )}
      <div className="k-galaxy-plot" hidden={tableView}>
        {canvas && <canvas ref={surface} className="k-galaxy-canvas" aria-hidden="true" />}
        <svg
          ref={svg}
          className="k-galaxy-svg"
          viewBox={`0 0 ${GALAXY_W} ${GALAXY_H}`}
          role="group"
          aria-label={label}
          onPointerMove={(event) => {
            const at = toView(event)
            setHover(hitNode(layout.places, at.x, at.y))
          }}
          onPointerLeave={() => setHover(null)}
          onClick={(event) => {
            const at = toView(event)
            const id = hitNode(layout.places, at.x, at.y)
            const node = id === null ? undefined : byId.get(id)
            if (node && onSelect) onSelect(node)
          }}
        >
          {/* 按传进来的顺序画，不按布局的顺序：布局顺序随分组方式变，key 一重排 DOM 节点就被挪动，挪动过的节点没有过渡。 */}
          {!canvas &&
            nodes.map((node) => {
              const place = layout.places.get(node.id)
              if (!place) return null
              const step = galaxyStep(node.change, hotAt)
              return (
                <circle
                  key={node.id}
                  className={`k-galaxy-node is-step${step === null ? 'na' : step}`}
                  data-id={node.id}
                  data-group={place.group}
                  cx={0}
                  cy={0}
                  style={{ transform: `translate(${place.x}px, ${place.y}px)`, r: place.r }}
                />
              )
            })}
          {layout.groups.map((group) => (
            <g
              key={group.key}
              className="k-galaxy-group"
              data-group={group.key}
              role="group"
              aria-label={groupText(group.key, group.count)}
              tabIndex={0}
              onFocus={() => setFocusGroup(group.key)}
              onBlur={() => setFocusGroup(null)}
              onKeyDown={onKey(group.key)}
            >
              <circle
                className="k-galaxy-ring"
                cx={0}
                cy={0}
                style={{ transform: `translate(${group.x}px, ${group.y}px)`, r: group.r }}
              />
            </g>
          ))}
          {mark(selectedId, 'selected')}
          {mark(focusGroup === null ? null : activeOf(focusGroup), 'active')}
          {mark(hover, 'hover')}
        </svg>
        {/* 团名用 HTML 叠在图上：SVG 里的字跟着 viewBox 缩，图一缩就小得读不了；这里是真实像素的字号。 */}
        {layout.groups.map((group) => (
          <span
            key={group.key}
            className="k-galaxy-name"
            aria-hidden="true"
            data-group-name={group.key}
            style={{
              left: `${((group.label.x0 + group.label.x1) / 2 / GALAXY_W) * 100}%`,
              top: `${((group.label.y0 + group.label.y1) / 2 / GALAXY_H) * 100}%`,
            }}
          >
            {group.key}
          </span>
        ))}
        {shownNode && tooltip && shownPlace && (
          <div className="k-galaxy-tip" aria-hidden="true">
            <LcdTooltip
              {...tooltip(shownNode)}
              side={shownPlace.x > GALAXY_W * 0.6 ? 'left' : 'right'}
              style={{ left: `${(shownPlace.x / GALAXY_W) * 100}%`, top: `${(shownPlace.y / GALAXY_H) * 100}%` }}
            />
          </div>
        )}
      </div>
      <ol ref={legend} className="k-galaxy-legend" aria-hidden="true" hidden={tableView}>
        {STEPS.map((step) => (
          <li key={step} className={`is-step${step}`}>
            {legendText(step)}
          </li>
        ))}
      </ol>
      <output className="k-galaxy-readout" hidden={tableView}>
        {shownNode ? describe(shownNode) : idle}
      </output>
      {source === undefined ? null : <p className="k-dist-source">{source}</p>}
    </figure>
  )
}
