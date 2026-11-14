// SPDX-License-Identifier: MIT
// 进度条加一句解释：上面一行名字、数和档位词，中间一条进度条（标出数的位置），下面一句说明这个数是怎么来的。
// 从应用的分析视图 GaugeView 提来（#1884，调用方零改动；原来照 TradingView 的进度条与长桥的「情绪」，#443）。
import type { ReactNode } from 'react'

export type GaugeBarClasses = Partial<Record<'root' | 'head' | 'label' | 'value' | 'track' | 'fill' | 'note', string>>

export type GaugeBarProps = {
  label: ReactNode
  /** 已经格式化好的数。 */
  value: ReactNode
  /** 数取不到：数那里写原因，换成弱色。 */
  unavailable?: boolean
  /** 数在最小到最大之间的位置（0 到 1，越界按边画）；null 不画填充。 */
  share: number | null
  /** 档位词（整个节点由调用方给，常是一枚徽标）。 */
  level?: ReactNode
  note?: ReactNode
  /** 每个部位额外的类名，写在包里的类名之后。 */
  classes?: GaugeBarClasses
}

const join = (base: string, extra?: string) => (extra ? `${base} ${extra}` : base)

export function GaugeBar({ label, value, unavailable, share, level, note, classes = {} }: GaugeBarProps) {
  return (
    <figure className={join('k-gauge', classes.root)}>
      <figcaption className={join('k-gauge-head', classes.head)}>
        <span className={join('k-gauge-label', classes.label)}>{label}</span>
        <span className={`${join('k-gauge-value', classes.value)}${unavailable ? ' is-unavailable' : ''}`}>
          {value}
        </span>
        {level}
      </figcaption>
      <div className={join('k-gauge-track', classes.track)} aria-hidden="true">
        {share !== null && (
          <span
            className={join('k-gauge-fill', classes.fill)}
            style={{ width: `${Math.min(1, Math.max(0, share)) * 100}%` }}
          />
        )}
      </div>
      {note && <p className={join('k-gauge-note', classes.note)}>{note}</p>}
    </figure>
  )
}
