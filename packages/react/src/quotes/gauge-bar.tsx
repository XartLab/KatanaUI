// SPDX-License-Identifier: MIT
// 进度条加一句解释：上面一行名字、数和档位词，中间一条进度条（标出数的位置），下面一句说明这个数是怎么来的。
// 从应用的分析视图 GaugeView 提来（#1884，调用方零改动；原来照 TradingView 的进度条与长桥的「情绪」，#443）。
// 认分量（#115）：hero 的数用 display 档；compact 只留一行「名字 数 档位词」，不画进度条、图例与说明。
import type { ReactNode } from 'react'
import { useEmphasis } from '../layout/emphasis.tsx'

export type GaugeBarClasses = Partial<
  Record<'root' | 'head' | 'label' | 'value' | 'track' | 'fill' | 'note' | 'segment' | 'legend', string>
>

/** 语义色调：涨 / 跌 / 弱 / 强调（Graphite 里强调是中性亮，不是橙）。调用方只选名字，色值由包里的 token 给。 */
export type GaugeTone = 'up' | 'down' | 'muted' | 'accent'

/** 分段占比条的一段：value 是这段的量（按各段之和归一，负数与非数当 0），label 由调用方写（含家数），画在条下面。 */
export type GaugeSegment = { value: number; tone: GaugeTone; label?: ReactNode }

export type GaugeBarProps = {
  /** The name. */
  label: ReactNode
  /**
   * The already formatted number.
   * 已经格式化好的数。
   */
  value: ReactNode
  /**
   * The number could not be fetched: write the reason where the number goes, in a muted color.
   * 数取不到：数那里写原因，换成弱色。
   */
  unavailable?: boolean
  /**
   * Position of the number between the minimum and maximum (0 to 1, clamped to the ends); null draws no fill.
   * 数在最小到最大之间的位置（0 到 1，越界按边画）；null 不画填充。
   */
  share?: number | null
  /**
   * Multi-segment proportion bar (up · flat · down; limit-up · broken · limit-down): the track is split by the segment values
   * and the labels are written under it. When given, `share` is ignored; without it the single-fill bar is unchanged.
   * 分段占比条：轨道按各段的量切开，标签写在条下面；给了它就不看 share，不给就是原来的单段。
   */
  segments?: readonly GaugeSegment[]
  /**
   * The level word (a whole node supplied by the caller, often a badge).
   * 档位词（整个节点由调用方给，常是一枚徽标）。
   */
  level?: ReactNode
  /** A line of explanation underneath. */
  note?: ReactNode
  /**
   * Extra class names per part, written after the package ones.
   * 每个部位额外的类名，写在包里的类名之后。
   */
  classes?: GaugeBarClasses
}

const join = (base: string, extra?: string) => (extra ? `${base} ${extra}` : base)

export function GaugeBar({
  label,
  value,
  unavailable,
  share = null,
  level,
  note,
  segments,
  classes = {},
}: GaugeBarProps) {
  const emphasis = useEmphasis()
  const compact = emphasis === 'compact'
  return (
    <figure className={join('k-gauge', classes.root)} data-emphasis={emphasis}>
      <figcaption className={join('k-gauge-head', classes.head)}>
        <span className={join('k-gauge-label', classes.label)}>{label}</span>
        <span className={`${join('k-gauge-value', classes.value)}${unavailable ? ' is-unavailable' : ''}`}>
          {value}
        </span>
        {level}
      </figcaption>
      {!compact && (
        <div
          className={join('k-gauge-track', classes.track)}
          data-segmented={segments ? '' : undefined}
          aria-hidden="true"
        >
          {segments
            ? segments.map((segment, index) => {
                const amount = Number.isFinite(segment.value) && segment.value > 0 ? segment.value : 0
                return (
                  <span
                    key={index}
                    className={join('k-gauge-seg', classes.segment)}
                    data-tone={segment.tone}
                    style={{ flexGrow: amount }}
                  />
                )
              })
            : share !== null && (
                <span
                  className={join('k-gauge-fill', classes.fill)}
                  style={{ width: `${Math.min(1, Math.max(0, share)) * 100}%` }}
                />
              )}
        </div>
      )}
      {!compact && segments && segments.some((segment) => segment.label !== undefined) && (
        <ul className={join('k-gauge-legend', classes.legend)}>
          {segments.map((segment, index) =>
            segment.label === undefined ? null : (
              <li key={index} data-tone={segment.tone}>
                {segment.label}
              </li>
            ),
          )}
        </ul>
      )}
      {!compact && note && <p className={join('k-gauge-note', classes.note)}>{note}</p>}
    </figure>
  )
}
