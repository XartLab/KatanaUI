// SPDX-License-Identifier: MIT
import type { ComponentProps } from 'react'
import { cn } from '../lib/cn.ts'
import { useValueFlash } from '../lib/live.ts'
import { formatPercentChange, toneOf } from '../lib/chart/format/index.ts'
import { ToneText } from './tone-text.tsx'

/** 涨跌幅：value 已经是百分数（1.5 就是 1.5%），写成「+1.50%」，涨跌色跟 data-updown。位数由调用方传。 */
export function ChangeText({
  value,
  digits = 2,
  arrow,
  flash = false,
  ...rest
}: {
  /** A percentage already (1.5 means 1.5%). */
  value: number
  /** Number of decimal places. */
  digits?: number
  /** Put an up or down triangle before the text (none for flat) so direction does not rely on color alone. */
  arrow?: boolean
  /** Flash up or down color when value changes (for numbers that update live; off by default so static tables stay still). */
  flash?: boolean
} & Omit<ComponentProps<'span'>, 'children'>) {
  // 默认不闪：静态表格里排序、翻页换值不该闪；实时更新的数调用方显式开。
  const live = useValueFlash(value, { enabled: flash })
  return (
    <ToneText
      key={live.key}
      tone={toneOf(value, digits)}
      arrow={arrow}
      data-slot="change-text"
      {...rest}
      className={cn(flash && 'k-live-flash', rest.className)}
      data-flash={live.flash ?? undefined}
    >
      {formatPercentChange(value, digits)}
    </ToneText>
  )
}
