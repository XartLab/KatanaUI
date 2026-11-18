// SPDX-License-Identifier: MIT
/**
 * Cell renderers of DataGrid: the default cell body and the live flashing cell.
 * DataGrid 的格子（体检 §7 从 data-grid.tsx 拆出）：默认格子内容、实时模式下值变了闪涨跌色的数值格。
 */
import type { CSSProperties, ReactNode } from 'react'
import { cn } from '../../lib/cn.ts'
import { useValueFlash } from '../../lib/live.ts'
import { Tag } from '../../katana/tag.tsx'
import { CodeChip, CodeName, UnitValue } from '../../quotes/cell-type.tsx'
import { RangeBar } from '../../quotes/range-bar.tsx'
import { RatingText } from '../../quotes/rating-text.tsx'
import { Sparkline } from '../../quotes/sparkline.tsx'
import { SymbolMark } from '../../quotes/symbol-mark.tsx'
import { ToneText } from '../../quotes/tone-text.tsx'
import type { ResolvedCell } from './columns.ts'

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
}) {
  const { flash, key } = useValueFlash(value)
  return (
    <div key={key} {...rest} className={cn(className, 'k-live-flash')} data-flash={flash ?? undefined}>
      {children}
    </div>
  )
}

/** 品种格（#90）：按 parts 依次画徽标、代码（纯字或芯片）、全称、场所小字；芯片与全称是共用件 quotes/cell-type.tsx（#92），样式在 theme/cell-type.css。 */
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
        return <CodeChip key={part}>{symbol.code}</CodeChip>
      case 'name':
        return symbol.name ? <CodeName key={part}>{symbol.name}</CodeName> : null
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
function Value({ resolved }: { resolved: ResolvedCell }) {
  const main =
    resolved.direction !== undefined ? <ToneText tone={resolved.direction}>{resolved.main}</ToneText> : resolved.main
  return <UnitValue unit={resolved.unit}>{main}</UnitValue>
}

/**
 * 一格里的内容：品种拆成徽标、代码、名称；评级、横条、迷你图、标签、区间复用 RatingText、Sparkline、Tag、RangeBar；
 * 有方向的类型（盈亏、涨跌幅、买卖）用 ToneText 跟 data-updown；数字后的单位小一号。
 */
export function CellBody({ resolved }: { resolved: ResolvedCell }) {
  if (resolved.symbol) return <SymbolCell symbol={resolved.symbol} />
  const visual = resolved.visual
  switch (visual?.kind) {
    case 'rating':
      return <RatingText level={visual.level}>{resolved.text}</RatingText>
    case 'tag':
      return <Tag tone={visual.tone}>{resolved.text}</Tag>
    case 'bar':
      return (
        <>
          <span className="k-grid-bar" aria-hidden="true">
            <span style={{ inlineSize: `${visual.share * 100}%` }} />
          </span>
          <Value resolved={resolved} />
        </>
      )
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
      return <Value resolved={resolved} />
  }
}

/** 行快捷按钮条贴在行尾；表横向滚开时行尾在可视区外，把滚出去的那段宽度写成变量让条往里挪（theme/row-actions.css 读它）。 */
export function keepActionsInView(scroll: HTMLElement) {
  scroll.style.setProperty(
    '--k-grid-hidden-right',
    `${Math.max(0, scroll.scrollWidth - scroll.clientWidth - scroll.scrollLeft)}px`,
  )
}
