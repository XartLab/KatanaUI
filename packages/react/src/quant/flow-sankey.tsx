// SPDX-License-Identifier: MIT
import { useId, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react'
import { ChartActions } from './chart-kit/chart-actions.tsx'
import { ChartTable, type ChartViewProps } from './chart-kit/chart-table.tsx'
import { LcdTooltip, type LcdTooltipRow } from './chart-kit/lcd-tooltip.tsx'
import {
  layoutFlow,
  linkEnds,
  moveNode,
  neighborhood,
  type FlowLink,
  type FlowNode,
  type LaidLink,
  type LaidNode,
} from './flow-sankey-model.ts'

// 资金流向桑基图：来源 → 通道 → 用途 → 受益方，节点与流量由调用方给。照 issue #45 的需求做（没有读到可对照的参照产品页面，待核对）：悬停出金额与占比，点节点高亮上下游，「交易流量」与「价格重估」分开画（重估用斜纹，不混进流量，也不进占比）。
// 排布用 d3-sankey（BSD-3-Clause），见 flow-sankey-model.ts。颜色：链路与节点全是中性灰，不用橙与蓝；节点想着色由调用方给 color。
// 交互：悬停节点或链路出 LCD 读数；点节点（或聚焦后 Enter / 空格）钉住它的上下游高亮，再点或 Esc 取消；
// 键盘：Tab 进图落在一个节点，↑↓ 同一列里换，←→ 去连着的上一列 / 下一列，Home / End 到头尾。文字全由 props 传。

const W = 960
const HEAD = 22

export type FlowSankeyLabels = {
  /** 整张图的读屏名。 */
  chart: string
  /** 「交易流量」「价格重估」两种链路的名字（图例、读数、表格）。 */
  flow: string
  revaluation: string
  /** 「显示价格重估」开关的字。 */
  showRevaluation: string
  /** 读数里的行名。 */
  amount: string
  shareOfSource: string
  shareOfTotal: string
  inflow: string
  outflow: string
  revalIn: string
  revalOut: string
  /** 没有可画的链路时写的字；有环时写的字。 */
  empty: string
  cycle: string
}

export type FlowSankeyProps = ChartViewProps & {
  nodes: readonly FlowNode[]
  links: readonly FlowLink[]
  labels: FlowSankeyLabels
  /** 每一列顶上的标题（来源、通道、用途、受益方……）；不给不画。 */
  columnLabels?: readonly string[]
  /** 金额写成什么（含单位）。 */
  formatValue?: (value: number) => string
  /** 占比（0.25）写成什么。 */
  formatShare?: (ratio: number) => string
  /** 图高（viewBox 单位，宽固定 960，整体随容器缩放）。 */
  height?: number
  className?: string
  /** 页脚小字，例「演示数据」。 */
  badge?: ReactNode
}

const defaultShare = (ratio: number) => `${(ratio * 100).toFixed(1)}%`

export function FlowSankey({
  nodes,
  links,
  labels,
  columnLabels,
  formatValue = String,
  formatShare = defaultShare,
  height = 420,
  className,
  badge,
  actionLabels,
  tableLabel,
  tableHead,
  source,
  onExport,
  onFullscreen,
}: FlowSankeyProps) {
  const pattern = useId().replace(/:/g, '')
  const stage = useRef<HTMLDivElement>(null)
  const refs = useRef(new Map<string, SVGRectElement>())
  const [tableView, setTableView] = useState(false)
  const [showReval, setShowReval] = useState(true)
  const [hover, setHover] = useState<{ kind: 'node' | 'link'; id: string } | null>(null)
  const [pinned, setPinned] = useState<string | null>(null)
  const [anchor, setAnchor] = useState<{ x: number; y: number; left: boolean; above: boolean | null } | null>(null)
  const [tab, setTab] = useState<string | null>(null)
  const hasReval = links.some((link) => link.kind === 'revaluation' && link.value > 0)
  const laid = layoutFlow(nodes, links, {
    width: W,
    height,
    top: columnLabels === undefined ? 4 : HEAD,
    bottom: 4,
    showRevaluation: showReval,
  })

  if (!laid.ok)
    return (
      <figure className={`k-fsk${className ? ` ${className}` : ''}`} data-slot="flow-sankey" data-empty="true">
        <p className="k-fsk-empty">{laid.reason === 'cycle' ? labels.cycle : labels.empty}</p>
      </figure>
    )

  const byId = new Map(laid.nodes.map((node) => [node.id, node]))
  const linkById = new Map(laid.links.map((link) => [link.id, link]))
  const focus = hover?.kind === 'node' ? hover.id : pinned
  // 亮谁：悬停节点或钉住的节点 → 它的上下游；悬停链路 → 链路与两端；都没有就不压暗别的。
  const lit =
    hover?.kind === 'link' && linkById.has(hover.id)
      ? linkEnds(linkById.get(hover.id)!)
      : focus !== null && byId.has(focus)
        ? neighborhood(laid.links, focus)
        : null
  const stop = tab !== null && byId.has(tab) ? tab : (laid.nodes[0]?.id ?? '')

  const place = (event: PointerEvent) => {
    const box = stage.current?.getBoundingClientRect()
    if (box) {
      const x = event.clientX - box.left
      setAnchor({ x, y: event.clientY - box.top, left: x > box.width / 2, above: null })
    }
  }
  // 节点的读数放在节点上方（上面放不下放下方），横向贴着节点：标签在节点正右或正左、纵向居中，读数不压它。
  const placeNode = (id: string) => {
    const box = stage.current?.getBoundingClientRect()
    const rect = refs.current.get(id)?.getBoundingClientRect()
    if (!box || !rect) return
    const left = rect.left - box.left > box.width / 2
    const above = rect.top - box.top > 130
    setAnchor({
      x: left ? rect.right - box.left : rect.left - box.left,
      y: above ? rect.top - box.top : rect.bottom - box.top,
      left,
      above,
    })
  }
  const share = (value: number | null) => (value === null ? '—' : formatShare(value))
  const nodeRows = (node: LaidNode): LcdTooltipRow[] => {
    const rows: LcdTooltipRow[] = []
    if (node.flowIn > 0) rows.push({ key: 'in', label: labels.inflow, value: formatValue(node.flowIn) })
    if (node.flowOut > 0) rows.push({ key: 'out', label: labels.outflow, value: formatValue(node.flowOut) })
    if (node.share !== null) rows.push({ key: 'share', label: labels.shareOfTotal, value: formatShare(node.share) })
    if (showReval && node.revalIn > 0) rows.push({ key: 'ri', label: labels.revalIn, value: formatValue(node.revalIn) })
    if (showReval && node.revalOut > 0)
      rows.push({ key: 'ro', label: labels.revalOut, value: formatValue(node.revalOut) })
    return rows
  }
  const linkRows = (link: LaidLink): LcdTooltipRow[] => [
    { key: 'kind', label: link.kind === 'flow' ? labels.flow : labels.revaluation, value: formatValue(link.value) },
    ...(link.kind === 'flow'
      ? [
          { key: 'src', label: labels.shareOfSource, value: share(link.shareOfSource) },
          { key: 'tot', label: labels.shareOfTotal, value: share(link.shareOfTotal) },
        ]
      : []),
    ...(link.note === undefined ? [] : [{ key: 'note', label: link.note, value: '' }]),
  ]
  const tip =
    anchor === null || hover === null
      ? null
      : hover.kind === 'node'
        ? byId.get(hover.id)
          ? { title: byId.get(hover.id)!.label, rows: nodeRows(byId.get(hover.id)!) }
          : null
        : linkById.get(hover.id)
          ? {
              title: `${byId.get(linkById.get(hover.id)!.source)!.label} → ${byId.get(linkById.get(hover.id)!.target)!.label}`,
              rows: linkRows(linkById.get(hover.id)!),
            }
          : null
  const nameOf = (id: string) => byId.get(id)?.label ?? id

  const move = (event: KeyboardEvent, id: string) => {
    if (event.key === 'Escape') {
      if (pinned !== null) {
        event.preventDefault()
        setPinned(null)
      }
      return
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      setPinned(pinned === id ? null : id)
      return
    }
    const next = moveNode(laid.nodes, laid.links, id, event.key)
    if (next === null) return
    event.preventDefault()
    setTab(next)
    refs.current.get(next)?.focus()
  }
  const heads = new Map<number, { x: number; anchor: 'start' | 'middle' | 'end' }>()
  for (const node of laid.nodes)
    if (!heads.has(node.layer))
      heads.set(
        node.layer,
        node.layer === 0
          ? { x: node.x0, anchor: 'start' }
          : node.layer === laid.columns - 1
            ? { x: node.x1, anchor: 'end' }
            : { x: (node.x0 + node.x1) / 2, anchor: 'middle' },
      )

  return (
    <figure className={`k-fsk${className ? ` ${className}` : ''}`} data-slot="flow-sankey">
      <div className="k-dist-bar">
        {hasReval && (
          <button
            type="button"
            className="k-fsk-toggle"
            aria-pressed={showReval}
            onClick={() => setShowReval(!showReval)}
          >
            <i aria-hidden="true" />
            {labels.showRevaluation}
          </button>
        )}
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
          slot="flow-sankey-table"
          numeric={[2, 3, 4]}
          label={tableLabel}
          head={tableHead}
          rows={laid.links.map((link) => ({
            key: link.id,
            cells: [
              `${nameOf(link.source)} → ${nameOf(link.target)}`,
              link.kind === 'flow' ? labels.flow : labels.revaluation,
              formatValue(link.value),
              share(link.shareOfSource),
              share(link.shareOfTotal),
            ],
          }))}
        />
      )}
      <div
        ref={stage}
        className="k-fsk-stage"
        hidden={tableView}
        onPointerLeave={() => {
          setHover(null)
          setAnchor(null)
        }}
      >
        <svg
          className="k-fsk-svg"
          viewBox={`0 0 ${W} ${height}`}
          role="group"
          aria-label={labels.chart}
          onClick={(event) => {
            if (event.target === event.currentTarget) setPinned(null)
          }}
        >
          <defs>
            <pattern id={pattern} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="6" style={{ stroke: 'var(--ink-200)', strokeWidth: 2 }} />
            </pattern>
          </defs>
          {columnLabels !== undefined &&
            [...heads].map(([layer, head]) => (
              <text key={layer} className="k-fsk-head" x={head.x} y={12} textAnchor={head.anchor}>
                {columnLabels[layer] ?? ''}
              </text>
            ))}
          <g className="k-fsk-links">
            {laid.links.map((link) => (
              <path
                key={link.id}
                className="k-fsk-link"
                data-slot="flow-link"
                data-id={link.id}
                data-kind={link.kind}
                data-lit={lit?.links.has(link.id) ? '' : undefined}
                data-dim={lit !== null && !lit.links.has(link.id) ? '' : undefined}
                d={link.d}
                style={{
                  strokeWidth: Math.max(1, link.width),
                  ...(link.kind === 'revaluation' ? { stroke: `url(#${pattern})` } : null),
                }}
                onPointerEnter={(event) => {
                  setHover({ kind: 'link', id: link.id })
                  place(event)
                }}
                onPointerMove={place}
              />
            ))}
          </g>
          <g className="k-fsk-nodes">
            {laid.nodes.map((node) => {
              const onRight = node.x0 > W / 2
              const amount = Math.max(node.flowIn, node.flowOut)
              return (
                <g key={node.id} className="k-fsk-node" data-slot="flow-node" data-id={node.id}>
                  <rect
                    ref={(element) => {
                      if (element) refs.current.set(node.id, element)
                      else refs.current.delete(node.id)
                    }}
                    className="k-fsk-rect"
                    data-pinned={pinned === node.id ? '' : undefined}
                    data-lit={lit?.nodes.has(node.id) ? '' : undefined}
                    data-dim={lit !== null && !lit.nodes.has(node.id) ? '' : undefined}
                    x={node.x0}
                    y={node.y0}
                    width={node.x1 - node.x0}
                    height={Math.max(1, node.y1 - node.y0)}
                    style={node.color === undefined ? undefined : { fill: node.color }}
                    role="button"
                    aria-pressed={pinned === node.id}
                    aria-label={[
                      node.label,
                      ...(node.flowIn > 0 ? [`${labels.inflow} ${formatValue(node.flowIn)}`] : []),
                      ...(node.flowOut > 0 ? [`${labels.outflow} ${formatValue(node.flowOut)}`] : []),
                    ].join(', ')}
                    tabIndex={stop === node.id ? 0 : -1}
                    onPointerEnter={() => {
                      setHover({ kind: 'node', id: node.id })
                      placeNode(node.id)
                    }}
                    onClick={() => setPinned(pinned === node.id ? null : node.id)}
                    onFocus={() => {
                      setTab(node.id)
                      setHover({ kind: 'node', id: node.id })
                      placeNode(node.id)
                    }}
                    onBlur={() => {
                      setHover(null)
                      setAnchor(null)
                    }}
                    onKeyDown={(event) => move(event, node.id)}
                  />
                  <text
                    className="k-fsk-label"
                    data-dim={lit !== null && !lit.nodes.has(node.id) ? '' : undefined}
                    x={onRight ? node.x0 - 6 : node.x1 + 6}
                    y={(node.y0 + node.y1) / 2}
                    dy="0.35em"
                    textAnchor={onRight ? 'end' : 'start'}
                  >
                    {node.label}
                    <tspan className="k-fsk-amount" dx="6">
                      {formatValue(amount)}
                    </tspan>
                  </text>
                </g>
              )
            })}
          </g>
        </svg>
        {tip !== null && anchor !== null && (
          <LcdTooltip
            className="k-fsk-tip"
            style={{
              left: anchor.x,
              top: anchor.y,
              transform:
                anchor.above === null
                  ? undefined
                  : `translate(${anchor.left ? '-100%' : '0'}, ${anchor.above ? 'calc(-100% - 8px)' : '8px'})`,
            }}
            side={anchor.left ? 'left' : 'right'}
            title={tip.title}
            rows={tip.rows}
          />
        )}
      </div>
      <div className="k-fsk-legend" data-slot="flow-legend" hidden={tableView}>
        <span className="k-fsk-key" data-kind="flow">
          <i aria-hidden="true" />
          {labels.flow}
        </span>
        {hasReval && showReval && (
          <span className="k-fsk-key" data-kind="revaluation">
            <i aria-hidden="true" />
            {labels.revaluation}
          </span>
        )}
        {badge === undefined ? null : <span className="k-fsk-badge">{badge}</span>}
      </div>
      {source === undefined ? null : <p className="k-dist-source">{source}</p>}
    </figure>
  )
}
