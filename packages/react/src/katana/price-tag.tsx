// SPDX-License-Identifier: MIT
// 行内价格标签：夹在一句话或一行表格里的「名字 价格 涨跌」，数字等宽对齐，涨跌带三角与颜色。
// 功能参照 TradingView 小组件 Single Ticker / Ticker Tape（tradingview.com/widget-docs，2026-11-14 读：只显示一只品种的价与涨跌幅，没有别的；
// 页面没写版式与交互），我们的做法：能当文字用（行内、跟随字号），可选地做成可点的。不嵌、不抄其代码与样式。
import { TONE_GLYPH, type QuoteTone } from './quote-tone.ts'

export type PriceTagProps = {
  /** 品种名或代码；不给就只有价格与涨跌。 */
  name?: string
  /** 已经格式化好的价。 */
  price: string
  /** 已经格式化好的涨跌（带符号，如「+1.20%」）。 */
  change?: string
  tone?: QuoteTone
  /** 读屏读的整句（含涨跌方向）；不给就读可见的字。 */
  label?: string
  className?: string
}

export function PriceTag({ name, price, change, tone = 'flat', label, className }: PriceTagProps) {
  return (
    <span className={`k-price-tag is-${tone}${className ? ` ${className}` : ''}`} aria-label={label}>
      {name && <span className="k-price-tag-name">{name}</span>}
      <span className="k-price-tag-price">{price}</span>
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
