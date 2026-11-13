// SPDX-License-Identifier: MIT
// 评级仪表：半圆分五段（强烈卖出、卖出、中性、买入、强烈买入），一根指针按分数转到那一段，圆心下面写档位词。
// 功能参照 TradingView 小组件 Technical Analysis（tradingview.com/widget-docs/widgets/symbol-details/technical-analysis，2026-11-14 读：
// 「便于查看的评级」，一个仪表盘，另有一个显示信号个数的统计视图；页面没写交互）。我们做的：五段颜色走涨跌 token，指针用 gentle 弹簧
//（CSS 的 --ease-gentle）转过去；档位词与三类个数由调用方传（children），所以评级从哪来（均线、振荡指标、分析师）是调用方的事。不嵌、不抄其代码与样式。
import type { CSSProperties, ReactNode } from 'react'
import { ratingAngle, ratingZone, zoneArc, GAUGE_CX, GAUGE_CY, RATING_ZONES } from './rating-gauge-model'

export type RatingGaugeProps = {
  /** −1（强烈卖出）到 +1（强烈买入）。 */
  score: number
  /** 五段的名字，从卖到买；也是档位词的来源。 */
  zones: readonly [string, string, string, string, string]
  /** 读屏名（如「技术面评级」）。 */
  label: string
  /** 圆心下面再写点什么（卖出 / 中性 / 买入各几个）。 */
  children?: ReactNode
  className?: string
}

export function RatingGauge({ score, zones, label, children, className }: RatingGaugeProps) {
  const active = ratingZone(score)
  return (
    <figure
      className={`k-rating${className ? ` ${className}` : ''}`}
      role="img"
      aria-label={`${label}: ${zones[active]}`}
      data-zone={active}
    >
      <svg viewBox="0 0 200 112" aria-hidden="true">
        {Array.from({ length: RATING_ZONES }, (_, i) => (
          <path key={i} className={`k-rating-zone is-z${i}${i === active ? ' is-active' : ''}`} d={zoneArc(i)} />
        ))}
        <g
          className="k-rating-needle"
          style={{ transform: `rotate(${ratingAngle(score)}deg)` } as CSSProperties}
          data-angle={ratingAngle(score)}
        >
          <path d={`M ${GAUGE_CX} ${GAUGE_CY - 70} L ${GAUGE_CX + 4} ${GAUGE_CY} L ${GAUGE_CX - 4} ${GAUGE_CY} Z`} />
        </g>
        <circle className="k-rating-hub" cx={GAUGE_CX} cy={GAUGE_CY} r={6} />
      </svg>
      <figcaption className="k-rating-word">{zones[active]}</figcaption>
      {children && <div className="k-rating-extra">{children}</div>}
    </figure>
  )
}
