// SPDX-License-Identifier: MIT
// 行内价格标签：夹在一句话或一行表格里的「名字 价格 涨跌」，数字等宽对齐，涨跌带三角与颜色。
// 功能参照 TradingView 小组件 Single Ticker / Ticker Tape（tradingview.com/widget-docs，2026-11-14 读：只显示一只品种的价与涨跌幅，没有别的；
// 页面没写版式与交互），价格变了闪一下涨跌色（共用层 lib/live-readout.tsx）；我们的做法：能当文字用（行内、跟随字号），可选地做成可点的。不嵌、不抄其代码与样式。
// 值是数（last、changePct，统一行情行的字段，2026-11-18），文字由 formatPrice 写；旧的 price / change 字符串照旧认一个版本。
import { ReadoutFlash } from '../lib/live-readout.tsx'
import { formatPercentChange, toneOf } from '../quant/format/index.ts'
import { plainPrice, type FormatPrice } from './quote-row.ts'
import { TONE_GLYPH, type QuoteTone } from './quote-tone.ts'

export type PriceTagProps = {
  /**
   * Symbol name or code; only price and change are shown when omitted.
   * 品种名或代码；不给就只有价格与涨跌。
   */
  name?: string
  /** Last price. */
  last?: number
  /** Change as a percentage (1.5 means 1.5%); not shown when omitted. */
  changePct?: number
  /** Writes the last price; two decimals when omitted. */
  formatPrice?: FormatPrice
  /** Deprecated: use last with formatPrice. @deprecated Use last with formatPrice. */
  price?: string
  /** Deprecated: use changePct. @deprecated Use changePct. */
  change?: string
  /** Up, down or flat: sets the color and the triangle (none for flat); derived from changePct when omitted. */
  tone?: QuoteTone
  /**
   * The whole sentence read by screen readers, including the direction; the visible text is read when omitted.
   * 读屏读的整句（含涨跌方向）；不给就读可见的字。
   */
  label?: string
  /** Extra class name on the root. */
  className?: string
}

export function PriceTag({
  name,
  last,
  changePct,
  formatPrice = plainPrice,
  price: legacyPrice,
  change: legacyChange,
  tone: givenTone,
  label,
  className,
}: PriceTagProps) {
  const price = legacyPrice ?? (last === undefined ? '—' : formatPrice(last))
  const change = changePct === undefined ? legacyChange : formatPercentChange(changePct)
  const tone = givenTone ?? (changePct === undefined ? 'flat' : toneOf(changePct))
  return (
    <span className={`k-price-tag is-${tone}${className ? ` ${className}` : ''}`} aria-label={label}>
      {name && <span className="k-price-tag-name">{name}</span>}
      <span className="k-price-tag-price">
        <ReadoutFlash text={price} />
      </span>
      {change && (
        <span className="k-price-tag-change">
          <span className="k-price-tag-glyph" aria-hidden="true">
            {TONE_GLYPH[tone]}
          </span>
          {change}
        </span>
      )}
    </span>
  )
}
