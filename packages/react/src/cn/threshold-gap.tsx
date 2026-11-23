// SPDX-License-Identifier: MIT
import type { ReactNode } from 'react'
import { Meter } from '../blocks/meter/meter.tsx'
import { Tag } from '../katana/tag.tsx'
import { cn } from '../lib/cn.ts'
import type { Severity } from '../lib/severity.ts'
import { cnLabelsZh, type ThresholdGapLabels } from './labels.ts'
import { thresholdGap, thresholdState, type ThresholdGapState } from './threshold-gap-model.ts'

// 异动阈值差读数（KatanaUI #11 第 10 项）：一只票一行，上面是 Meter 的条（累计偏离值的绝对值对阈值，阈值是硬限红线、预警线是琥珀细线，越线条跟着变色），
// 下面是档位标签（监控中 / 临近 / 已触发 / 监管期结束）与「差 0.04%」「超出 1.20%」。功能参照开盘啦「异动提醒」（App Store 介绍与官网教程
// kaipanla.com/article/42661，2026-11-15 读：列表显示离阈值差多少，如差 0.04%，已触发、监管期结束分开标），画法是我们定的，复用 Meter 的限额线（#149）。
// 阈值与预警线是交易所规则与调用方的口径，包里不带；偏离值由调用方算好（百分点，可正可负）。文字走 labels。

const TONES: Record<ThresholdGapState, Severity> = {
  watch: 'neutral',
  near: 'warn',
  triggered: 'danger',
  ended: 'neutral',
}

const percent = (value: number) => `${value.toFixed(2)}%`
const signedPercent = (value: number) => `${value > 0 ? '+' : value < 0 ? '-' : ''}${percent(Math.abs(value))}`

export type ThresholdGapProps = {
  /**
   * Name of the stock (a node, often name plus code).
   * 名字（常是名称加代码）。
   */
  label: ReactNode
  /**
   * Cumulative price deviation over the rule's window in percentage points, signed; null when not available.
   * 累计偏离值（百分点，可正可负）；取不到是 null。
   */
  value: number | null
  /**
   * The trigger threshold in percentage points (positive), compared with the absolute deviation.
   * 触发阈值（百分点，正数），跟偏离值的绝对值比。
   */
  threshold: number
  /**
   * Warning line in percentage points; reaching it reads as near. None when omitted.
   * 预警线（百分点）；达到算「临近」。不给没有。
   */
  warnAt?: number
  /**
   * The supervision period has ended (the caller knows the dates).
   * 监管期已结束（日期由调用方判断）。
   */
  ended?: boolean
  /**
   * Which window the deviation covers, such as "3-day deviation"; written after the name.
   * 偏离值的口径（如「3 日累计偏离」），写在名字后面。
   */
  period?: ReactNode
  /**
   * A short note at the end of the bottom line, such as the end of the supervision period.
   * 底行末尾的一句（如监管期到哪天）。
   */
  note?: ReactNode
  /**
   * Text pack; the Simplified Chinese default is used when omitted.
   * 文案；不传用简体中文默认。
   */
  labels?: ThresholdGapLabels
  /** Extra class names. */
  className?: string
}

export function ThresholdGap({
  label,
  value,
  threshold,
  warnAt,
  ended = false,
  period,
  note,
  labels = cnLabelsZh.thresholdGap,
  className,
}: ThresholdGapProps) {
  const state = thresholdState(value, threshold, warnAt, ended)
  const gap = thresholdGap(value, threshold)
  const known = value !== null && Number.isFinite(value)
  const size = known ? Math.abs(value) : 0
  const gapText =
    state === null || gap === null
      ? labels.unavailable
      : state === 'ended'
        ? null
        : gap > 0
          ? labels.gap(percent(gap))
          : labels.over(percent(-gap))
  const name = (
    <>
      <span className="k-tg-name">{label}</span>
      {period !== undefined && <span className="k-tg-period">{period}</span>}
    </>
  )
  return (
    <div className={cn('k-tg', className)} data-slot="threshold-gap" data-state={state ?? 'unknown'}>
      {ended ? (
        // 监管期结束：不再按线变色，阈值只留一根刻度当参照。
        <Meter
          label={name}
          value={size}
          max={Math.max(size, threshold)}
          valueText={known ? signedPercent(value) : labels.unavailable}
          tone="off"
          mark={threshold}
          markLabel={labels.threshold(percent(threshold))}
        />
      ) : (
        <Meter
          label={name}
          value={size}
          valueText={known ? signedPercent(value) : labels.unavailable}
          tone="off"
          warnAt={warnAt}
          hardAt={threshold}
          limitLabels={{
            warn: warnAt === undefined ? undefined : labels.warn(percent(warnAt)),
            hard: labels.threshold(percent(threshold)),
          }}
        />
      )}
      <div className="k-tg-foot">
        {state !== null && (
          <Tag size="sm" tone={TONES[state]} outlined={state === 'ended'} data-slot="threshold-gap-state">
            {labels.state[state]}
          </Tag>
        )}
        {gapText !== null && (
          <span className="k-tg-gap" data-slot="threshold-gap-text">
            {gapText}
          </span>
        )}
        {note !== undefined && <span className="k-tg-note">{note}</span>}
      </div>
    </div>
  )
}
