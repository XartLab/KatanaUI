// SPDX-License-Identifier: MIT
// 迷你图的「终端字形」画风（look="ascii"）：用字符画走势，两种成熟做法——
// blocks：经典终端 sparkline（Zach Holman 的 spark）每列一个 ▁▂▃▄▅▆▇█，高了多行，每行 8 级；
// braille：盲文点阵（drawille、asciichart 的做法）每个字符 2 × 4 个点，画连续折线。
// 列数按容器宽与等宽字宽算（text-measure 量字宽，不量 DOM）；整幅是一个 <pre>，同色连续字符合并成一个 span；新点进来整幅左移一列、新列「乱码落定」。几何在 ./sparkline-model.ts。
import { useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from 'react'
import { lineGrowth } from '../lib/live-line.ts'
import { LIVE_REORDER_MS } from '../lib/live.ts'
import { fontFor, measureText } from '../lib/text-measure.ts'
import {
  BLOCK_GLYPHS,
  blockRows,
  brailleRows,
  columnValues,
  columnValuesAt,
  isSparkValue,
  resolveSparkTone,
  seededRandom,
  sessionColumns,
  sparkNumbers,
  stepIndex,
  timeGroups,
  tipPlacement,
  type SparkValue,
} from './sparkline-model.ts'
import { isStamps, resolveSpans, useBox, useTextEpoch, useThrottledText } from './sparkline-shared.ts'
import type { SparklineProps } from './sparkline.tsx'

const W = 200
const H = 36
/** 字符行高与字号（px）：块字符要靠行高等于字号才上下接得上。 */
const LINE = 12
/** 乱码落定的帧数（3 到 5 帧里取中间）。 */
const SCRAMBLE_FRAMES = 4

type Mark = '' | 'is-signal' | 'is-dim'

/** 一行字按列的标记合并成连续的 run（同标记连续字符一个节点）。 */
function runsOf(row: string, marks: readonly Mark[]): { text: string; mark: Mark }[] {
  const out: { text: string; mark: Mark }[] = []
  Array.from(row).forEach((ch, c) => {
    const mark = marks[c] ?? ''
    const last = out[out.length - 1]
    if (last && last.mark === mark) last.text += ch
    else out.push({ text: ch, mark })
  })
  return out
}

/** 乱码用的字形：blocks 在 ▁–█ 里挑，braille 在盲文里挑；按帧与位置播种，同一帧同一个结果。 */
function noiseGlyph(kind: 'blocks' | 'braille', seed: number): string {
  const r = seededRandom(seed)()
  return kind === 'blocks'
    ? BLOCK_GLYPHS[Math.floor(r * BLOCK_GLYPHS.length)]!
    : String.fromCharCode(0x2801 + Math.floor(r * 255))
}

export function SparkAscii({
  values: rawValues,
  label,
  tone,
  baseline,
  interactive = false,
  format,
  times,
  domain,
  sessions,
  formatTime,
  onHover,
  width,
  height,
  className,
  glyphs = 'blocks',
  font: fontKind = 'mono',
  rows: rowsProp,
}: SparklineProps) {
  const root = useRef<HTMLSpanElement>(null)
  const { w, h } = useBox(root, width ?? W, height ?? H)
  const epoch = useTextEpoch()
  const scale = glyphs === 'braille' ? 2 : 1

  // —— 时间轴 ——
  const stamps = isStamps(times) ? times : null
  const spans = stamps ? resolveSpans(stamps, domain, sessions) : []
  const timed = stamps !== null && spans.length > 0
  const groups = timed ? timeGroups(stamps, spans) : null
  const values = groups ? rawValues.map((value, i) => (groups[i]! >= 0 ? value : null)) : rawValues
  const nums = useMemo(() => sparkNumbers(values), [values])
  const resolvedTone = tone ? resolveSparkTone(values, tone, baseline) : null

  // —— 列数：容器宽除以一个字符的宽（量字体，不量 DOM）——
  const family = fontKind === 'dot' ? '--font-dot' : '--font-mono'
  const fontStr = useMemo(
    () => fontFor(400, LINE, family),
    // epoch 变了说明字体加载完，要重取。
    // oxlint-disable-next-line react-hooks/exhaustive-deps
    [family, epoch],
  )
  const sample = glyphs === 'braille' ? '⣿' : '█'
  const charW = Math.max(1, measureText(sample, fontStr))
  const cols = Math.max(2, Math.floor(w / charW))
  const rows = Math.max(1, rowsProp ?? Math.floor(h / LINE))

  // —— 值排进列 ——
  const dotCols = cols * scale
  const finite = baseline !== undefined && Number.isFinite(baseline) ? [...nums, baseline] : nums
  let lo = finite.length ? Math.min(...finite) : 0
  let hi = finite.length ? Math.max(...finite) : 1
  if (hi === lo) {
    lo -= 0.5
    hi += 0.5
  }
  const session = timed ? sessionColumns(stamps, spans, cols, scale) : null
  const gaps = session?.gaps ?? []
  const colVals: SparkValue[] = session
    ? columnValuesAt(
        values,
        session.colOf,
        dotCols,
        gaps.flatMap((g) => Array.from({ length: scale }, (_, k) => g * scale + k)),
      )
    : columnValues(values, dotCols)
  const lines = glyphs === 'braille' ? brailleRows(colVals, cols, rows, lo, hi) : blockRows(colVals, rows, lo, hi)

  // 每个源下标落在哪个字符列（悬停、读数用）。
  const charColOf = (i: number): number => {
    if (session) return session.colOf[i]! < 0 ? -1 : Math.floor(session.colOf[i]! / scale)
    return Math.round((i / Math.max(1, values.length - 1)) * (cols - 1))
  }
  // 最新一列：最后一个有值的点格所在的字符列。
  let lastCol = -1
  colVals.forEach((v, c) => {
    if (isSparkValue(v)) lastCol = Math.floor(c / scale)
  })

  // 基准线所在的行（自上数）。
  let baseRow = -1
  if (baseline !== undefined && Number.isFinite(baseline)) {
    const unit = (baseline - lo) / (hi - lo)
    baseRow =
      glyphs === 'braille'
        ? Math.floor(Math.round((1 - unit) * (rows * 4 - 1)) / 4)
        : rows - 1 - Math.floor(Math.round(unit * (rows * 8 - 1)) / 8)
    baseRow = Math.min(rows - 1, Math.max(0, baseRow))
  }

  // —— 实时：新点进来时最新一列先乱几帧再落定（整幅左移由数据本身带来）——
  const [scramble, setScramble] = useState<number | null>(null)
  const prevNums = useRef<readonly number[] | null>(null)
  useEffect(() => {
    const before = prevNums.current
    prevNums.current = nums
    if (!before || !lineGrowth(before, nums)) return
    let frame = 0
    setScramble(0)
    const timer = setInterval(() => {
      frame += 1
      if (frame >= SCRAMBLE_FRAMES) {
        clearInterval(timer)
        setScramble(null)
      } else setScramble(frame)
    }, LIVE_REORDER_MS / SCRAMBLE_FRAMES)
    return () => clearInterval(timer)
    // nums 是 useMemo 出来的，值变了才是新数组。
  }, [nums])

  // 盲文画风里空格、休市、基准也都用盲文字符（同一个回退字体，宽度一致才对得齐列）：空白 ⠀、休市 ⡇、基准 ⠤。
  const braille = glyphs === 'braille'
  const blank = braille ? '\u2800' : ' '
  const gapChar = braille ? '⡇' : '┊'
  const baseChar = braille ? '⠤' : '┄'
  // 最新一列各行的目标字形（乱码落定后页面上就是它；测试与调试读它）。
  const lastGlyphs = lastCol >= 0 ? lines.map((line) => Array.from(line)[lastCol] ?? blank).join('') : ''
  const body = lines.map((raw, r) => {
    const marks: Mark[] = Array.from({ length: cols }, (_, c) => (gaps.includes(c) ? 'is-dim' : ''))
    // 休市列画 ┊，基准那一行的空格画 ┄（都是弱色）。
    const chars = Array.from(raw).map((ch, c) => {
      if (gaps.includes(c)) return gapChar
      if (r === baseRow && ch === blank) {
        marks[c] = 'is-dim'
        return baseChar
      }
      return ch
    })
    if (lastCol >= 0 && chars[lastCol] !== blank && chars[lastCol] !== baseChar && chars[lastCol] !== gapChar) {
      if (scramble !== null) chars[lastCol] = noiseGlyph(glyphs, scramble * 977 + lastCol * 31 + r)
      marks[lastCol] = resolvedTone ? '' : 'is-signal'
    }
    return runsOf(chars.join(''), marks)
  })

  // —— 悬停与键盘：读数框照旧（HTML 三行），位置按字符列算 ——
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
  const onMove = (event: PointerEvent<HTMLSpanElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    if (!rect.width) return
    const col = Math.floor((((event.clientX - rect.left) / rect.width) * w) / charW)
    let best = -1
    let gap = Infinity
    values.forEach((v, i) => {
      const c = charColOf(i)
      if (!isSparkValue(v) || c < 0) return
      if (Math.abs(c - col) < gap) {
        gap = Math.abs(c - col)
        best = i
      }
    })
    setActive(best >= 0 ? best : null)
  }
  const onKey = (event: KeyboardEvent<HTMLSpanElement>) => {
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
  useEffect(() => {
    const el = tipRef.current
    if (!el) return
    const next = { w: el.offsetWidth, h: el.offsetHeight }
    setTipSize((prev) => (prev && prev.w === next.w && prev.h === next.h ? prev : next))
  }, [at, tipValue, tipStamp?.date, tipStamp?.time])
  const hoverCol = at === null ? -1 : charColOf(at)
  const tip =
    at === null || hoverCol < 0
      ? null
      : tipPlacement((hoverCol + 0.5) * charW, h / 2, tipSize?.w ?? 0, tipSize?.h ?? 0, { width: w, height: h })

  const style = {
    '--k-ascii-char': `${charW}px`,
    '--k-ascii-lines': rows,
    ...(height ? { height } : null),
  } as CSSProperties
  const view = (
    <span
      ref={root}
      className={`k-spark-ascii${fontKind === 'dot' ? ' is-dot' : ''}${resolvedTone ? ` is-${resolvedTone}` : ''}${className ? ` ${className}` : ''}`}
      style={style}
      role="img"
      aria-label={label}
      data-look="ascii"
      data-glyphs={glyphs}
      data-cols={cols}
      data-last={lastGlyphs || undefined}
      data-scrambling={scramble !== null ? '' : undefined}
      data-rows={rows}
      tabIndex={interactive ? 0 : undefined}
      onPointerMove={interactive ? onMove : undefined}
      onPointerLeave={interactive ? () => setActive(null) : undefined}
      onKeyDown={interactive ? onKey : undefined}
      onBlur={interactive ? () => setActive(null) : undefined}
    >
      <pre className="k-spark-ascii-pre" aria-hidden="true">
        {body.map((runs, r) => (
          <span key={r} className="k-spark-ascii-row">
            {runs.map((run, k) =>
              run.mark ? (
                <span key={k} className={run.mark}>
                  {run.text}
                </span>
              ) : (
                run.text
              ),
            )}
            {r < body.length - 1 ? '\n' : ''}
          </span>
        ))}
      </pre>
      {at !== null && hoverCol >= 0 && (
        <span className="k-spark-ascii-cursor" style={{ left: hoverCol * charW, width: charW }} aria-hidden="true" />
      )}
      {tip && (
        <span
          className="k-spark-ascii-tipbox"
          style={{ left: tip.x, top: tip.y, visibility: tipSize ? undefined : 'hidden' }}
        >
          <div ref={tipRef} className="k-spark-tip">
            <div className="k-spark-tip-value">{tipValue}</div>
            {tipStamp?.date && <div className="k-spark-tip-date">{tipStamp.date}</div>}
            {tipStamp?.time && <div className="k-spark-tip-time">{tipStamp.time}</div>}
          </div>
        </span>
      )}
    </span>
  )
  if (!interactive) return view
  return (
    <>
      {view}
      <span className="sr-only" role="status" aria-live="polite">
        {announced}
      </span>
    </>
  )
}
