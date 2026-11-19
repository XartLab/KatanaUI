// SPDX-License-Identifier: MIT
/**
 * Cell renderers of DataGrid: the default cell body and the live flashing cell.
 * DataGrid 的格子（体检 §7 从 data-grid.tsx 拆出）：默认格子内容、实时模式下值变了闪涨跌色的数值格。
 */
import type { CSSProperties, ReactNode } from 'react'
import { cn } from '../../lib/cn.ts'
import { useValueFlash } from '../../lib/live.ts'
import { SymbolMark } from '../../quotes/symbol-mark.tsx'
import { ToneText } from '../../quotes/tone-text.tsx'
import type { ResolvedCell } from './columns.ts'

/** 数值类的列才闪：文本、时间、买卖、品种变了不闪（闪色只表达涨跌）。 */
export const FLASH_TYPES: ReadonlySet<string> = new Set(['number', 'price', 'quantity', 'pnl', 'change'])

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

/** 一格里的内容：品种拆成代码加场所，有方向的类型（盈亏、涨跌幅、买卖）用 ToneText 跟 data-updown，别的直接写字。 */
export function CellBody({ resolved }: { resolved: ResolvedCell }) {
  if (resolved.symbol) {
    return (
      <>
        {resolved.symbol.icon && (
          <SymbolMark
            symbol={resolved.symbol.code}
            name={resolved.symbol.name}
            src={resolved.symbol.icon.src}
            size={16}
          />
        )}
        <span className="k-grid-name">{resolved.symbol.code}</span>
        {resolved.symbol.venue && <span className="k-grid-tag">{resolved.symbol.venue}</span>}
      </>
    )
  }
  if (resolved.direction !== undefined) return <ToneText tone={resolved.direction}>{resolved.text}</ToneText>
  return resolved.text
}

/** 行快捷按钮条贴在行尾；表横向滚开时行尾在可视区外，把滚出去的那段宽度写成变量让条往里挪（theme/row-actions.css 读它）。 */
export function keepActionsInView(scroll: HTMLElement) {
  scroll.style.setProperty(
    '--k-grid-hidden-right',
    `${Math.max(0, scroll.scrollWidth - scroll.clientWidth - scroll.scrollLeft)}px`,
  )
}
