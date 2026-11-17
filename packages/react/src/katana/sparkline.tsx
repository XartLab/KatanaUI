// SPDX-License-Identifier: MIT
// 迷你图：一列数从旧到新，按容器的真实像素画（不再拉伸一个固定 viewBox，线宽不会随拉伸发虚）。
// 样式取 TradingView 小组件 Mini Chart / Symbol Overview（线加线下渐变、基准线、末端点）与 Tufte 的 sparkline 原则（最高最低点、胜负格），
// 只取做法、不抄其代码与样式，颜色全走自己的 token（涨跌 --pnl-up / --pnl-down，跟涨跌配色走）。
// 几何（断点分段、刻度、设备像素对齐、单调曲线、基准切分、标签放左放右、时间轴与休市压缩、价格刻度）在 ./sparkline-model.ts，这里只管画与交互。
// 大图（日内走势）再对齐 TradingView 的 Markets 页（2026-11-18 在浏览器里看的）：横轴是整个交易时段、线只画到现在；
// 末端点是实心点加常驻空心环；悬停只有一根竖线、读数框紧挨光标且是三行（数值、日期、时间）；右侧价格刻度加最新价价签。
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
import { useLineExtend, type LineFollower, type LinePoint } from '../lib/live-line.ts'
import { useValueFlash } from '../lib/live.ts'
import { fontFor, measureText } from '../lib/text-measure.ts'
import {
  SPARK_PAD_Y,
  SPARK_VOLUME_SHARE,
  areaPath,
  autoTickMinutes,
  barRects,
  baselineClips,
  firstValid,
  isSparkValue,
  labelPlacement,
  lastValid,
  linePath,
  nearestIndex,
  priceTicks,
  resolveSparkTone,
  snapLine,
  sparkCount,
  sparkExtremes,
  sparkLayout,
  sparkLayoutPoints,
  sparkLineWidth,
  sparkNumbers,
  stepIndex,
  thinLabels,
  timeGroups,
  timeTicks,
  timeX,
  timeXs,
  tipPlacement,
  volumeRects,
  winLossCells,
  xAt,
  yAt,
  type SparkCurve,
  type SparkValue,
} from './sparkline-model.ts'
import { quoteTone, type QuoteTone } from './quote-tone.ts'
import { SparkAscii } from './sparkline-ascii.tsx'
import { SparkInstrument } from './sparkline-instrument.tsx'
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

/** default is the market-panel look; instrument is the research-sheet look; ascii draws the trend with terminal glyphs. */
export type SparklineLook = 'default' | 'instrument' | 'ascii'

export type SparklineVariant = 'area' | 'line' | 'baseline' | 'bars' | 'winloss'

export type SparkAxis = {
  /** Price ticks on the right: true for 4, or the number of ticks; spread evenly from the lowest to the highest. */
  price?: boolean | number
  /** Time ticks at the bottom: true picks an interval that fits, or the interval in minutes. */
  time?: boolean | number
  /** Turns a price into tick text (also the text of the last-price tag); defaults to format, then the plain number. */
  formatPrice?: (value: number) => string
  /** Turns a timestamp into time tick text; defaults to the time line of formatTime. */
  formatTick?: (time: number) => string
}

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
   * Whether to draw a dot with a hollow ring at the latest value (default true for area, line and baseline); the ring pulses once when the value changes.
   * 最新值处画实心点加常驻空心环，值变化时光晕脉动一次（area、line、baseline 默认 true；矮于 28px 不画环）。
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
   * Show a vertical line, a snapped dot and a readout box beside the cursor on hover, and walk the points with the arrow keys; keep it off for one chart per table row.
   * 悬停出一根竖线、吸附圆点与紧挨光标的读数框，键盘左右键走点；表格里一行一个时不要开。
   */
  interactive?: boolean
  /**
   * Turns a value into its readout text; defaults to the plain number. Written by the caller so the unit and locale are its own.
   * 把值写成读数文字（默认是原数）；单位与区域格式由调用方定。
   */
  format?: (value: number, index: number) => string
  /**
   * Time of each value, one to one with values: millisecond timestamps place points by time (see domain and sessions), or texts shown under the value in the readout.
   * 每个值对应的时间：毫秒时间戳时按时间定横坐标（见 domain、sessions）；文字时只在读数里写在值下面，不影响位置。
   */
  times?: readonly string[] | readonly number[]
  /**
   * The whole time span of the x axis in milliseconds (such as a trading day); the line stops at the last point and the rest stays empty. Needs numeric times; without it the span is the first to the last time.
   * 横轴覆盖的整个时段（毫秒，如一个交易日）：线只画到最后一个点，右边留空；要数字 times 才生效，不给就取第一个到最后一个时间。
   */
  domain?: readonly [start: number, end: number]
  /**
   * Trading sessions in milliseconds (such as morning and afternoon); the gaps between them are squeezed out of the x axis and the line breaks there. Defaults to one session covering the domain.
   * 交易时段（毫秒，如上午、下午）：时段之间的休市在横轴上压缩掉，线在那里断开；不给整个 domain 是一段。
   */
  sessions?: readonly (readonly [start: number, end: number])[]
  /**
   * Turns a timestamp into the date and time lines of the readout (and the time ticks); written by the caller so language and time zone are its own. Without it a timestamped readout shows only the value.
   * 把时间戳写成读数里的日期与时间两行（时间刻度也用它的 time）；语言与时区由调用方定。不给时只显示数值。
   */
  formatTime?: (time: number) => { date: string; time: string }
  /**
   * Price ticks on the right and time ticks at the bottom, for large charts only (ignored below 60px high). price is on/off or the number of ticks (default 4); time is on/off or the interval in minutes, and needs numeric times plus formatTick or formatTime.
   * 右侧价格刻度与底部时间刻度，大图用（高度低于 60px 忽略）：price 是开关或档数（默认 4）；time 是开关或间隔分钟数，要数字 times 加 formatTick 或 formatTime。
   */
  axis?: SparkAxis
  /**
   * Draw the latest value as a filled tag on the right axis, in the up or down color with the matching text color.
   * 最新价价签：右轴上一个涨跌色实底小框，写最新价（用 axis.formatPrice 或 format 写成文字）。
   */
  lastTag?: boolean
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
  /**
   * Overall look: default (market panel, unchanged), instrument (research sheet: hairline neutral ink, one signal color, graticule, corner marks, projection) or ascii (terminal glyphs). instrument and ascii draw one line and ignore variant, volumes and lastTag colors.
   * 画风：default 行情面板（不变）、instrument 精密仪器档案页、ascii 终端字形；后两种只画一条线，忽略 variant 与 volumes。
   */
  look?: SparklineLook
  /**
   * The one signal color of the instrument look, as a CSS color; default var(--accent). Used only for the end dot and the annotation.
   * instrument 的唯一信号色（CSS 颜色），默认 var(--accent)，只用在末端点与批注。
   */
  signal?: string
  /**
   * instrument only (height 80 and up): draw the distribution of the values on the right, sharing the vertical axis, with a line at the current value.
   * instrument：在右侧画这列值的分布（共享纵轴），当前值处有一道横线；高度 80 以上才画。
   */
  projection?: boolean
  /**
   * How the projection is estimated: kde (default, Gaussian kernel with Silverman bandwidth) or histogram.
   * 投影谱怎么估：kde（默认，高斯核、Silverman 带宽）或 histogram（直方图）。
   */
  projectionMode?: 'kde' | 'histogram'
  /**
   * instrument only: one analyst note on a point, a hand-drawn circle around values[index] plus a sentence in the signal color; text is written by the caller.
   * instrument：一条研究员批注，在第 index 个点画手绘圈并写一句话（信号色），文字由调用方写。
   */
  annotation?: { index: number; text: string }
  /**
   * instrument only: a sheet header (top left) and a SOURCES footer (bottom left), both already written by the caller; left out when the chart is lower than 80px.
   * instrument：左上的档案编号与左下的来源行，调用方写好；高度低于 80 时省略。
   */
  meta?: { id?: string; source?: string }
  /**
   * instrument only: draw a small registration cross at the center of the plot.
   * instrument：在图中心画一个小十字准星（套准标记）。
   */
  reticle?: boolean
  /**
   * ascii only: block glyphs (one of ▁▂▃▄▅▆▇█ per column, more rows when tall) or braille dots (2 x 4 per character, continuous line). Default blocks.
   * ascii：blocks 块字符（每列一个 ▁▂▃▄▅▆▇█，高了多行）或 braille 盲文点阵（每字符 2×4 点，连续折线），默认 blocks。
   */
  glyphs?: 'blocks' | 'braille'
  /**
   * ascii only: mono (default, --font-mono) or dot (the --font-dot pixel font).
   * ascii：字体 mono（默认，--font-mono）或 dot（--font-dot 点阵字体）。
   */
  font?: 'mono' | 'dot'
  /**
   * ascii only: number of text rows; defaults to as many 12px rows as fit the height.
   * ascii：字符行数，默认按高度放得下几行 12px 的行。
   */
  rows?: number
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
  if (props.look === 'instrument') return <SparkInstrument {...props} />
  if (props.look === 'ascii') return <SparkAscii {...props} />
  return <SparkChart {...props} />
}

const TEXT_PX = 10
const LABEL_GAP = 6
/** 底部时间刻度占的高度：字高加上下留白。 */
const TIME_BAND = TEXT_PX + 8
/** 价签高度与左右内边距。 */
const TAG_H = 16
const TAG_PAD = 4
/** 带坐标轴时上下多留的像素：放得下刻度字与价签的一半高。 */
const AXIS_PAD_Y = TAG_H / 2

function SparkChart({
  values: rawValues,
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
  domain,
  sessions,
  formatTime,
  axis,
  lastTag = false,
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
  const lw = sparkLineWidth(h)

  // —— 时间轴：给了毫秒时间戳就按时间排，domain 之外与休市里的点裁掉 ——
  const stamps = isStamps(times) ? times : null
  const spans = stamps ? resolveSpans(stamps, domain, sessions) : []
  const timed = stamps !== null && spans.length > 0
  const groups = timed ? timeGroups(stamps, spans) : null
  const values = groups ? rawValues.map((value, i) => (groups[i]! >= 0 ? value : null)) : rawValues
  const nums = sparkNumbers(values)
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

  // —— 坐标轴：矮图（< 60px）太挤，忽略 ——
  const axisOn = h >= 60
  const priceCount = axisOn && axis?.price ? (axis.price === true ? 4 : Math.max(2, Math.floor(axis.price))) : 0
  const priceText = (value: number, index: number) =>
    axis?.formatPrice ? axis.formatPrice(value) : format ? format(value, index) : plainPrice(value)
  const tickText = axis?.formatTick ?? (formatTime ? (t: number) => formatTime(t).time : undefined)
  const timeOn = axisOn && timed && !!axis?.time && !!tickText
  const timeH = timeOn ? TIME_BAND : 0
  const ph = h - timeH
  const tagOn = lastTag && lastValue !== undefined
  const rightAxis = priceCount > 0 || tagOn

  const volH = volumes && volumes.length ? Math.round(ph * SPARK_VOLUME_SHARE) : 0
  // bars 的基准：不给就取第一个值（跟 baseline 样式同一个「开盘」语义）；winloss 不给按 0。
  const first = firstValid(values)
  const base = baseline ?? (variant === 'winloss' ? 0 : first >= 0 ? (values[first] as number) : 0)
  const layoutBase = {
    width: w,
    height: ph,
    bottomReserve: volH,
    baseline: variant === 'bars' ? base : baseline,
    slots: variant === 'bars' || variant === 'winloss',
    padY: rightAxis ? AXIS_PAD_Y + 1 : SPARK_PAD_Y,
  }
  // 值域只看数据，与右边留多宽无关：先排一遍拿到最高最低，才好量刻度字有多宽，再定右边留白。
  const range = sparkLayout(values, layoutBase)
  const tickValues = priceCount ? priceTicks(range.lo, range.hi, priceCount) : []
  const tickWidths = tickValues.map((v) => measureText(priceText(v, -1), font))
  const tagText = tagOn ? priceText(lastValue, lastIdx) : ''
  const tagW = tagOn ? Math.max(measureText(tagText, font), ...tickWidths, 0) + TAG_PAD * 2 : 0
  const axisW = tagOn ? tagW : Math.max(0, ...tickWidths)
  const showLastLabel = !!lastLabel && !rightAxis
  const lastLabelW = showLastLabel ? measureText(lastLabel, font) : 0
  const dotR = h >= 60 ? 3 : 2
  const ringOn = hasLast && h >= 28
  const ringR = dotR + 2.5
  const lastPad = hasLast ? (ringOn ? Math.ceil(ringR) + 1 : dotR + 1) : 1
  const layout0 = sparkLayout(values, {
    ...layoutBase,
    padRight: lastPad + (showLastLabel ? LABEL_GAP + lastLabelW : 0) + (rightAxis ? axisW + LABEL_GAP : 0),
  })
  const layout = timed ? { ...layout0, xs: timeXs(stamps, spans, layout0.left, layout0.right) } : layout0
  const points = sparkLayoutPoints(values, layout, dpr, lw)
  const floorY = volH ? layout.bottom + 3 : ph
  const baseY = baseline !== undefined && isSparkValue(baseline) ? snapLine(yAt(layout, baseline), 1, dpr) : null
  const runGroups = groups ?? undefined
  const lineD = isLine ? linePath(points, curve, runGroups) : ''
  // baseline 样式不给基准时用第一个值当基准（TradingView 的 Baseline 默认也是第一根）。
  const splitY = variant === 'baseline' ? (baseY ?? snapLine(yAt(layout, base), 1, dpr)) : null
  const splitClips = splitY === null ? null : baselineClips(splitY, w, ph)
  const areaFloor = variant === 'baseline' && splitY !== null ? splitY : floorY

  // —— 实时：新点追加时线、面积、末端点一起平滑延伸 ——
  const lineMain = useRef<SVGPathElement>(null)
  const lineAlt = useRef<SVGPathElement>(null)
  const areaMain = useRef<SVGPathElement>(null)
  const areaAlt = useRef<SVGPathElement>(null)
  const dot = useRef<SVGCircleElement>(null)
  const ring = useRef<SVGCircleElement>(null)
  const halo = useRef<SVGCircleElement>(null)
  const followers: LineFollower[] = isLine
    ? [
        { ref: lineAlt, write: (el, p) => el.setAttribute('d', linePath(p, curve, runGroups)) },
        { ref: areaMain, write: (el, p) => el.setAttribute('d', areaPath(p, areaFloor, curve, runGroups)) },
        { ref: areaAlt, write: (el, p) => el.setAttribute('d', areaPath(p, areaFloor, curve, runGroups)) },
        { ref: dot, write: (el, p) => moveTo(el, p[lastIdx]) },
        { ref: ring, write: (el, p) => moveTo(el, p[lastIdx]) },
        { ref: halo, write: (el, p) => moveTo(el, p[lastIdx]) },
      ]
    : []
  useLineExtend(
    lineMain,
    'd',
    isLine ? nums : [],
    isLine ? points : [],
    (p) => linePath(p, curve, runGroups),
    followers,
  )
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
  // 读数的日期与时间两行：时间戳要 formatTime 才写得出来；文字 times 原样当第二行。
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

  const bars = variant === 'bars' ? barRects(values, layout, base, dpr) : []
  const cells = variant === 'winloss' ? winLossCells(values, layout, base, dpr) : []
  const vols = volH ? volumeRects(volumes ?? [], values, layout, volH, dpr) : []
  const extremes = showExtremes ? sparkExtremes(values) : null
  const px = (p: LinePoint | undefined) => (p && Number.isFinite(p[1]) ? p : null)
  const lastPoint = px(points[lastIdx])

  function xOf(i: number) {
    return snapLine(isLine ? (points[i]?.[0] ?? 0) : xAt(layout, i), 1, dpr)
  }
  const hoverY =
    at === null
      ? 0
      : isLine
        ? (px(points[at])?.[1] ?? ph / 2)
        : variant === 'bars'
          ? yAt(layout, values[at] as number)
          : ph / 2

  // 读数框是 HTML（foreignObject 里），宽高要量真实 DOM 才摆得准；量到之前先藏起来。
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
  const tip =
    at === null
      ? null
      : {
          cx: xOf(at),
          ...tipPlacement(xOf(at), hoverY, tipSize?.w ?? 0, tipSize?.h ?? 0, { width: w, height: ph }),
        }

  // 时间刻度：自动挑一个放得下的间隔，再把挤在一起的丢掉（不重叠、不出框）。
  const ticks = (() => {
    if (!timeOn || !tickText) return []
    const sample = measureText(tickText(spans[0]![0]), font)
    const minutes =
      typeof axis?.time === 'number'
        ? axis.time
        : autoTickMinutes(spans, Math.floor((layout.right - layout.left) / (sample + 12)))
    const all = timeTicks(spans, minutes).map((t) => {
      const text = tickText(t)
      return { t, text, x: timeX(t, spans, layout.left, layout.right), width: measureText(text, font) }
    })
    return thinLabels(all, w).map((i) => all[i]!)
  })()

  const gradientId = `ks${uid}a`
  const gradientUp = `ks${uid}u`
  const gradientDown = `ks${uid}d`
  const clipUp = `ks${uid}cu`
  const clipDown = `ks${uid}cd`
  const tagY = lastPoint ? Math.min(Math.max(lastPoint[1], TAG_H / 2), ph - TAG_H / 2) : 0

  const body = (
    <svg
      ref={svg}
      className={`k-spark${className ? ` ${className}` : ''} is-${resolvedTone}`}
      style={lw === 1.5 ? undefined : ({ '--k-spark-lw': `${lw}px` } as CSSProperties)}
      viewBox={`0 0 ${w} ${h}`}
      role="img"
      aria-label={label}
      data-variant={variant}
      data-curve={curve}
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

      {tickValues.map((value, k) => {
        const text = priceText(value, -1)
        return (
          <text
            key={k}
            className="k-spark-text k-spark-price-tick"
            x={w}
            y={Math.min(Math.max(yAt(layout, value), TEXT_PX / 2), ph - TEXT_PX / 2)}
            textAnchor="end"
          >
            {text}
          </text>
        )
      })}
      {ticks.map((tick) => (
        <text
          key={tick.t}
          className="k-spark-text k-spark-time-tick"
          x={Math.max(0, Math.min(tick.x - tick.width / 2, w - tick.width))}
          y={ph + TIME_BAND / 2}
        >
          {tick.text}
        </text>
      ))}

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
          d={areaPath(points, floorY, curve, runGroups)}
          fill={`url(#${gradientId})`}
        />
      )}
      {variant === 'baseline' && splitClips && (
        <>
          <g clipPath={`url(#${clipUp})`} className="k-spark-up">
            <path
              ref={areaMain}
              className="k-spark-area"
              d={areaPath(points, areaFloor, curve, runGroups)}
              fill={`url(#${gradientUp})`}
            />
            <path ref={lineMain} className="k-spark-line" d={lineD} data-points={sparkCount(values)} />
          </g>
          <g clipPath={`url(#${clipDown})`} className="k-spark-down">
            <path
              ref={areaAlt}
              className="k-spark-area"
              d={areaPath(points, areaFloor, curve, runGroups)}
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
                    y={Math.min(Math.max(p[1], TEXT_PX / 2 + 1), ph - TEXT_PX / 2 - 1)}
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
          r={ringR + 3}
        />
      )}
      {ringOn && lastPoint && (
        <circle ref={ring} className="k-spark-ring" cx={lastPoint[0]} cy={lastPoint[1]} r={ringR} />
      )}
      {hasLast && lastPoint && (
        <circle ref={dot} className="k-spark-dot" cx={lastPoint[0]} cy={lastPoint[1]} r={dotR} />
      )}
      {showLastLabel && lastPoint && (
        <text
          className="k-spark-text k-spark-last"
          x={w}
          y={Math.min(Math.max(lastPoint[1], TEXT_PX / 2 + 1), ph - TEXT_PX / 2 - 1)}
          textAnchor="end"
        >
          {lastLabel}
        </text>
      )}
      {tagOn && lastPoint && (
        <g className={`k-spark-tag is-${resolvedTone}`} data-last-tag="">
          <rect x={w - tagW} y={tagY - TAG_H / 2} width={tagW} height={TAG_H} rx={2} />
          <text x={w - tagW / 2} y={tagY} textAnchor="middle">
            {tagText}
          </text>
        </g>
      )}

      {tip && (
        <g className="k-spark-hover" pointerEvents="none">
          <line className="k-spark-cursor" x1={tip.cx} x2={tip.cx} y1={0} y2={ph} />
          {isLine && px(points[at!]) && (
            <circle className="k-spark-dot is-hover" cx={points[at!]![0]} cy={points[at!]![1]} r={dotR} />
          )}
          <foreignObject
            className="k-spark-tipbox"
            x={tip.x}
            y={tip.y}
            width={TIPBOX_W}
            height={TIPBOX_H}
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

/** 读数框外壳（foreignObject）的宽高：只是个够大的容器，真正的大小由里面的 div 撑开。 */
const TIPBOX_W = 260
const TIPBOX_H = 140
