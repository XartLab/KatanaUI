// SPDX-License-Identifier: MIT
// 跑马灯（#77 第 5 条，#22「跑马灯」）：一排品种（徽标 + 代码 + 最新价 + 涨跌幅，可带迷你走势）横向无缝循环滚动。
// 功能参照 TradingView Ticker Tape 小组件（widget-docs 的 Ticker Tape 页，主会话 2026-11-18 在 Chrome 实测）：两行（上行徽标与代码，下行价、币种、涨跌幅），
//   右边可带一段走势；项之间一道竖分隔线；指针停在某项上整条停住、那一项提亮底色；点品种联动。只学给人看什么、怎么交互，不嵌不抄；颜色走我们的涨跌语义色，不用 TV 蓝。
// 实现：同一排画两遍（第二遍 aria-hidden + inert，键盘与读屏只走一遍），CSS 动画把整条从 0 平移到 -50%，循环处接缝看不出来；
//   时长按「一遍的宽度 / speed」算（ResizeObserver 量），写进 --k-ticker-duration；只动 translate，留在合成线程上。
//   停：指针在条上、焦点在条里（:hover、:focus-within）、暂停钮按下（data-paused）。暂停钮必有（WCAG 2.2.2：自动动、超过 5 秒、跟别的内容并排就要能停），
//   文字在「暂停 / 继续」间换，不加 aria-pressed（modern-web-guidance motion）。
//   prefers-reduced-motion: reduce 或 mode="static"：不动、只画一遍，条可以横向滚动（键盘也能滚：滚动区可聚焦）；CSS 里动画也只写在 no-preference 里（同一份指南）。
// 价：FlashPrice 只闪变了的尾数；涨跌幅：ChangeText（data-updown 跟红涨绿跌）；徽标：SymbolMark sm（18px）。
import { PauseIcon, PlayIcon } from 'lucide-react'
import { useLayoutEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from 'react'
import { cn } from '../lib/cn.ts'
import { ChangeText } from './change-text.tsx'
import { FlashPrice } from './flash-price.tsx'
import { plainPrice, type FormatPrice, type QuoteRow } from './quote-row.ts'
import { Sparkline } from './sparkline.tsx'
import { SymbolMark } from './symbol-mark.tsx'

/** 一项：行情行加可选的徽标图、币种与走势。 */
export type TickerItem = QuoteRow & {
  /** Logo image URL; letters are drawn when omitted. */
  logo?: string
  /** Currency written small after the price (USD). */
  currency?: string
  /** Recent values for the mini trend on the right (stacked layout only). */
  series?: readonly number[]
}

export type TickerTapeLabels = {
  /** 整条的读屏名（「行情跑马灯」）。 */
  region: string
  /** 暂停钮的两种字。 */
  pause: string
  resume: string
  /** 走势图的读屏名：拿到这一项，返回一句话。不给就不画走势。 */
  trend?: (item: TickerItem) => string
}

export type TickerTapeProps = {
  /** The symbols, in order. */
  items: readonly TickerItem[]
  /** All text: region name, pause and resume, trend names. 文字全由调用方给。 */
  labels: TickerTapeLabels
  /** Price text; the caller knows each symbol's precision. Default two decimals. */
  formatPrice?: FormatPrice | ((value: number, item: TickerItem) => string)
  /** stacked: two lines per item with an optional trend (TradingView's current tape); inline: one compact line. Default stacked. */
  layout?: 'stacked' | 'inline'
  /** scroll (default) loops; static stands still and scrolls by hand. Reduced motion always behaves as static. */
  mode?: 'scroll' | 'static'
  /** Scroll speed in pixels per second; default 40. */
  speed?: number
  /** Paused from outside (controlled); the pause button then calls onPausedChange. */
  paused?: boolean
  /** Called when the pause button is pressed. */
  onPausedChange?: (paused: boolean) => void
  /** Clicking an item (link to a chart, a watchlist); items become buttons when given. */
  onSelect?: (item: TickerItem) => void
  /** Extra class name on the root. */
  className?: string
}

const priceText = (format: TickerTapeProps['formatPrice'], item: TickerItem) =>
  format ? (format as (value: number, item: TickerItem) => string)(item.last, item) : plainPrice(item.last)

function TickerEntry({
  item,
  layout,
  labels,
  formatPrice,
  onSelect,
}: {
  item: TickerItem
  layout: 'stacked' | 'inline'
  labels: TickerTapeLabels
  formatPrice: TickerTapeProps['formatPrice']
  onSelect?: (item: TickerItem) => void
}) {
  const body = (
    <>
      <span className="k-ticker-head">
        <SymbolMark symbol={item.symbol} name={item.name ?? item.symbol} src={item.logo} size="sm" />
        <span className="k-ticker-code">{item.symbol}</span>
      </span>
      <span className="k-ticker-quote">
        <FlashPrice value={item.last} text={priceText(formatPrice, item)} className="k-ticker-last" />
        {item.currency ? <span className="k-ticker-ccy">{item.currency}</span> : null}
        <ChangeText value={item.changePct} className="k-ticker-change" />
      </span>
      {layout === 'stacked' && labels.trend && item.series && item.series.length > 1 ? (
        <span className="k-ticker-trend">
          <Sparkline values={item.series} label={labels.trend(item)} variant="area" showLast={false} />
        </span>
      ) : null}
    </>
  )
  return onSelect ? (
    <button type="button" className="k-ticker-item" data-slot="ticker-item" onClick={() => onSelect(item)}>
      {body}
    </button>
  ) : (
    <span className="k-ticker-item" data-slot="ticker-item">
      {body}
    </span>
  )
}

// 系统「减少动态效果」：跑马灯是持续自动的动画，跟这一项（派发 #77 时明确要求）。与 theme/motion.css 头部「产品不跟减少动态效果」的底线不同：那条管的是进出场过渡，这里写进 guidance 待用户定。
const REDUCE = '(prefers-reduced-motion: reduce)'
const subscribeReduce = (notify: () => void) => {
  const query = globalThis.matchMedia?.(REDUCE)
  query?.addEventListener('change', notify)
  return () => query?.removeEventListener('change', notify)
}
const reduceNow = () => globalThis.matchMedia?.(REDUCE).matches ?? false

/** 行情跑马灯：一排品种横向无缝循环，悬停与聚焦时停，暂停钮必有，减少动态时静止可横向滚动。 */
export function TickerTape({
  items,
  labels,
  formatPrice,
  layout = 'stacked',
  mode = 'scroll',
  speed = 40,
  paused: pausedProp,
  onPausedChange,
  onSelect,
  className,
}: TickerTapeProps) {
  const [pausedState, setPausedState] = useState(false)
  const paused = pausedProp ?? pausedState
  const setPaused = (next: boolean) => {
    if (pausedProp === undefined) setPausedState(next)
    onPausedChange?.(next)
  }
  const lane = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  useLayoutEffect(() => {
    const node = lane.current
    if (!node) return
    setWidth(node.offsetWidth)
    const observer = new ResizeObserver(() => setWidth(node.offsetWidth))
    observer.observe(node)
    return () => observer.disconnect()
  }, [])
  const reduced = useSyncExternalStore(subscribeReduce, reduceNow, () => false)
  const scrolling = mode === 'scroll' && !reduced && items.length > 0
  const style = { '--k-ticker-duration': `${Math.max(1, width / Math.max(1, speed))}s` } as CSSProperties
  const entries = (copy: boolean) => (
    <div
      ref={copy ? undefined : lane}
      className="k-ticker-lane"
      data-copy={copy || undefined}
      aria-hidden={copy || undefined}
      inert={copy || undefined}
      role={copy ? undefined : 'list'}
    >
      {items.map((item) => (
        <span key={item.id} role={copy ? undefined : 'listitem'} className="k-ticker-cell">
          <TickerEntry item={item} layout={layout} labels={labels} formatPrice={formatPrice} onSelect={onSelect} />
        </span>
      ))}
    </div>
  )
  return (
    <section
      className={cn('k-ticker', className)}
      data-slot="ticker-tape"
      data-layout={layout}
      data-mode={scrolling ? 'scroll' : 'static'}
      data-paused={paused || undefined}
      aria-label={labels.region}
    >
      {/* 静止时滚动区可聚焦，键盘能横向滚（滚动时整条在动，不给 tabindex）。 */}
      <div className="k-ticker-viewport" tabIndex={scrolling ? undefined : 0}>
        <div className="k-ticker-track" style={style}>
          {entries(false)}
          {scrolling ? entries(true) : null}
        </div>
      </div>
      {scrolling ? (
        <button
          type="button"
          className="k-ticker-toggle"
          data-slot="ticker-toggle"
          aria-label={paused ? labels.resume : labels.pause}
          title={paused ? labels.resume : labels.pause}
          onClick={() => setPaused(!paused)}
        >
          {paused ? <PlayIcon size={12} aria-hidden="true" /> : <PauseIcon size={12} aria-hidden="true" />}
        </button>
      ) : null}
    </section>
  )
}
