// SPDX-License-Identifier: MIT
// 组件卡 LCDReadout。读数窗：点阵小标签在上，LCD 数字在中，一行 10px 灰色小字（单位、对比、口径）在下。
// 搬自 src/ui（#1860）：样子与行为没改，皮肤在 ../theme/lcd.css。
// 数值颜色：中性、涨跌（--k-tone-*，组件卡 PerformanceReport 里只有收益与回撤用），以及组件卡给的当前关注（--accent）
// 与状态（--k-status-*：warn 给指标的 HUD 读数卡用，#589）；没有数据显示「—」，用次要文字色（tertiary 不当文字色，#473）。
// 数字变了闪一下涨跌色（共用层 lib/live-readout.tsx）。

import { ReadoutFlash } from '../lib/live-readout.tsx'
import type { Severity } from '../lib/severity.ts'
import type { Tone } from '../lib/tone.ts'

/**
 * Color of the number: a Severity (neutral, ok, warn, danger), a price direction (up, down, flat) or accent (current focus).
 * G3 起收成 Severity + Tone + accent：改前的 neutral / up / down / accent / warn 都还在，ok、danger、flat 是新增。
 */
export type LcdTone = Severity | Tone | 'accent'

/**
 * 没有数据时 value 传 null。note：数字下面的一行小字（不放第二个数值：需要对比就再开一个读数窗）。
 * fill：撑满所在的格子（KPI 行里每格一个）；默认按内容收缩。
 */
export function Lcd({
  label,
  value,
  inline,
  fill,
  tone = 'neutral',
  note,
}: {
  /** Small dot-matrix label. */
  label: string
  /** The reading; pass null when there is no data and it shows a dash. */
  value: string | null
  /** Put the label and the number on one line. */
  inline?: boolean
  /** Fill the cell it sits in (one per cell in a KPI row); by default it shrinks to its content. */
  fill?: boolean
  /** Number color: neutral, ok, warn, danger; up, down, flat (price direction, follows data-updown); accent (current focus). */
  tone?: LcdTone
  /** A 10px line under the number (unit, basis); do not put a second value here. */
  note?: string
}) {
  const classes = ['k-lcd', inline ? 'inline' : '', fill ? 'fill' : '', value === null ? 'is-empty' : `tone-${tone}`]
  return (
    <span className={classes.filter(Boolean).join(' ')}>
      <span className="t">{label}</span>
      <span className="v">{value === null ? '—' : <ReadoutFlash text={value} />}</span>
      {note !== undefined && <span className="n">{note}</span>}
    </span>
  )
}
