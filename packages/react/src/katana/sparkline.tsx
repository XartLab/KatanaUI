// SPDX-License-Identifier: MIT
// 迷你图：一列数从旧到新，整宽铺开、上下按这列的高低，一根线。线色按头尾涨跌（涨绿跌红，跟涨跌配色走）。
// 画法从应用的分析视图 SparklineView 提来（#1884，调用方零改动）；功能参照 TradingView 小组件 Mini Chart / Symbol Overview
//（tradingview.com/widget-docs，2026-11-14 读：页面只列出组件名，没写交互，所以只取「一眼看走势」这一条），不嵌、不抄其代码与样式。
import { quoteTone, type QuoteTone } from './quote-tone.ts'

const W = 200
const H = 36

/** 某个值在 [lo, hi] 里的纵坐标：最高在顶、最低在底，上下各留 2。hi 等于 lo 时按 1 的跨度算（一条平线落在底边）。纯函数。 */
export function sparkY(value: number, lo: number, hi: number, height = H): number {
  return height - 2 - ((value - lo) / (hi - lo || 1)) * (height - 4)
}

/**
 * 折线的点（SVG polyline 的 points）：x 铺满整宽，y 按这列的最低到最高，上下各留 2。少于两个数返回空串。纯函数。
 * extent：给了就按它的 [最低, 最高] 排，不按这列自己的（图里还要画阈值线、要它也落在图里时用，#1929）。
 */
export function sparkPoints(
  values: readonly number[],
  width = W,
  height = H,
  extent?: readonly [number, number],
): string {
  if (values.length < 2) return ''
  const lo = extent ? extent[0] : Math.min(...values)
  const hi = extent ? extent[1] : Math.max(...values)
  return values
    .map((value, i) => `${((i / (values.length - 1)) * width).toFixed(2)},${sparkY(value, lo, hi, height).toFixed(2)}`)
    .join(' ')
}

/** 头尾比：涨、跌、持平；少于两个数算持平。 */
export const sparkTone = (values: readonly number[]): QuoteTone =>
  values.length > 1 ? quoteTone(values[values.length - 1]! - values[0]!) : 'flat'

export type SparklineProps = {
  /** 从旧到新。 */
  values: readonly number[]
  /** 读屏名（整句，含「没有数据」的说法）：由调用方按界面语言写。 */
  label: string
  /** 不给就按头尾涨跌。 */
  tone?: QuoteTone
  /** 加在 svg 上，写在 is-<tone> 之前。 */
  className?: string
  /** 没数据时那个「—」的额外类名。 */
  emptyClassName?: string
}

export function Sparkline({ values, label, tone, className, emptyClassName }: SparklineProps) {
  const points = sparkPoints(values)
  if (!points)
    return (
      <span className={`k-spark-empty${emptyClassName ? ` ${emptyClassName}` : ''}`} role="img" aria-label={label}>
        —
      </span>
    )
  return (
    <svg
      className={`k-spark${className ? ` ${className}` : ''} is-${tone ?? sparkTone(values)}`}
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      role="img"
      aria-label={label}
    >
      <polyline points={points} />
    </svg>
  )
}
