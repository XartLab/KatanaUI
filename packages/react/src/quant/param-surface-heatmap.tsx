// SPDX-License-Identifier: MIT
// 参数曲面热力图（#120，对照 MultiCharts 的 Strategy Optimization 报告）：两个参数为横纵轴，目标值（净利、Sharpe、回撤……可切）为色，
// 悬停或聚焦一格，右侧读数区列出这一格的全部参数与全部指标；最优格加琥珀环，并算出它邻域的均值、方差与保留率（邻均值 ÷ 最优值），
// 周围一落千丈的「孤峰」一眼能看出来（调用方给 spikeBelow 就加「孤峰」标记，阈值是策略判断，件里不写死）。
// 参数多于两个时选两个当轴，其余固定在切片上（每个旁边一个下拉）。颜色：目标值跨 0 用涨跌发散色（零附近中性灰），否则用暗灰到亮灰的单色阶，越亮越好（goal 为 min 时反过来）。
// 数据（每组参数的各项指标）由调用方给，件不算优化。键盘：Tab 进图，方向键走格，Enter / 空格钉住，Esc 取消。纯逻辑在 param-surface-model.ts。
import { useState, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react'
import { cn } from '../lib/cn.ts'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../primitives/select.tsx'
import { ToggleGroup, ToggleGroupItem } from '../primitives/toggle-group.tsx'
import {
  bestCell,
  gridRange,
  isSpike,
  metricOf,
  moveCell,
  surfaceNeighborhood,
  paramValues,
  resolveSlice,
  sliceGrid,
  type Cell,
  type SurfaceGoal,
  type SurfacePoint,
} from './param-surface-model.ts'
import {
  DIVERGING_GRADIENT,
  SEQUENTIAL_GRADIENT,
  divergingColor,
  divergingShare,
  sequentialColor,
  sequentialInk,
} from './research-color.ts'

export type SurfaceParam = {
  key: string
  name: string
  format?: (value: number) => string
}

export type SurfaceMetric = {
  key: string
  name: string
  format: (value: number) => string
  /** 越大越好还是越小越好：决定最优格与色阶方向。 */
  goal: SurfaceGoal
  /** 方差的写法（量纲是指标的平方）；不给取三位有效数字。 */
  formatSpread?: (value: number) => string
}

export type ParamSurfaceLabels = {
  xAxis: string
  yAxis: string
  /** 目标值（色）那一组开关的读屏名。 */
  metric: string
  /** 切片下拉的读屏名前缀，后面接参数名。 */
  slice: string
  /** 「最优」。 */
  best: string
  /** 「孤峰」。 */
  spike: string
  /** 读数区两块的标题：当前格、最优格的邻域。 */
  cell: string
  neighborhood: string
  neighbors: string
  mean: string
  variance: string
  /** 保留率：邻均值相对最优值。 */
  retention: string
  noValue: string
  /** 没有这组参数（网格里的空洞）。 */
  missing: string
  /** 没有格子可看时读数区写什么。 */
  idle: string
  /** 没有数据时写什么。 */
  empty: string
}

export type ParamSurfaceHeatmapProps = {
  points: readonly SurfacePoint[]
  params: readonly SurfaceParam[]
  metrics: readonly SurfaceMetric[]
  /** 整张图的读屏名。 */
  label: string
  /** 横纵轴的参数 key；不给用内部状态（默认前两个）。 */
  axes?: readonly [string, string]
  onAxesChange?: (axes: [string, string]) => void
  /** 目标值的指标 key；不给用内部状态（默认第一个）。 */
  metric?: string
  onMetricChange?: (metric: string) => void
  /** 其余参数固定在哪；不给用内部状态（默认各取第一个值）。 */
  slice?: Readonly<Record<string, number>>
  onSliceChange?: (slice: Record<string, number>) => void
  /** 邻域半径（格），默认 1（八邻）。 */
  radius?: number
  /** 保留率低于它就标「孤峰」；不给就不判，只显示数。 */
  spikeBelow?: number
  /** 保留率的写法（0.25 → 「25%」）。 */
  formatRatio: (value: number) => string
  labels: ParamSurfaceLabels
  source?: ReactNode
  className?: string
}

/** 一个格子里写数字的列数上限：再多格子太窄，只留颜色，数在读数区。 */
const TEXT_COLUMNS = 14

const spread = (value: number) => String(Number(value.toPrecision(3)))

export function ParamSurfaceHeatmap({
  points,
  params,
  metrics,
  label,
  axes: axesProp,
  onAxesChange,
  metric: metricProp,
  onMetricChange,
  slice: sliceProp,
  onSliceChange,
  radius = 1,
  spikeBelow,
  formatRatio,
  labels,
  source,
  className,
}: ParamSurfaceHeatmapProps) {
  const [axesState, setAxes] = useState<[string, string]>([
    params[0]?.key ?? '',
    params[1]?.key ?? params[0]?.key ?? '',
  ])
  const [metricState, setMetric] = useState(metrics[0]?.key ?? '')
  const [sliceState, setSlice] = useState<Record<string, number>>({})
  const [hot, setHot] = useState<Cell | null>(null)
  const [pinned, setPinned] = useState<Cell | null>(null)
  const [stop, setStop] = useState<Cell>({ xi: 0, yi: 0 })

  const axes = (axesProp ?? axesState) as [string, string]
  const metricKey = metricProp ?? metricState
  const metric = metrics.find((m) => m.key === metricKey) ?? metrics[0]
  const keys = params.map((p) => p.key)
  const slice = resolveSlice(points, keys, axes, sliceProp ?? sliceState)
  const grid = sliceGrid(points, axes, slice)
  const paramOf = (key: string) => params.find((p) => p.key === key)
  const xParam = paramOf(axes[0])
  const yParam = paramOf(axes[1])
  const fmtParam = (key: string, value: number) => (paramOf(key)?.format ?? String)(value)
  const reset = () => {
    setHot(null)
    setPinned(null)
    setStop({ xi: 0, yi: 0 })
  }

  if (!metric || points.length === 0 || grid.xs.length === 0 || grid.ys.length === 0)
    return (
      <figure className={cn('k-ps', className)} data-slot="param-surface-heatmap">
        <p className="k-ps-empty" data-slot="param-surface-empty">
          {labels.empty}
        </p>
      </figure>
    )

  const range = gridRange(grid, metric.key)
  const best = bestCell(grid, metric.key, metric.goal)
  const crossesZero = range !== null && range.min < 0 && range.max > 0
  const limit = range === null ? 0 : Math.max(Math.abs(range.min), Math.abs(range.max))
  const styleOf = (value: number): CSSProperties | undefined => {
    if (range === null) return undefined
    const flip = metric.goal === 'min' ? -1 : 1
    if (crossesZero) return { background: divergingColor(flip * divergingShare(value, limit)) }
    const span = range.max - range.min
    const share = span === 0 ? 0.5 : (value - range.min) / span
    const position = metric.goal === 'min' ? 1 - share : share
    return { background: sequentialColor(position), color: sequentialInk(position) }
  }
  const current = pinned ?? hot ?? best
  const currentPoint = current === null ? null : (grid.cells[current.yi]?.[current.xi] ?? null)
  const bestStable = best === null ? null : surfaceNeighborhood(grid, best, metric.key, metric.goal, radius)
  const nearBest = (cell: Cell) =>
    best !== null &&
    !(cell.xi === best.xi && cell.yi === best.yi) &&
    Math.abs(cell.xi - best.xi) <= radius &&
    Math.abs(cell.yi - best.yi) <= radius
  const showText = grid.xs.length <= TEXT_COLUMNS
  const spiky = bestStable !== null && spikeBelow !== undefined && isSpike(bestStable, spikeBelow)
  const fmtSpread = metric.formatSpread ?? spread
  const bestPoint = best === null ? null : (grid.cells[best.yi]?.[best.xi] ?? null)

  const chooseAxis = (which: 0 | 1, key: string) => {
    // 选到另一根轴正在用的参数时两根轴对调，免得两轴是同一个参数。
    const next: [string, string] = which === 0 ? [key, axes[1]] : [axes[0], key]
    if (next[0] === next[1]) next[which === 0 ? 1 : 0] = axes[which]
    setAxes(next)
    onAxesChange?.(next)
    reset()
  }
  const chooseSlice = (key: string, value: number) => {
    const next = { ...slice, [key]: value }
    setSlice(next)
    onSliceChange?.(next)
    reset()
  }
  const move = (event: KeyboardEvent<HTMLDivElement>) => {
    const target = (event.target as HTMLElement).closest<HTMLElement>('[data-xi]')
    if (!target) return
    const from = { xi: Number(target.dataset.xi), yi: Number(target.dataset.yi) }
    if (event.key === 'Escape') return setPinned(null)
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      return setPinned(pinned?.xi === from.xi && pinned.yi === from.yi ? null : from)
    }
    const next = moveCell(from, event.key, grid.xs.length, grid.ys.length)
    if (next === null) return
    event.preventDefault()
    setStop(next)
    event.currentTarget.querySelector<HTMLElement>(`[data-xi="${next.xi}"][data-yi="${next.yi}"]`)?.focus()
  }

  const paramSelect = (which: 0 | 1, name: string) => (
    <Select value={axes[which]} onValueChange={(key) => chooseAxis(which, key)}>
      <SelectTrigger
        aria-label={name}
        className="k-ps-select"
        data-slot={which === 0 ? 'param-surface-x' : 'param-surface-y'}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {params.map((p) => (
          <SelectItem key={p.key} value={p.key}>
            {p.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )

  return (
    <figure
      className={cn('k-ps', className)}
      data-slot="param-surface-heatmap"
      data-ramp={crossesZero ? 'diverging' : 'sequential'}
    >
      <div className="k-ps-head">
        <span className="k-ps-field">
          <span>{labels.xAxis}</span>
          {paramSelect(0, labels.xAxis)}
        </span>
        <span className="k-ps-field">
          <span>{labels.yAxis}</span>
          {paramSelect(1, labels.yAxis)}
        </span>
        <ToggleGroup
          size="sm"
          aria-label={labels.metric}
          value={metric.key}
          onValueChange={(next) => {
            if (!next) return
            setMetric(next)
            onMetricChange?.(next)
            reset()
          }}
        >
          {metrics.map((m) => (
            <ToggleGroupItem key={m.key} value={m.key}>
              {m.name}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        {Object.entries(slice).map(([key, value]) => (
          <span key={key} className="k-ps-field" data-slot="param-surface-slice">
            <span>{paramOf(key)?.name ?? key}</span>
            <Select value={String(value)} onValueChange={(next) => chooseSlice(key, Number(next))}>
              <SelectTrigger aria-label={`${labels.slice} ${paramOf(key)?.name ?? key}`} className="k-ps-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {paramValues(points, key).map((v) => (
                  <SelectItem key={v} value={String(v)}>
                    {fmtParam(key, v)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </span>
        ))}
      </div>

      <div className="k-ps-body">
        <div className="k-ps-plot">
          <p className="k-ps-yname" aria-hidden="true">
            {yParam?.name}
          </p>
          <div
            className="k-ps-grid"
            role="grid"
            aria-label={label}
            style={{ '--k-ps-cols': grid.xs.length } as CSSProperties}
            onKeyDown={move}
            onPointerLeave={() => setHot(null)}
          >
            {/* y 从下往上变大：先画最大的一行。 */}
            {grid.ys
              .map((y, yi) => ({ y, yi }))
              .reverse()
              .map(({ y, yi }) => (
                <div key={y} role="row" className="k-ps-row" data-slot="param-surface-row">
                  <span role="rowheader" className="k-ps-ytick">
                    {fmtParam(axes[1], y)}
                  </span>
                  {grid.xs.map((x, xi) => {
                    const point = grid.cells[yi]![xi] ?? null
                    const value = metricOf(point, metric.key)
                    const isBest = best?.xi === xi && best.yi === yi
                    const isPinned = pinned?.xi === xi && pinned.yi === yi
                    const name = `${xParam?.name ?? axes[0]} ${fmtParam(axes[0], x)}, ${yParam?.name ?? axes[1]} ${fmtParam(axes[1], y)}, ${metric.name} ${
                      point === null ? labels.missing : value === null ? labels.noValue : metric.format(value)
                    }${isBest ? `, ${labels.best}` : ''}`
                    return (
                      <div
                        key={x}
                        role="gridcell"
                        className="k-ps-cell"
                        data-slot="param-surface-cell"
                        data-xi={xi}
                        data-yi={yi}
                        data-id={point?.id}
                        data-best={isBest ? '' : undefined}
                        data-near={nearBest({ xi, yi }) ? '' : undefined}
                        data-pinned={isPinned ? '' : undefined}
                        data-empty={value === null ? '' : undefined}
                        aria-label={name}
                        aria-selected={isPinned}
                        tabIndex={stop.xi === xi && stop.yi === yi ? 0 : -1}
                        style={value === null ? undefined : styleOf(value)}
                        onPointerEnter={() => setHot({ xi, yi })}
                        onFocus={() => {
                          setStop({ xi, yi })
                          setHot({ xi, yi })
                        }}
                        onBlur={() => setHot(null)}
                        onClick={() => setPinned(isPinned ? null : { xi, yi })}
                      >
                        {showText && value !== null ? metric.format(value) : null}
                      </div>
                    )
                  })}
                </div>
              ))}
            <div className="k-ps-row k-ps-xrow" aria-hidden="true">
              <span className="k-ps-ytick" />
              {grid.xs.map((x) => (
                <span key={x} className="k-ps-xtick">
                  {fmtParam(axes[0], x)}
                </span>
              ))}
            </div>
          </div>
          <p className="k-ps-xname" aria-hidden="true">
            {xParam?.name}
          </p>
          {range !== null && (
            <div className="k-ps-legend" data-slot="param-surface-legend">
              <span>{metric.name}</span>
              <span>{metric.format(range.min)}</span>
              <i
                style={{ backgroundImage: crossesZero ? DIVERGING_GRADIENT : SEQUENTIAL_GRADIENT }}
                aria-hidden="true"
              />
              <span>{metric.format(range.max)}</span>
            </div>
          )}
        </div>

        <aside className="k-ps-panel" data-slot="param-surface-panel">
          <output className="k-ps-cellinfo" data-slot="param-surface-readout">
            <h5>{labels.cell}</h5>
            {current === null || currentPoint === null ? (
              <p>{current === null ? labels.idle : labels.missing}</p>
            ) : (
              <dl>
                {Object.entries(currentPoint.params).map(([key, value]) => (
                  <div key={key} data-kind="param">
                    <dt>{paramOf(key)?.name ?? key}</dt>
                    <dd>{fmtParam(key, value)}</dd>
                  </div>
                ))}
                {metrics.map((m) => {
                  const value = metricOf(currentPoint, m.key)
                  return (
                    <div key={m.key} data-kind="metric" data-active={m.key === metric.key ? '' : undefined}>
                      <dt>{m.name}</dt>
                      <dd>{value === null ? labels.noValue : m.format(value)}</dd>
                    </div>
                  )
                })}
              </dl>
            )}
          </output>
          {bestStable !== null && bestPoint !== null && (
            <div className="k-ps-stable" data-slot="param-surface-stability" data-spike={spiky ? '' : undefined}>
              <h5>
                {labels.neighborhood}
                {spiky && <span className="k-ps-badge">{labels.spike}</span>}
              </h5>
              <dl>
                <div>
                  <dt>{labels.best}</dt>
                  <dd data-slot="param-surface-best">
                    {bestStable.center === null ? labels.noValue : metric.format(bestStable.center)}
                  </dd>
                </div>
                <div>
                  <dt>{labels.neighbors}</dt>
                  <dd data-slot="param-surface-count">{bestStable.count}</dd>
                </div>
                <div>
                  <dt>{labels.mean}</dt>
                  <dd data-slot="param-surface-mean">
                    {bestStable.mean === null ? labels.noValue : metric.format(bestStable.mean)}
                  </dd>
                </div>
                <div>
                  <dt>{labels.variance}</dt>
                  <dd data-slot="param-surface-variance">
                    {bestStable.variance === null ? labels.noValue : fmtSpread(bestStable.variance)}
                  </dd>
                </div>
                <div>
                  <dt>{labels.retention}</dt>
                  <dd data-slot="param-surface-retention">
                    {bestStable.retention === null ? labels.noValue : formatRatio(bestStable.retention)}
                  </dd>
                </div>
              </dl>
            </div>
          )}
        </aside>
      </div>
      {source !== undefined && <p className="k-dist-source">{source}</p>}
    </figure>
  )
}
