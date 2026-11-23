// SPDX-License-Identifier: MIT
// 品种报价头（SymbolInfo）：一只品种的「是谁、多少钱、涨跌多少、今天和一年里走到哪」放在一块。
// 功能参照 TradingView 小组件 Symbol Info（tradingview.com/widget-docs/widgets/symbol-details/symbol-info，2026-11-23 读：页面只写了
// 「以易读的格式扫一眼品种的关键信息、报价」，没写有哪些栏与怎么排，下面的排布待核对）与 TradingView 品种页页头（徽标、代码、名称、交易所、市场状态、
// 大号价加币种、涨跌额与涨跌幅；主会话 2026-11-15 实测，见 docs/tv-parity.md）。只取给用户看什么，不嵌、不抄代码与样式值。
// 区间条用 RangeBar（triangle 标记，TradingView 右栏的画法）；状态灯用 Led；价格变了闪色与滚动跟 MiniChart 一样走 RollingText 与 ChangeText。
// 文字（交易所、市场状态、区间标题、单位）与价格写法都由调用方传；包里不带语言。
import type { ReactNode } from 'react'
import { cn } from '../lib/cn.ts'
import type { SeverityExt } from '../lib/severity.ts'
import { Led } from '../katana/led.tsx'
import { RollingText } from '../katana/rolling-text.tsx'
import { ChangeText } from './change-text.tsx'
import { plainPrice, rowTone, type FormatPrice } from './quote-row.ts'
import { RangeBar } from './range-bar.tsx'
import { SymbolMark } from './symbol-mark.tsx'
import { ToneText } from './tone-text.tsx'

export type SymbolInfoRange = {
  /** Stable id of the range (day, 52w). */
  id: string
  /** Visible title above the track, such as "Day's range"; also the accessible name of the meter. */
  title: string
  /** Lowest value of the range. */
  low: number
  /** Highest value of the range. */
  high: number
}

export type SymbolInfoStatus = {
  /**
   * Light of the market status: ok for open, warn for pre or post market, off for closed.
   * 市场状态的灯：开市 ok、盘前盘后 warn、休市 off。
   */
  tone: SeverityExt
  /** Text beside the light ("Market open"), written by the caller. */
  label: string
}

export type SymbolInfoProps = {
  /** Symbol code (AAPL, BTCUSDT, 600519). */
  symbol: string
  /** Full name of the instrument; the code is shown alone when omitted. */
  name?: string
  /** Venue or exchange text after the name (NASDAQ, SSE), written by the caller. */
  exchange?: string
  /** Image address of the logo; letters are drawn when omitted or when it fails to load. */
  logoSrc?: string
  /** Latest price. */
  last: number
  /** Change amount since the previous close, signed; decides the up, down or flat color. */
  change: number
  /** Change as a percentage (1.5 means +1.5%). */
  changePct: number
  /** Currency or unit after the price (USD, CNY), written by the caller. */
  unit?: string
  /** Writes a price as text; the caller knows the precision. Two decimals by default. */
  formatPrice?: FormatPrice
  /** Market status light and text; nothing is drawn when omitted. */
  status?: SymbolInfoStatus
  /**
   * Ranges drawn below the quote, in order (usually the day range and the 52-week range); the marker points at last.
   * 报价下面的一排区间（通常是当日与 52 周），标记指着最新价。
   */
  ranges?: readonly SymbolInfoRange[]
  /** Small line under the ranges (data time, delay note), written by the caller. */
  footer?: ReactNode
  /** Live data: the price rolls when it changes and the change flashes the up or down color. */
  live?: boolean
  /** Accessible name of the whole header, written by the caller. */
  label: string
  /** Extra class name on the root. */
  className?: string
}

export function SymbolInfo({
  symbol,
  name,
  exchange,
  logoSrc,
  last,
  change,
  changePct,
  unit,
  formatPrice = plainPrice,
  status,
  ranges,
  footer,
  live = false,
  label,
  className,
}: SymbolInfoProps) {
  const tone = rowTone({ change, changePct })
  const priceText = formatPrice(last)
  const changeText = Number.isFinite(change) ? `${change > 0 ? '+' : ''}${formatPrice(change)}` : '—'
  return (
    <section className={cn('k-syminfo', `is-${tone}`, className)} data-slot="symbol-info" aria-label={label}>
      <div className="k-syminfo-head">
        <SymbolMark symbol={symbol} name={name} src={logoSrc} size={32} />
        <div className="k-syminfo-id">
          <span className="k-syminfo-symbol">{symbol}</span>
          {(name || exchange) && (
            <span className="k-syminfo-name">
              {name}
              {name && exchange ? ' · ' : null}
              {exchange && <span className="k-syminfo-exchange">{exchange}</span>}
            </span>
          )}
        </div>
        {status && (
          <span className="k-syminfo-status" data-slot="symbol-info-status">
            <Led tone={status.tone} label={status.label} />
            {status.label}
          </span>
        )}
      </div>
      <div className="k-syminfo-quote">
        <span className="k-syminfo-price" data-slot="symbol-info-price">
          {live ? <RollingText text={priceText} value={last} animate /> : priceText}
        </span>
        {unit && <span className="k-syminfo-unit">{unit}</span>}
        <ToneText tone={tone} arrow className="k-syminfo-change" data-slot="symbol-info-change">
          {changeText}
        </ToneText>
        <ChangeText value={changePct} flash={live} className="k-syminfo-pct" />
      </div>
      {ranges && ranges.length > 0 && (
        <div className="k-syminfo-ranges" data-slot="symbol-info-ranges">
          {ranges.map((range) => (
            <RangeBar
              key={range.id}
              low={range.low}
              high={range.high}
              value={last}
              format={formatPrice}
              label={range.title}
              title={range.title}
              marker="triangle"
            />
          ))}
        </div>
      )}
      {footer && <p className="k-syminfo-footer">{footer}</p>}
    </section>
  )
}
