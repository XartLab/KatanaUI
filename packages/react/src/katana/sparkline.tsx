// SPDX-License-Identifier: MIT
// 迷你图：一列数从旧到新，按容器的真实像素画（不再拉伸一个固定 viewBox，线宽不会随拉伸发虚）。
// 样式取 TradingView 小组件 Mini Chart / Symbol Overview（线加线下渐变、基准线、末端点）与 Tufte 的 sparkline 原则（最高最低点、胜负格），
// 只取做法、不抄其代码与样式，颜色全走自己的 token（涨跌 --pnl-up / --pnl-down，跟涨跌配色走）。
// 几何（断点分段、刻度、设备像素对齐、单调曲线、基准切分、标签放左放右）在 ./sparkline-model.ts，这里只管画与交互。
import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from 'react'
import { useLineExtend, type LineFollower, type LinePoint } from '../lib/live-line.ts'
import { useValueFlash } from '../lib/live.ts'
import { fontFor, measureText, onTextMeasureReset } from '../lib/text-measure.ts'
import {
  SPARK_VOLUME_SHARE,
  areaPath,
  barRects,
  baselineClips,
  firstValid,
  isSparkValue,
  labelPlacement,
  lastValid,
  linePath,
  nearestIndex,
  readoutPlacement,
  resolveSparkTone,
  snapLine,
  sparkCount,
  sparkExtremes,
  sparkLayout,
  sparkLayoutPoints,
  sparkNumbers,
  stepIndex,
  volumeRects,
  winLossCells,
  xAt,
  yAt,
  type SparkCurve,
  type SparkValue,
} from './sparkline-model.ts'
import { quoteTone, type QuoteTone } from './quote-tone.ts'

const W = 200
const H = 36

/** 某个值在 [lo, hi] 里的纵坐标：最高在顶、最低在底，上下各留 2。hi 等于 lo 时按 1 的跨度算（一条平线落在底边）。纯函数。 */
export function sparkY(value: number, lo: number, hi: number, height = H): number {
  return height - 2 - ((value - lo) / (hi - lo || 1)) * (height - 4)
}

/**
 * 折线的点（SVG polyline 的 points）：x 铺满整宽，y 按这列的最低到最高，上下各留 2。少于两个数返回空串。纯函数。
 * extent：给了就按它的 [最低, 最高] 排，不按这列自己的（图里还要画阈值线、要它也落在图里时用，#1929）。
 */
export function sparkPoints(
  values: readonly number[],
  width = W,
  height = H,
  extent?: readonly [number, number],
): string {
  return pointsText(sparkCoords(values, width, height, extent))
}

/** 折线的坐标（sparkPoints 的数值版，给走势延伸的过场用）；少于两个数返回空数组。纯函数。 */
export function sparkCoords(
  values: readonly number[],
  width = W,
  height = H,
  extent?: readonly [number, number],
): LinePoint[] {
  if (values.length < 2) return []
  const lo = extent ? extent[0] : Math.min(...values)
  const hi = extent ? extent[1] : Math.max(...values)
  return values.map((value, i) => [(i / (values.length - 1)) * width, sparkY(value, lo, hi, height)] as const)
}

/** 坐标写成 polyline 的 points（保留 2 位小数）。 */
export const pointsText = (coords: readonly LinePoint[]): string =>
  coords.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(' ')

/** 头尾比：涨、跌、持平；少于两个数算持平。 */
export const sparkTone = (values: readonly number[]): QuoteTone =>
  values.length > 1 ? quoteTone(values[values.length - 1]! - values[0]!) : 'flat'

export type SparklineVariant = 'area' | 'line' | 'baseline' | 'bars' | 'winloss'

export type SparklineProps = {
  /**
   * The values from oldest to newest; null or NaN breaks the line, and fewer than two valid values draws a dash.
   * 从旧到新；null、NaN 是断点（线与面积在那里断开），有效值少于两个画「—」。
   */
  values: readonly SparkValue[]
  /**
   * Accessible name as a whole sentence, including how "no data" is said; written by the caller in the UI language (required).
   * 读屏名（整句，含「没有数据」的说法）：由调用方按界面语言写。
   */
  label: string
  /**
   * Color tone; follows the last value against the baseline, or the first-to-last change without one, when omitted.
   * 不给：有基准按最后值对基准，没基准按头尾涨跌。
   */
  tone?: QuoteTone
  /**
   * Drawing style: area (line with a gradient below, the default), line, baseline (up color above the baseline and down color below), bars, or winloss (Tufte win/loss cells).
   * 画法：area 线加线下渐变（默认）、line 只一根线、baseline 基准上涨色下跌色、bars 细柱、winloss 胜负格。
   */
  variant?: SparklineVariant
  /**
   * Reference value such as the previous close; draws a dashed line, and splits colors in baseline and bars (winloss defaults to 0, bars to the first value).
   * 基准（如昨收、开盘）：画一条虚线；baseline 与 bars 以它分涨跌色，winloss 不给按 0、bars 不给按第一个值。
   */
  baseline?: number
  /**
   * Whether to draw a dot at the latest value (default true for area, line and baseline).
   * 最新值处画圆点，值变化时光晕脉动一次（area、line、baseline 默认 true）。
   */
  showLast?: boolean
  /**
   * Latest value text shown at the right end, already formatted by the caller; the line leaves room for it.
   * 右端的最新值文字（调用方格式化好）；线会给它让出位置。
   */
  lastLabel?: string
  /**
   * Mark the highest and lowest values with a small dot each.
   * 最高与最低各画一个小点。
   */
  showExtremes?: boolean
  /**
   * Texts for the highest and the lowest dots, in that order, already formatted by the caller; placed left or right of the dot to stay inside.
   * 最高、最低两个点旁的字（顺序是 [最高, 最低]，调用方格式化好）；自动放左或放右，不出界。
   */
  extremeLabels?: readonly [string, string]
  /**
   * Show a crosshair, a snapped dot and a readout on hover, and walk the points with the arrow keys; keep it off for one chart per table row.
   * 悬停出十字线、吸附圆点与读数，键盘左右键走点；表格里一行一个时不要开。
   */
  interactive?: boolean
  /**
   * Turns a value into its readout text; defaults to the plain number. Written by the caller so the unit and locale are its own.
   * 把值写成读数文字（默认是原数）；单位与区域格式由调用方定。
   */
  format?: (value: number, index: number) => string
  /**
   * A time or date text for each value, shown before the value in the readout.
   * 每个值对应的时间文字，读数里写在值前面。
   */
  times?: readonly string[]
  /**
   * Called with the hovered or keyboard-selected index, or null when it leaves.
   * 悬停或键盘选中的下标，离开时是 null。
   */
  onHover?: (index: number | null) => void
  /**
   * Volume for each value, drawn as thin bars in the bottom quarter without covering the line.
   * 每个值的成交量：底部四分之一高度画细柱，不压线。
   */
  volumes?: readonly SparkValue[]
  /**
   * Volume bar color: neutral (default) or follow the price change with the up and down colors.
   * 量柱着色：neutral（默认）或跟价格涨跌用涨跌色。
   */
  volumeTone?: 'neutral' | 'updown'
  /**
   * Curve between points: linear (default) or monotone (smooth, never overshooting the data).
   * 点间曲线：linear（默认）或 monotone（单调三次插值，不过冲）。
   */
  curve?: SparkCurve
  /**
   * Width in pixels used before the container has been measured (server render, first frame); default 200.
   * 还没量到容器宽度时用的宽（服务端渲染、首帧），默认 200。
   */
  width?: number
  /**
   * Height in pixels used before the container has been measured; default 36.
   * 还没量到容器高度时用的高，默认 36。
   */
  height?: number
  /**
   * Extra class name on the svg, written before is-<tone>.
   * 加在 svg 上，写在 is-<tone> 之前。
   */
  className?: string
  /**
   * Extra class name on the dash shown when there is no data.
   * 没数据时那个「—」的额外类名。
   */
  emptyClassName?: string
}

export function Sparkline(props: SparklineProps) {
  if (sparkCount(props.values) < 2)
    return (
      <span
        className={`k-spark-empty${props.emptyClassName ? ` ${props.emptyClassName}` : ''}`}
        role="img"
        aria-label={props.label}
      >
        —
      </span>
    )
  return <SparkChart {...props} />
}

/** 量 svg 在页面上的真实宽高（ResizeObserver）；量到之前用调用方给的或默认值。 */
function useBox(ref: React.RefObject<SVGSVGElement | null>, fallbackW: number, fallbackH: number) {
  const [box, setBox] = useState({ w: fallbackW, h: fallbackH })
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const read = (w: number, h: number) => {
      if (!(w > 0 && h > 0)) return
      setBox((prev) => (Math.abs(prev.w - w) < 0.01 && Math.abs(prev.h - h) < 0.01 ? prev : { w, h }))
    }
    const rect = el.getBoundingClientRect()
    read(rect.width, rect.height)
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver((entries) => {
      const size = entries[entries.length - 1]?.contentRect
      if (size) read(size.width, size.height)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [ref])
  return box
}

/** 设备像素比（线与柱按它对齐）；缩放页面或换到另一块屏幕时跟着变。 */
function useDpr(): number {
  const [dpr, setDpr] = useState(1)
  useLayoutEffect(() => {
    const read = () => setDpr(window.devicePixelRatio || 1)
    read()
    window.addEventListener('resize', read)
    return () => window.removeEventListener('resize', read)
  }, [])
  return dpr
}

/** 字体变了（Web 字体加载完、DPR 变了）文字量出来的宽要重算。 */
function useTextEpoch(): number {
  const [epoch, setEpoch] = useState(0)
  useEffect(() => onTextMeasureReset(() => setEpoch((n) => n + 1)), [])
  return epoch
}

/** 读屏播报要节流：一直按住方向键时不一句一句念，停下 ms 后才更新。 */
function useThrottledText(text: string, ms = 300): string {
  const [shown, setShown] = useState('')
  const last = useRef(0)
  useEffect(() => {
    const wait = text === '' ? 0 : Math.max(0, last.current + ms - performance.now())
    const timer = setTimeout(() => {
      last.current = performance.now()
      setShown(text)
    }, wait)
    return () => clearTimeout(timer)
  }, [text, ms])
  return shown
}

const TEXT_PX = 10
const DOT_PAD = 3
const LABEL_GAP = 6
const TIP_H = 16

function SparkChart({
  values,
  label,
  tone,
  variant = 'area',
  baseline,
  showLast,
  lastLabel,
  showExtremes,
  extremeLabels,
  interactive = false,
  format,
  times,
  onHover,
  volumes,
  volumeTone = 'neutral',
  curve = 'linear',
  width,
  height,
  className,
}: SparklineProps) {
  const svg = useRef<SVGSVGElement>(null)
  const { w, h } = useBox(svg, width ?? W, height ?? H)
  const dpr = useDpr()
  const epoch = useTextEpoch()
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '')
  const isLine = variant === 'area' || variant === 'line' || variant === 'baseline'
  const hasLast = showLast ?? isLine
  const nums = useMemo(() => sparkNumbers(values), [values])
  const lastIdx = lastValid(values)
  const lastValue = lastIdx >= 0 ? (values[lastIdx] as number) : undefined
  const resolvedTone = resolveSparkTone(values, tone, baseline)

  // 文字量宽用的字体：跟样式里 .k-spark-text 同一档（--text-num-sm-size 随 --k-text-scale 缩放）。
  const font = useMemo(() => {
    const scale = Number(getComputedStyleSafe('--k-text-scale')) || 1
    return fontFor(400, Math.round(TEXT_PX * scale), '--font-num-small')
    // epoch 变了说明字体加载完，要重取。
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [epoch])
  const lastLabelW = lastLabel ? measureText(lastLabel, font) : 0

  const volH = volumes && volumes.length ? Math.round(h * SPARK_VOLUME_SHARE) : 0
  // bars 的基准：不给就取第一个值（跟 baseline 样式同一个「开盘」语义）；winloss 不给按 0。
  const first = firstValid(values)
  const base = baseline ?? (variant === 'winloss' ? 0 : first >= 0 ? (values[first] as number) : 0)
  const layout = sparkLayout(values, {
    width: w,
    height: h,
    padRight: (hasLast ? DOT_PAD : 1) + (lastLabel ? LABEL_GAP + lastLabelW : 0),
    bottomReserve: volH,
    baseline: variant === 'bars' ? base : baseline,
    slots: variant === 'bars' || variant === 'winloss',
  })
  const points = sparkLayoutPoints(values, layout, dpr)
  const floorY = volH ? layout.bottom + 3 : h
  const baseY = baseline !== undefined && isSparkValue(baseline) ? snapLine(yAt(layout, baseline), 1, dpr) : null
  const lineD = isLine ? linePath(points, curve) : ''
  // baseline 样式不给基准时用第一个值当基准（TradingView 的 Baseline 默认也是第一根）。
  const splitY = variant === 'baseline' ? (baseY ?? snapLine(yAt(layout, base), 1, dpr)) : null
  const splitClips = splitY === null ? null : baselineClips(splitY, w, h)
  const areaFloor = variant === 'baseline' && splitY !== null ? splitY : floorY

  // —— 实时：新点追加时线、面积、末端点一起平滑延伸 ——
  const lineMain = useRef<SVGPathElement>(null)
  const lineAlt = useRef<SVGPathElement>(null)
  const areaMain = useRef<SVGPathElement>(null)
  const areaAlt = useRef<SVGPathElement>(null)
  const dot = useRef<SVGCircleElement>(null)
  const halo = useRef<SVGCircleElement>(null)
  const followers: LineFollower[] = isLine
    ? [
        { ref: lineAlt, write: (el, p) => el.setAttribute('d', linePath(p, curve)) },
        { ref: areaMain, write: (el, p) => el.setAttribute('d', areaPath(p, areaFloor, curve)) },
        { ref: areaAlt, write: (el, p) => el.setAttribute('d', areaPath(p, areaFloor, curve)) },
        { ref: dot, write: (el, p) => moveTo(el, p[lastIdx]) },
        { ref: halo, write: (el, p) => moveTo(el, p[lastIdx]) },
      ]
    : []
  useLineExtend(lineMain, 'd', isLine ? nums : [], isLine ? points : [], (p) => linePath(p, curve), followers)
  const flash = useValueFlash(lastValue, { enabled: hasLast })

  // —— 悬停与键盘 ——
  const [active, setActive] = useState<number | null>(null)
  const at = interactive && active !== null && isSparkValue(values[active]) ? active : null
  const hoverRef = useRef(onHover)
  hoverRef.current = onHover
  const reported = useRef<number | null>(null)
  useEffect(() => {
    if (reported.current === at) return
    reported.current = at
    hoverRef.current?.(at)
  }, [at])
  const readout =
    at === null
      ? ''
      : `${times?.[at] ? `${times[at]} ` : ''}${format ? format(values[at] as number, at) : String(values[at])}`
  const announced = useThrottledText(interactive ? readout : '')

  const onMove = (event: PointerEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    if (!rect.width) return
    const index = nearestIndex(values, ((event.clientX - rect.left) / rect.width) * w, layout)
    setActive(index >= 0 ? index : null)
  }
  const onKey = (event: KeyboardEvent<SVGSVGElement>) => {
    const move = { ArrowLeft: 'prev', ArrowRight: 'next', Home: 'first', End: 'last' }[event.key] as
      | 'prev'
      | 'next'
      | 'first'
      | 'last'
      | undefined
    if (event.key === 'Escape') {
      if (active !== null) event.preventDefault()
      setActive(null)
      return
    }
    if (!move) return
    event.preventDefault()
    const next = stepIndex(values, at, move)
    setActive(next >= 0 ? next : null)
  }

  const bars = variant === 'bars' ? barRects(values, layout, base, dpr) : []
  const cells = variant === 'winloss' ? winLossCells(values, layout, base, dpr) : []
  const vols = volH ? volumeRects(volumes ?? [], values, layout, volH, dpr) : []
  const extremes = showExtremes ? sparkExtremes(values) : null
  const px = (p: LinePoint | undefined) => (p && Number.isFinite(p[1]) ? p : null)
  const lastPoint = px(points[lastIdx])

  function tipOf(i: number) {
    const value = values[i] as number
    const text = format ? format(value, i) : String(value)
    const time = times?.[i] ?? ''
    const tw = measureText(text, font)
    const tt = time ? measureText(time, font) : 0
    const width = 10 + tw + (time ? tt + 6 : 0)
    const cx = xOf(i)
    const py = isLine ? (px(points[i])?.[1] ?? h / 2) : variant === 'bars' ? yAt(layout, value) : h / 2
    return { text, time, tt, width, ...readoutPlacement(cx, py, width, TIP_H, { width: w, height: h }), cx, py }
  }
  function xOf(i: number) {
    return snapLine(isLine ? (points[i]?.[0] ?? 0) : xAt(layout, i), 1, dpr)
  }

  const tip = at === null ? null : tipOf(at)

  const gradientId = `ks${uid}a`
  const gradientUp = `ks${uid}u`
  const gradientDown = `ks${uid}d`
  const clipUp = `ks${uid}cu`
  const clipDown = `ks${uid}cd`

  const body = (
    <svg
      ref={svg}
      className={`k-spark${className ? ` ${className}` : ''} is-${resolvedTone}`}
      viewBox={`0 0 ${w} ${h}`}
      role="img"
      aria-label={label}
      data-variant={variant}
      data-curve={curve}
      tabIndex={interactive ? 0 : undefined}
      onPointerMove={interactive ? onMove : undefined}
      onPointerLeave={interactive ? () => setActive(null) : undefined}
      onKeyDown={interactive ? onKey : undefined}
      onBlur={interactive ? () => setActive(null) : undefined}
    >
      <defs>
        {variant === 'area' && (
          <linearGradient id={gradientId} gradientUnits="userSpaceOnUse" x1="0" x2="0" y1={layout.top} y2={floorY}>
            <stop className="k-spark-stop-a" offset="0" />
            <stop className="k-spark-stop-b" offset="1" />
          </linearGradient>
        )}
        {variant === 'baseline' && splitY !== null && (
          <>
            <linearGradient id={gradientUp} gradientUnits="userSpaceOnUse" x1="0" x2="0" y1={layout.top} y2={splitY}>
              <stop className="k-spark-stop-a is-up" offset="0" />
              <stop className="k-spark-stop-b is-up" offset="1" />
            </linearGradient>
            <linearGradient
              id={gradientDown}
              gradientUnits="userSpaceOnUse"
              x1="0"
              x2="0"
              y1={layout.bottom}
              y2={splitY}
            >
              <stop className="k-spark-stop-a is-down" offset="0" />
              <stop className="k-spark-stop-b is-down" offset="1" />
            </linearGradient>
          </>
        )}
        {splitClips && (
          <>
            <clipPath id={clipUp}>
              <rect {...splitClips.above} />
            </clipPath>
            <clipPath id={clipDown}>
              <rect {...splitClips.below} />
            </clipPath>
          </>
        )}
      </defs>

      {vols.map((r) => (
        <rect
          key={r.i}
          className={`k-spark-vol${volumeTone === 'updown' ? ` is-${r.side}` : ''}`}
          x={r.x}
          y={r.y}
          width={r.width}
          height={r.height}
        />
      ))}

      {baseY !== null && <line className="k-spark-base" x1={0} x2={w} y1={baseY} y2={baseY} />}

      {variant === 'area' && (
        <path
          ref={areaMain}
          className="k-spark-area"
          d={areaPath(points, floorY, curve)}
          fill={`url(#${gradientId})`}
        />
      )}
      {variant === 'baseline' && splitClips && (
        <>
          <g clipPath={`url(#${clipUp})`} className="k-spark-up">
            <path
              ref={areaMain}
              className="k-spark-area"
              d={areaPath(points, areaFloor, curve)}
              fill={`url(#${gradientUp})`}
            />
            <path ref={lineMain} className="k-spark-line" d={lineD} data-points={sparkCount(values)} />
          </g>
          <g clipPath={`url(#${clipDown})`} className="k-spark-down">
            <path
              ref={areaAlt}
              className="k-spark-area"
              d={areaPath(points, areaFloor, curve)}
              fill={`url(#${gradientDown})`}
            />
            <path ref={lineAlt} className="k-spark-line" d={lineD} />
          </g>
        </>
      )}
      {variant !== 'baseline' && isLine && (
        <path ref={lineMain} className="k-spark-line" d={lineD} data-points={sparkCount(values)} />
      )}

      {bars.map((r) => (
        <rect key={r.i} className={`k-spark-bar is-${r.side}`} x={r.x} y={r.y} width={r.width} height={r.height} />
      ))}
      {cells.map((r) => (
        <rect key={r.i} className={`k-spark-cell is-${r.side}`} x={r.x} y={r.y} width={r.width} height={r.height} />
      ))}

      {extremes && isLine && (
        <g className="k-spark-extremes">
          {[extremes.max, extremes.min].map((i, k) => {
            const p = px(points[i])
            if (!p) return null
            const text = extremeLabels?.[k]
            const place = text ? labelPlacement(p[0], measureText(text, font), w) : null
            return (
              <g key={k} data-extreme={k === 0 ? 'max' : 'min'}>
                <circle className="k-spark-extreme" cx={p[0]} cy={p[1]} r={1} />
                {text && place && (
                  <text
                    className="k-spark-text"
                    x={place.x}
                    y={Math.min(Math.max(p[1], TEXT_PX / 2 + 1), h - TEXT_PX / 2 - 1)}
                    textAnchor={place.anchor}
                  >
                    {text}
                  </text>
                )}
              </g>
            )
          })}
        </g>
      )}

      {hasLast && lastPoint && flash.flash && (
        <circle
          key={flash.key}
          ref={halo}
          className="k-spark-halo"
          data-flash={flash.flash}
          cx={lastPoint[0]}
          cy={lastPoint[1]}
          r={7}
        />
      )}
      {hasLast && lastPoint && <circle ref={dot} className="k-spark-dot" cx={lastPoint[0]} cy={lastPoint[1]} r={1.5} />}
      {lastLabel && lastPoint && (
        <text
          className="k-spark-text k-spark-last"
          x={w}
          y={Math.min(Math.max(lastPoint[1], TEXT_PX / 2 + 1), h - TEXT_PX / 2 - 1)}
          textAnchor="end"
        >
          {lastLabel}
        </text>
      )}

      {tip && (
        <g className="k-spark-hover" pointerEvents="none">
          <line className="k-spark-cursor" x1={tip.cx} x2={tip.cx} y1={0} y2={h} />
          {isLine && px(points[at!]) && (
            <circle className="k-spark-dot is-hover" cx={points[at!]![0]} cy={points[at!]![1]} r={2} />
          )}
          <rect className="k-spark-tip" x={tip.x} y={tip.y} width={tip.width} height={TIP_H} />
          {tip.time && (
            <text className="k-spark-text k-spark-tip-time" x={tip.x + 5} y={tip.y + TIP_H / 2}>
              {tip.time}
            </text>
          )}
          <text
            className="k-spark-text k-spark-tip-value"
            x={tip.x + 5 + (tip.time ? tip.tt + 6 : 0)}
            y={tip.y + TIP_H / 2}
          >
            {tip.text}
          </text>
        </g>
      )}
    </svg>
  )
  if (!interactive) return body
  return (
    <>
      {body}
      <span className="sr-only" role="status" aria-live="polite">
        {announced}
      </span>
    </>
  )
}

/** 把圆挪到一个点上（延伸过场里每帧调用）。 */
function moveTo(el: SVGElement, point: LinePoint | undefined) {
  if (!point || !Number.isFinite(point[1])) return
  el.setAttribute('cx', String(point[0]))
  el.setAttribute('cy', String(point[1]))
}

/** 读根节点上的一个 CSS 变量（服务端渲染里没有 document，返回空串）。 */
function getComputedStyleSafe(name: string): string {
  return typeof document === 'undefined' ? '' : getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}
