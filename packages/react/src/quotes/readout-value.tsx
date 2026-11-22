// SPDX-License-Identifier: MIT
// 读数壳里的「数值」一格（体检 §1 读数卡四套合一，2026-11-18 G4）：MetricCard 的卡与瓦片两种外观共用。
// 没有数据写「—」并带 is-empty；有 rollValue 走 RollingText 的滚轮加闪，没有就 ReadoutFlash 闪涨跌色；单位是数值后的小字，没有数据时不写单位。
import type { ReactNode } from 'react'
import { cn } from '../lib/cn.ts'
import { ReadoutFlash } from '../lib/live-readout.tsx'
import { RollingText } from '../katana/rolling-text.tsx'

/** The value cell of the readout shell: an em dash when empty, a flash when it changes, an optional rolling odometer and unit. */
export function ReadoutValue({
  as: Tag = 'span',
  value,
  unit,
  rollValue,
  className,
  slot,
}: {
  /** Element to render, span by default. */
  as?: 'span' | 'div'
  /** Formatted value; null when there is no data. */
  value: string | null
  /** Small text after the value. */
  unit?: ReactNode
  /** When given the changed digits roll like an odometer. */
  rollValue?: number
  /** Class name of the cell. */
  className: string
  /** data-slot of the cell. */
  slot?: string
}) {
  return (
    <Tag className={cn(className, value === null && 'is-empty')} data-slot={slot}>
      {value === null ? (
        '—'
      ) : rollValue === undefined ? (
        <ReadoutFlash text={value} />
      ) : (
        <RollingText text={value} value={rollValue} animate />
      )}
      {unit && value !== null ? <small>{unit}</small> : null}
    </Tag>
  )
}
