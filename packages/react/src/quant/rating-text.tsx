// SPDX-License-Identifier: MIT
import { ChevronDownIcon, ChevronUpIcon, ChevronsDownIcon, ChevronsUpIcon, EqualIcon } from 'lucide-react'
import type { ComponentProps } from 'react'
import { cn } from '../lib/cn.ts'

// 五档评级的单元格写法（分析师评级、技术评级的结论）：图标加文字，买入涨色、卖出跌色，中性不着色。
// 照 TradingView 选股器「分析师评级」列（主会话 2026-11-15 登录态实测：强力买入是双上箭头、买入单上箭头、中性等号、卖出单下箭头、强力卖出双下箭头，文字跟在图标后面），实现原创。
// 颜色只读 --pnl-up / --pnl-down（跟 data-updown）；方向不只靠颜色：图标与文字都带档位。文字由调用方传，包里不带语言。

export type RatingLevel = 'strong-sell' | 'sell' | 'neutral' | 'buy' | 'strong-buy'

const ICON = {
  'strong-buy': ChevronsUpIcon,
  buy: ChevronUpIcon,
  neutral: EqualIcon,
  sell: ChevronDownIcon,
  'strong-sell': ChevronsDownIcon,
} as const

const TONE: Record<RatingLevel, 'up' | 'down' | 'flat'> = {
  'strong-buy': 'up',
  buy: 'up',
  neutral: 'flat',
  sell: 'down',
  'strong-sell': 'down',
}

export type RatingTextProps = Omit<ComponentProps<'span'>, 'children'> & {
  level: RatingLevel
  /** 档名，由调用方传（强力买入、买入…）。 */
  children: string
}

export function RatingText({ level, children, className, ...rest }: RatingTextProps) {
  const Icon = ICON[level]
  return (
    <span
      data-slot="rating-text"
      data-level={level}
      data-tone={TONE[level]}
      className={cn(
        'inline-flex items-center gap-1 whitespace-nowrap data-[tone=down]:text-(--pnl-down) data-[tone=up]:text-(--pnl-up)',
        className,
      )}
      {...rest}
    >
      <Icon size={14} aria-hidden="true" />
      {children}
    </span>
  )
}
