// SPDX-License-Identifier: MIT
/**
 * Cell renderers of DataGrid: the default cell body and the live flashing cell.
 * DataGrid 的格子（体检 §7 从 data-grid.tsx 拆出）：默认格子内容、实时模式下值变了闪涨跌色的数值格。
 */
import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { cn } from '../../lib/cn.ts'
import { useValueFlash } from '../../lib/live.ts'
import { LimitStatus } from '../../cn/limit-status.tsx'
import { StreakBadge } from '../../cn/streak-badge.tsx'
import { RangeBar } from '../../quotes/range-bar.tsx'
import { RatingText } from '../../quotes/rating-text.tsx'
import { Sparkline } from '../../quotes/sparkline.tsx'
import { SymbolMark } from '../../quotes/symbol-mark.tsx'
import { ToneText } from '../../quotes/tone-text.tsx'
import { barRatio, type ResolvedCell } from './columns.ts'

/** 数值类的列才闪：文本、时间、买卖、品种、评级、图形列变了不闪（闪色只表达涨跌）。 */
export const FLASH_TYPES: ReadonlySet<string> = new Set([
  'number',
  'price',
  'quantity',
  'pnl',
  'change',
  'percent',
  'compact',
])

/** 一个数值格：值变了闪涨跌色（共用层 useValueFlash，1 秒节流）；格子是定位与滚动的最小单元，key 换掉让 CSS 动画重放。 */
export function FlashCell({
  value,
  className,
  children,
  ...rest
}: {
  value: number | null
  className: string
  children: ReactNode
  role: string
  style: CSSProperties
  title: string | undefined
  'data-col': string
  'data-type': string
  'data-heat'?: string
}) {
  const { flash, key } = useValueFlash(value)
  return (
    <div key={key} {...rest} className={cn(className, 'k-live-flash')} data-flash={flash ?? undefined}>
      {children}
    </div>
  )
}

/** 品种格（#90）：按 parts 依次画徽标、代码（纯字或芯片）、全称、场所小字；芯片样式照 TradingView 选股器，见 theme/data-grid.css。 */
function SymbolCell({ symbol }: { symbol: NonNullable<ResolvedCell['symbol']> }) {
  const chip = symbol.parts.includes('chip')
  return symbol.parts.map((part) => {
    switch (part) {
      case 'logo':
        return (
          <SymbolMark
            key={part}
            symbol={symbol.code}
            name={symbol.name}
            src={symbol.icon?.src}
            size={chip ? 'sm' : 16}
          />
        )
      case 'code':
        return (
          <span key={part} className="k-grid-name">
            {symbol.code}
          </span>
        )
      case 'chip':
        return (
          <span key={part} className="k-grid-chip">
            {symbol.code}
          </span>
        )
      case 'name':
        return symbol.name ? (
          <span key={part} className="k-grid-fullname">
            {symbol.name}
          </span>
        ) : null
      case 'venue':
        return symbol.venue ? (
          <span key={part} className="k-grid-tag">
            {symbol.venue}
          </span>
        ) : null
      default:
        return null
    }
  })
}

/** 数字与单位：单位另起一段小字（次要色），中间留一个空格，复制出来仍是「4.53 T USD」。 */
function Value({ resolved, ellipsis }: { resolved: ResolvedCell; ellipsis?: boolean }) {
  const main =
    resolved.direction !== undefined ? (
      <ToneText tone={resolved.direction}>{resolved.main}</ToneText>
    ) : ellipsis && !resolved.unit ? (
      <span className="k-grid-name">{resolved.main}</span>
    ) : (
      resolved.main
    )
  if (!resolved.unit) return main
  return (
    <span className="k-grid-val">
      {main} <span className="k-grid-unit">{resolved.unit}</span>
    </span>
  )
}

/**
 * 一格里的内容：品种拆成徽标、代码、名称；评级、迷你图、区间复用 RatingText、Sparkline、RangeBar；pill、streak、limitStatus、progress、bar 各有画法；
 * 有方向的类型（盈亏、涨跌幅、买卖）用 ToneText 跟 data-updown；数字后的单位小一号。
 */
export function CellBody({
  resolved,
  extent,
  ellipsis,
  maxPills,
}: {
  resolved: ResolvedCell
  extent: number
  /** 纯文字写进 .k-grid-name，超长时省略号截断（cell 是 flex，文字本身不出省略号）。 */
  ellipsis?: boolean
  maxPills?: number
}) {
  if (resolved.pills) return <PillCell pills={resolved.pills} max={maxPills} />
  if (resolved.streak) {
    const { value, form, labels } = resolved.streak
    return <StreakBadge streak={value} form={form} labels={labels} />
  }
  if (resolved.limitStatus) {
    return <LimitStatus status={resolved.limitStatus.value} labels={resolved.limitStatus.labels} />
  }
  if (resolved.progress) {
    const { done, total, ratio } = resolved.progress
    return (
      <>
        <span className="k-grid-progress-text">
          {done}/{total}
        </span>
        <span className="k-grid-progress" data-slot="grid-progress" aria-hidden="true">
          {ratio !== undefined && <i style={{ width: `${ratio * 100}%` }} />}
        </span>
      </>
    )
  }
  if (resolved.barShare !== undefined) {
    // 给了 barMax：单边中性横条（相对成交量这类有大小没正负的量，#90）。
    return (
      <>
        <span className="k-grid-bar is-share" data-slot="grid-bar" aria-hidden="true">
          <i style={{ width: `${resolved.barShare * 100}%` }} />
        </span>
        <span className="k-grid-bar-text">
          <Value resolved={resolved} />
        </span>
      </>
    )
  }
  if (resolved.bar !== undefined) {
    const ratio = barRatio(resolved.bar, extent)
    return (
      <>
        <span className="k-grid-bar" data-slot="grid-bar" data-dir={ratio > 0 ? 'up' : ratio < 0 ? 'down' : 'flat'}>
          <i style={{ width: `${Math.abs(ratio) * 50}%`, [ratio < 0 ? 'right' : 'left']: '50%' }} />
        </span>
        <span className="k-grid-bar-text">
          <Value resolved={resolved} />
        </span>
      </>
    )
  }
  if (resolved.symbol) return <SymbolCell symbol={resolved.symbol} />
  const visual = resolved.visual
  switch (visual?.kind) {
    case 'rating':
      return <RatingText level={visual.level}>{resolved.text}</RatingText>
    case 'spark':
      return (
        <span className="k-grid-spark">
          <Sparkline values={visual.values} label={visual.label} variant="line" showLast={false} height={24} />
        </span>
      )
    case 'range':
      return (
        <RangeBar
          className="k-grid-range"
          low={visual.low}
          high={visual.high}
          value={visual.value}
          label={visual.label}
          format={(value) =>
            value.toLocaleString('en-US', {
              minimumFractionDigits: visual.digits,
              maximumFractionDigits: visual.digits,
            })
          }
        />
      )
    default:
      return <Value resolved={resolved} ellipsis={ellipsis} />
  }
}

/** 胶囊的「+n」预留的宽度（px）与胶囊之间的间距，跟 data-grid.css 的 .k-grid-pill 一致。 */
const PILL_MORE_WIDTH = 32
const PILL_GAP = 4

/**
 * pill 列的一格：多枚短标签排成一行，装不下的收成「+n」（悬停的 title 写全部）。
 * 先按 maxPills 截（服务端渲染与首帧就是这个数），挂载后量每枚的宽，按格子宽度再往下收；格子变宽变窄时重算。
 */
function PillCell({ pills, max }: { pills: NonNullable<ResolvedCell['pills']>; max?: number }) {
  const box = useRef<HTMLSpanElement | null>(null)
  const cap = Math.min(pills.length, max ?? pills.length)
  const [fit, setFit] = useState(cap)
  const key = pills.map((pill) => pill.label).join('\u0000')
  useLayoutEffect(() => {
    const el = box.current
    if (!el) return
    const measure = () => {
      const nodes = Array.from(el.querySelectorAll<HTMLElement>('[data-pill]'))
      const widths = nodes.map((node) => {
        const was = node.hidden
        node.hidden = false
        const width = node.offsetWidth
        node.hidden = was
        return width
      })
      const room = el.clientWidth
      const total = widths.length
      let count = 0
      for (let k = Math.min(cap, total); k >= 0; k--) {
        const used = widths.slice(0, k).reduce((sum, width) => sum + width, 0) + Math.max(0, k - 1) * PILL_GAP
        const more = k < total ? (k > 0 ? PILL_GAP : 0) + PILL_MORE_WIDTH : 0
        if (used + more <= room) {
          count = k
          break
        }
      }
      setFit(room > 0 ? count : cap)
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [key, cap])
  const shown = Math.min(fit, cap)
  const rest = pills.length - shown
  return (
    <span ref={box} className="k-grid-pills" data-slot="grid-pills">
      {pills.map((pill, i) => (
        <span key={`${i}-${pill.label}`} className="k-grid-pill" data-pill="" data-tone={pill.tone} hidden={i >= shown}>
          {pill.label}
        </span>
      ))}
      {rest > 0 && (
        <span
          className="k-grid-pill k-grid-pill-more"
          data-slot="grid-pill-more"
          title={pills.map((pill) => pill.label).join(' · ')}
        >
          +{rest}
        </span>
      )}
    </span>
  )
}

/** 行快捷按钮条贴在行尾；表横向滚开时行尾在可视区外，把滚出去的那段宽度写成变量让条往里挪（theme/row-actions.css 读它）。 */
export function keepActionsInView(scroll: HTMLElement) {
  scroll.style.setProperty(
    '--k-grid-hidden-right',
    `${Math.max(0, scroll.scrollWidth - scroll.clientWidth - scroll.scrollLeft)}px`,
  )
}
