// SPDX-License-Identifier: MIT
// 报价卡：一只品种一张卡，名字与代码、最新价（大）、涨跌与涨跌幅、可选的迷你图与下面一行（常放区间条）；QuoteStrip 是一排卡，横向滚动。
// 功能参照 TradingView 小组件 Single Ticker / Ticker Tape / Symbol Info（tradingview.com/widget-docs，2026-11-14 读：卡上有价与涨跌幅，条带是一排卡；
// 页面没写版式与交互，看不到的部分我们自己定：给了 onSelect 整张卡就是一个按钮，键盘可达；价格变了自动闪涨跌色，要滚轮就由调用方用 RollingText 自己加；迷你图新点追加时线平滑延伸）。不嵌、不抄其代码与样式。
import type { ReactNode } from 'react'
import { ReadoutFlash } from '../lib/live-readout.tsx'
import { Sparkline } from './sparkline.tsx'
import { TONE_GLYPH, type QuoteTone } from './quote-tone.ts'

export type QuoteCardProps = {
  /** Name of the symbol. */
  name: string
  /**
   * Code, small and muted beside the name.
   * 代码，小号弱色写在名字旁。
   */
  symbol?: string
  /** The already formatted price. */
  price: string
  /**
   * The already formatted change amount, signed.
   * 涨跌额与涨跌幅，已格式化（带符号）。
   */
  change?: string
  /** The already formatted change percentage, signed. */
  percent?: string
  /** Up, down or flat. */
  tone?: QuoteTone
  /**
   * Values of the mini chart, oldest to newest; no chart is drawn when omitted.
   * 迷你图的数（旧到新）与读屏名；不给 values 就不画。
   */
  spark?: readonly number[]
  /** Accessible name of the mini chart. */
  sparkLabel?: string
  /**
   * A line under the card, often a RangeBar.
   * 卡下面一行：区间条之类。
   */
  footer?: ReactNode
  /**
   * sm is a narrow horizontal card used inside QuoteStrip.
   * 小号：窄、横排，给 QuoteStrip 用。
   */
  size?: 'md' | 'sm'
  /**
   * When given the whole card renders as a button.
   * 给了就整张卡是一个按钮。
   */
  onSelect?: () => void
  /** Extra class name on the root. */
  className?: string
}

export function QuoteCard({
  name,
  symbol,
  price,
  change,
  percent,
  tone = 'flat',
  spark,
  sparkLabel,
  footer,
  size = 'md',
  onSelect,
  className,
}: QuoteCardProps) {
  const body = (
    <>
      <span className="k-quote-head">
        <span className="k-quote-name">{name}</span>
        {symbol && <span className="k-quote-symbol">{symbol}</span>}
      </span>
      <span className="k-quote-price">
        <ReadoutFlash text={price} />
      </span>
      {(change || percent) && (
        <span className="k-quote-change">
          <span className="k-price-tag-glyph" aria-hidden="true">
            {TONE_GLYPH[tone]}
          </span>
          {change && <span>{change}</span>}
          {percent && <span>{percent}</span>}
        </span>
      )}
      {spark && <Sparkline values={spark} label={sparkLabel ?? ''} tone={tone} className="k-quote-spark" />}
      {footer && <span className="k-quote-footer">{footer}</span>}
    </>
  )
  const classes = `k-quote-card is-${tone} is-${size}${onSelect ? ' is-link' : ''}${className ? ` ${className}` : ''}`
  return onSelect ? (
    <button type="button" className={classes} onClick={onSelect}>
      {body}
    </button>
  ) : (
    <div className={classes}>{body}</div>
  )
}

export type QuoteStripProps = {
  /**
   * Accessible name (required).
   * 读屏名。
   */
  label: string
  /** The cards: the props of each QuoteCard plus an id. */
  items: readonly (QuoteCardProps & { id: string })[]
  /** Extra class name on the root. */
  className?: string
}

/** 一排报价卡：横向排开、放不下横向滚动；每张卡用小号。 */
export function QuoteStrip({ label, items, className }: QuoteStripProps) {
  return (
    <div className={`k-quote-strip${className ? ` ${className}` : ''}`} role="list" aria-label={label} tabIndex={0}>
      {items.map(({ id, ...card }) => (
        <div key={id} role="listitem" className="k-quote-strip-item">
          <QuoteCard size="sm" {...card} />
        </div>
      ))}
    </div>
  )
}
