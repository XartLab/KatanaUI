// SPDX-License-Identifier: MIT
// 迷你图的「仪器档案」画风（look="instrument"）：把数据当成科学档案来排版（用户 2026-11-18 定，依据 design/katana-console/project/precision-instrument.md 与 dataviz.md）。
// 取的是做法：1px 细线用中性墨色（不用涨跌色）、全图只有一个信号色（末端点与批注）、+ 点阵与四角对位角标、细刻度线、宽字距等宽小标签、
// 主图右侧的投影谱（这列值的分布，与主图共享纵轴）、极值的小十字加引线、研究员式批注（手绘圈加一句话）、档案编号与 SOURCES 行。
// 它是 Sparkline 的另一条分支，不碰 default 的 DOM；几何都在 ./sparkline-model.ts。高度低于 80 时只画线、点阵与末端点。
import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
} from 'react'
import { fillVar } from '../lib/fill.ts'
import { useLineExtend, type LineFollower, type LinePoint } from '../lib/live-line.ts'
import { fontFor, measureText } from '../lib/text-measure.ts'
import {
  calloutPlacement,
  graticuleStep,
  isSparkValue,
  lastValid,
  linePath,
  nearestIndex,
  priceTicks,
  projectionProfile,
  sketchCircle,
  snapLine,
  sparkCount,
  sparkExtremes,
  sparkLayout,
  sparkLayoutPoints,
  stepIndex,
  thinLabels,
  timeGroups,
  timeTicks,
  timeX,
  timeXs,
  autoTickMinutes,
  tipPlacement,
  yAt,
} from './sparkline-model.ts'
import {
  getComputedStyleSafe,
  isStamps,
  moveTo,
  plainPrice,
  resolveSpans,
  useBox,
  useDpr,
  useTextEpoch,
  useThrottledText,
} from './sparkline-shared.ts'
import type { SparklineProps } from './sparkline.tsx'

const W = 200
const H = 36
const TEXT_PX = 10
/** 宽字距（em）：设计稿里标签 10 到 11px、约 0.15em；包里没有对应的字距 token，写在这里并在 css 里同值。 */
const TRACKING = 0.15
const BIG = 80
const HEAD_H = 16
const FOOT_H = 16
const TIME_BAND = TEXT_PX + 10
const TICK = 3
const ROW_STEP = 3

/** 字距撑开后放不下就砍尾巴加省略号（档案编号与来源行不换行）。 */
function fitSpaced(text: string, font: string, spacing: number, max: number): string {
  if (max <= 0) return ''
  let out = text
  while (out.length > 1 && measureText(out, font, spacing) > max)
    out = `${out.slice(0, Math.max(1, out.length - 2))}…`.replace('……', '…')
  return measureText(out, font, spacing) > max ? '' : out
}

export function SparkInstrument({
  values: rawValues,
  label,
  baseline,
  showLast = true,
  lastLabel,
  showExtremes,
  extremeLabels,
  interactive = false,
  format,
  times,
  domain,
  sessions,
  formatTime,
  axis,
  lastTag = false,
  onHover,
  curve = 'linear',
  width,
  height,
  className,
  signal,
  projection = false,
  projectionMode = 'kde',
  annotation,
  meta,
  reticle = false,
}: SparklineProps) {
  const svg = useRef<SVGSVGElement>(null)
  const { w, h } = useBox(svg, width ?? W, height ?? H)
  const dpr = useDpr()
  const epoch = useTextEpoch()
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '')
  const big = h >= BIG
  const lw = 1

  // —— 时间轴：同 default，给了毫秒时间戳就按时间排 ——
  const stamps = isStamps(times) ? times : null
  const spans = stamps ? resolveSpans(stamps, domain, sessions) : []
  const timed = stamps !== null && spans.length > 0
  const groups = timed ? timeGroups(stamps, spans) : null
  const values = groups ? rawValues.map((value, i) => (groups[i]! >= 0 ? value : null)) : rawValues
  const nums = useMemo(() => values.filter(isSparkValue), [values])
  const lastIdx = lastValid(values)
  const lastValue = lastIdx >= 0 ? (values[lastIdx] as number) : undefined

  const font = useMemo(() => {
    const scale = Number(getComputedStyleSafe('--k-text-scale')) || 1
    return fontFor(400, Math.round(TEXT_PX * scale), '--font-mono')
    // epoch 变了说明字体加载完，要重取。
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [epoch])
  const spacing = TEXT_PX * TRACKING

  // —— 垂直分区：眉头、图、时间刻度、页脚（都只在大图里有）——
  const headOn = big && !!meta?.id
  const footOn = big && !!meta?.source
  const axisOn = h >= 60
  const priceCount = axisOn && axis?.price ? (axis.price === true ? 4 : Math.max(2, Math.floor(axis.price))) : 0
  const priceText = (value: number, index: number) =>
    axis?.formatPrice ? axis.formatPrice(value) : format ? format(value, index) : plainPrice(value)
  const tickText = axis?.formatTick ?? (formatTime ? (t: number) => formatTime(t).time : undefined)
  const timeOn = axisOn && big && timed && !!axis?.time && !!tickText
  const top0 = headOn ? HEAD_H : 0
  const ph = h - top0 - (timeOn ? TIME_BAND : 0) - (footOn ? FOOT_H : 0)
  const tagOn = lastTag && lastValue !== undefined && big
  const rightAxis = priceCount > 0 || tagOn

  const dotR = big ? 3 : 2
  const lastPad = showLast ? dotR + 2 : 1
  const padLeft = big ? 10 : 2
  const padY = big ? 12 : 3
  const layoutBase = { width: w, height: ph, baseline, padY, padLeft }
  const range = sparkLayout(values, layoutBase)
  const tickValues = priceCount ? priceTicks(range.lo, range.hi, priceCount) : []
  const tickWidths = tickValues.map((v) => measureText(priceText(v, -1), font, spacing))
  const tagText = tagOn ? priceText(lastValue, lastIdx) : ''
  const axisW = Math.max(tagOn ? measureText(tagText, font, spacing) + 8 : 0, ...tickWidths, 0)
  const showLastLabel = !!lastLabel && !rightAxis && big
  const lastLabelW = showLastLabel ? measureText(lastLabel, font, spacing) : 0
  // 投影谱占图宽的 14%（夹在 12 到 16 之间的中间值）；它在主图右侧、刻度字左侧。
  const projOn = big && projection
  const projW = projOn ? Math.max(24, Math.round(w * 0.14)) : 0
  const projGap = projOn ? 6 : 0
  const rightTickW = rightAxis ? axisW + TICK + 6 : 0
  const layout0 = sparkLayout(values, {
    ...layoutBase,
    padRight:
      lastPad + (showLastLabel ? 6 + lastLabelW : 0) + (projOn ? projGap + projW : 0) + rightTickW + (big ? 8 : 0),
  })
  const layout = timed ? { ...layout0, xs: timeXs(stamps, spans, layout0.left, layout0.right) } : layout0
  const points = sparkLayoutPoints(values, layout, dpr, lw)
  const baseY = baseline !== undefined && isSparkValue(baseline) ? snapLine(yAt(layout, baseline), 1, dpr) : null
  const runGroups = groups ?? undefined
  const lineD = linePath(points, curve, runGroups)
  const px = (p: LinePoint | undefined) => (p && Number.isFinite(p[1]) ? p : null)
  const lastPoint = px(points[lastIdx])

  // —— 实时：新点追加时线、末端点与投影谱的当前值线一起延伸 ——
  const lineMain = useRef<SVGPathElement>(null)
  const dot = useRef<SVGCircleElement>(null)
  const now = useRef<SVGLineElement>(null)
  const followers: LineFollower[] = [
    { ref: dot, write: (el, p) => moveTo(el, p[lastIdx]) },
    {
      ref: now,
      write: (el, p) => {
        const y = p[lastIdx]?.[1]
        if (y === undefined || !Number.isFinite(y)) return
        el.setAttribute('y1', String(y))
        el.setAttribute('y2', String(y))
      },
    },
  ]
  useLineExtend(lineMain, 'd', nums, points, (p) => linePath(p, curve, runGroups), followers)

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
  const stampOf = (i: number): { date: string; time: string } => {
    if (stamps) return formatTime ? formatTime(stamps[i]!) : { date: '', time: '' }
    const text = (times as readonly string[] | undefined)?.[i]
    return { date: '', time: text ?? '' }
  }
  const textOf = (i: number) => (format ? format(values[i] as number, i) : String(values[i]))
  const readout = at === null ? '' : [stampOf(at).date, stampOf(at).time, textOf(at)].filter(Boolean).join(' ')
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
  const tipRef = useRef<HTMLDivElement>(null)
  const [tipSize, setTipSize] = useState<{ w: number; h: number } | null>(null)
  const tipStamp = at === null ? null : stampOf(at)
  const tipValue = at === null ? '' : textOf(at)
  useLayoutEffect(() => {
    const el = tipRef.current
    if (!el) return
    const next = { w: el.offsetWidth, h: el.offsetHeight }
    setTipSize((prev) => (prev && prev.w === next.w && prev.h === next.h ? prev : next))
  }, [at, tipValue, tipStamp?.date, tipStamp?.time])
  const hoverP = at === null ? null : px(points[at])
  const tip = hoverP
    ? tipPlacement(hoverP[0], hoverP[1], tipSize?.w ?? 0, tipSize?.h ?? 0, { width: w, height: ph })
    : null

  // —— 时间刻度 ——
  const ticks = (() => {
    if (!timeOn || !tickText) return []
    const sample = measureText(tickText(spans[0]![0]), font, spacing)
    const minutes =
      typeof axis?.time === 'number'
        ? axis.time
        : autoTickMinutes(spans, Math.floor((layout.right - layout.left) / (sample + 12)))
    const all = timeTicks(spans, minutes).map((t) => {
      const text = tickText(t)
      return { t, text, x: timeX(t, spans, layout.left, layout.right), width: measureText(text, font, spacing) }
    })
    return thinLabels(all, w).map((i) => all[i]!)
  })()

  // —— 投影谱、极值、批注 ——
  const plotRight = layout.right
  const projX0 = plotRight + (lastPad > 0 ? lastPad : 0) + projGap
  const rows = projOn ? Math.max(2, Math.floor((layout.bottom - layout.top) / ROW_STEP) + 1) : 0
  const profile = projOn ? projectionProfile(values, layout.lo, layout.hi, rows, projectionMode) : []
  const extremes = showExtremes && big ? sparkExtremes(values) : null
  const note = big && annotation && isSparkValue(values[annotation.index]) ? annotation : null
  const noteP = note ? px(points[note.index]) : null
  const noteW = note ? measureText(note.text, font, spacing) : 0
  const step = graticuleStep(w, h)
  const patId = `ks${uid}g`
  const tagY = lastPoint ? Math.min(Math.max(lastPoint[1], 8), ph - 8) : 0
  const fit = (text: string, max: number) => fitSpaced(text, font, spacing, max)

  const sheet = (
    <svg
      ref={svg}
      className={`k-spark k-spark-instrument${className ? ` ${className}` : ''}`}
      style={signal ? ({ '--k-spark-signal': signal } as CSSProperties) : undefined}
      viewBox={`0 0 ${w} ${h}`}
      role="img"
      aria-label={label}
      data-look="instrument"
      data-timed={timed ? '' : undefined}
      data-plot-left={timed ? layout.left : undefined}
      data-plot-right={timed ? layout.right : undefined}
      tabIndex={interactive ? 0 : undefined}
      onPointerMove={interactive ? onMove : undefined}
      onPointerLeave={interactive ? () => setActive(null) : undefined}
      onKeyDown={interactive ? onKey : undefined}
      onBlur={interactive ? () => setActive(null) : undefined}
    >
      <defs>
        <pattern id={patId} width={step} height={step} patternUnits="userSpaceOnUse" x={step / 2} y={step / 2}>
          <path
            className="k-spark-ins-plus"
            d={`M${step / 2 - 1.5},${step / 2}H${step / 2 + 1.5}M${step / 2},${step / 2 - 1.5}V${step / 2 + 1.5}`}
          />
        </pattern>
      </defs>
      <rect className="k-spark-ins-grid" x={0} y={0} width={w} height={h} fill={`url(#${patId})`} />
      {big && (
        <path
          className="k-spark-ins-corner"
          d={`M0.5,6.5V0.5H6.5M${w - 6.5},0.5H${w - 0.5}V6.5M0.5,${h - 6.5}V${h - 0.5}H6.5M${w - 6.5},${h - 0.5}H${w - 0.5}V${h - 6.5}`}
        />
      )}
      {headOn && meta?.id && (
        <text className="k-spark-ins-meta" x={12} y={HEAD_H / 2 + 1} data-meta="id">
          {fit(meta.id, w - 24)}
        </text>
      )}
      {footOn && meta?.source && (
        <text className="k-spark-ins-meta" x={12} y={h - FOOT_H / 2 - 1} data-meta="source">
          {fit(meta.source, w - 24)}
        </text>
      )}

      <g transform={`translate(0 ${top0})`}>
        {reticle && big && (
          <path
            className="k-spark-ins-reticle"
            d={`M${(layout.left + plotRight) / 2 - 5},${(layout.top + layout.bottom) / 2}h10M${(layout.left + plotRight) / 2},${(layout.top + layout.bottom) / 2 - 5}v10`}
          />
        )}

        {tickValues.map((value, k) => {
          const y = yAt(layout, value)
          return (
            <g key={k}>
              <line className="k-spark-ins-tick" x1={w - axisW - 6 - TICK} x2={w - axisW - 6} y1={y} y2={y} />
              <text
                className="k-spark-ins-text k-spark-price-tick"
                x={w - 4}
                y={Math.min(Math.max(y, TEXT_PX / 2), ph - TEXT_PX / 2)}
                textAnchor="end"
              >
                {priceText(value, -1)}
              </text>
            </g>
          )
        })}
        {ticks.map((tick) => (
          <g key={tick.t}>
            <line className="k-spark-ins-tick" x1={tick.x} x2={tick.x} y1={ph} y2={ph + TICK} />
            <text
              className="k-spark-ins-text k-spark-time-tick"
              x={Math.max(0, Math.min(tick.x - tick.width / 2, w - tick.width))}
              y={ph + TICK + TEXT_PX / 2 + 3}
            >
              {tick.text}
            </text>
          </g>
        ))}

        {baseY !== null && <line className="k-spark-ins-base" x1={layout.left} x2={plotRight} y1={baseY} y2={baseY} />}

        {projOn && (
          <g className="k-spark-ins-proj" data-projection={projectionMode}>
            <line className="k-spark-ins-spine" x1={projX0} x2={projX0} y1={layout.top} y2={layout.bottom} />
            {profile.map((v, k) => {
              const y = layout.bottom - (k / (rows - 1)) * (layout.bottom - layout.top)
              return (
                <rect
                  key={k}
                  className="k-spark-ins-bar"
                  x={projX0 + 1}
                  y={y - 0.5}
                  width={Math.max(0, projW - 1)}
                  height={1}
                  // 长度是 --fill（0 到 1），CSS 用 scale 画：才能过渡（新点进来时柱子平滑变化）又不重排。
                  style={fillVar(Math.max(0, v))}
                />
              )
            })}
            {lastPoint && (
              <line
                ref={now}
                className="k-spark-ins-now"
                x1={projX0}
                x2={projX0 + projW}
                y1={lastPoint[1]}
                y2={lastPoint[1]}
              />
            )}
          </g>
        )}

        <path ref={lineMain} className="k-spark-ins-line" d={lineD} data-points={sparkCount(values)} />

        {extremes && (
          <g className="k-spark-extremes" data-instrument-extremes="">
            {[extremes.max, extremes.min].map((i, k) => {
              const p = px(points[i])
              if (!p) return null
              const text = extremeLabels?.[k]
              const place = text
                ? calloutPlacement(p[0], p[1], measureText(text, font, spacing), { width: w, height: ph }, k === 0)
                : null
              return (
                <g key={k} data-extreme={k === 0 ? 'max' : 'min'}>
                  <path className="k-spark-ins-cross" d={`M${p[0] - 3},${p[1]}h6M${p[0]},${p[1] - 3}v6`} />
                  {text && place && (
                    <>
                      <line className="k-spark-ins-lead" x1={p[0]} y1={p[1]} x2={place.x2} y2={place.y2} />
                      <text className="k-spark-ins-text" x={place.tx} y={place.ty} textAnchor={place.anchor}>
                        {text}
                      </text>
                    </>
                  )}
                </g>
              )
            })}
          </g>
        )}

        {note && noteP && (
          <g className="k-spark-ins-note" data-annotation="">
            <path className="k-spark-ins-circle" d={sketchCircle(noteP[0], noteP[1], 8, note.index)} />
            {(() => {
              const place = calloutPlacement(noteP[0], noteP[1], noteW, { width: w, height: ph }, noteP[1] > ph / 2, 18)
              return (
                <>
                  <line
                    className="k-spark-ins-lead"
                    x1={noteP[0] + (place.x2 > noteP[0] ? 6 : -6)}
                    y1={noteP[1] + (place.y2 > noteP[1] ? 6 : -6)}
                    x2={place.x2}
                    y2={place.y2}
                  />
                  <text
                    className="k-spark-ins-text k-spark-ins-note-text"
                    x={place.tx}
                    y={place.ty}
                    textAnchor={place.anchor}
                  >
                    {note.text}
                  </text>
                </>
              )
            })()}
          </g>
        )}

        {showLast && lastPoint && (
          <circle ref={dot} className="k-spark-ins-dot" cx={lastPoint[0]} cy={lastPoint[1]} r={dotR} />
        )}
        {showLastLabel && lastPoint && (
          <text
            className="k-spark-ins-text k-spark-ins-last"
            x={w - 4}
            y={Math.min(Math.max(lastPoint[1], TEXT_PX / 2 + 1), ph - TEXT_PX / 2 - 1)}
            textAnchor="end"
          >
            {lastLabel}
          </text>
        )}
        {tagOn && lastPoint && (
          <g className="k-spark-ins-tag" data-last-tag="">
            <rect x={w - axisW - 10} y={tagY - 8} width={axisW + 8} height={16} />
            <text x={w - 6 - axisW / 2} y={tagY} textAnchor="middle">
              {tagText}
            </text>
          </g>
        )}

        {at !== null && hoverP && tip && (
          <g className="k-spark-hover" pointerEvents="none">
            <line className="k-spark-ins-cursor" x1={hoverP[0]} x2={hoverP[0]} y1={0} y2={ph} />
            <line className="k-spark-ins-cursor" x1={0} x2={w} y1={hoverP[1]} y2={hoverP[1]} />
            <path
              className="k-spark-ins-cross"
              d={`M${hoverP[0] - 4},${hoverP[1]}h8M${hoverP[0]},${hoverP[1] - 4}v8`}
            />
            <foreignObject
              className="k-spark-tipbox"
              x={tip.x}
              y={tip.y}
              width={260}
              height={140}
              visibility={tipSize ? undefined : 'hidden'}
            >
              <div ref={tipRef} className="k-spark-tip">
                <div className="k-spark-tip-value">{tipValue}</div>
                {tipStamp?.date && <div className="k-spark-tip-date">{tipStamp.date}</div>}
                {tipStamp?.time && <div className="k-spark-tip-time">{tipStamp.time}</div>}
              </div>
            </foreignObject>
          </g>
        )}
      </g>
    </svg>
  )
  if (!interactive) return sheet
  return (
    <>
      {sheet}
      <span className="sr-only" role="status" aria-live="polite">
        {announced}
      </span>
    </>
  )
}
