// SPDX-License-Identifier: MIT
import type { ComponentProps, ElementType, ReactNode } from 'react'
import { cn } from '../lib/cn'
import type { Tone } from './format'

// 涨跌与盈亏的文字：颜色只读 --pnl-up / --pnl-down（根上设 data-updown="cn" 就互换成红涨绿跌，决策记录 0019），文字自己带符号，
// 可选再加箭头：颜色可能被换成另一套、也有人分不出红绿，方向不能只靠颜色。平（零）不着色，继承周围的字色。

const TONE_CLASS = 'data-[tone=up]:text-(--pnl-up) data-[tone=down]:text-(--pnl-down)'

const ARROW: Record<Tone, string | null> = { up: '▲', down: '▼', flat: null }

export type ToneTextProps<T extends ElementType = 'span'> = Omit<ComponentProps<T>, 'children'> & {
  tone: Tone
  /** 文字前面加 ▲ / ▼（平不加）。 */
  arrow?: boolean
  as?: T
  children: ReactNode
}

export function ToneText<T extends ElementType = 'span'>({
  tone,
  arrow = false,
  as,
  className,
  children,
  ...rest
}: ToneTextProps<T>) {
  const Comp: ElementType = as ?? 'span'
  const glyph = arrow ? ARROW[tone] : null
  return (
    <Comp data-tone={tone} className={cn(TONE_CLASS, 'tabular-nums', className)} {...rest}>
      {glyph ? (
        <>
          <span aria-hidden="true" className="mr-[0.25em] text-[0.8em]">
            {glyph}
          </span>
          {children}
        </>
      ) : (
        children
      )}
    </Comp>
  )
}
