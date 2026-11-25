// SPDX-License-Identifier: MIT
// 分档分布柱 DistributionBars（#109，KATANAview #1988 F04）：把一批品种按涨跌幅分成 9 或 11 档（跌停…涨停），每档一根柱，柱顶标家数，
// 底部一行汇总（涨 x / 平 y / 跌 z）。档的边界、档名与汇总的名字都由调用方传，件只按家数画柱、按色调汇总。
// 结构照 metric-card 一族：数据与文字全由调用方传，没有数据就是空态，不画样本；颜色只用语义色调（up / down / muted / accent）映到 token，不收色值。
// 图是 HTML 柱不是 SVG：柱顶的家数是文字，要跟柱一起按列对齐。
import type { ReactNode } from 'react'
import { cn } from '../lib/cn.ts'
import type { GaugeTone } from '../quotes/gauge-bar.tsx'

export type DistributionTone = GaugeTone

export type DistributionBin = {
  key: string
  /**
   * The bin name under the bar (e.g. "-3%"), written by the caller.
   * 档名（柱下面的字，如「-3%」「涨停」），由调用方写。
   */
  label: ReactNode
  /**
   * The count in this bin; null means no number (no bar, a dash above).
   * 这一档的家数；null 是没有数（不画柱，柱顶写「—」）。
   */
  count: number | null
  /**
   * Semantic tone of the bar; the totals line groups by it.
   * 柱的色调；汇总按它分组。
   */
  tone: DistributionTone
}

/** 汇总行里涨 / 平 / 跌各叫什么（由调用方写）；没写的那一项不出现。数是各档按色调（up / muted / down）加起来的家数。 */
export type DistributionTotals = Partial<Record<'up' | 'muted' | 'down', ReactNode>>

export type DistributionBarsProps = {
  /**
   * The bins in display order (9 or 11 are typical); edges and names are the caller's.
   * 各档，按显示次序（常见 9 或 11 档）；边界与档名由调用方定。
   */
  bins: readonly DistributionBin[]
  /**
   * Screen-reader name of the whole chart (a full sentence).
   * 整张图的读屏名（整句）。
   */
  label: string
  /**
   * Names for the totals line (up / muted / down); the numbers are the counts summed by tone. A missing name leaves that item out.
   * 汇总行里涨 / 平 / 跌各叫什么，数是按色调加起来的家数；没写的那一项不出现。
   */
  totals?: DistributionTotals
  /**
   * How a count is written; thousands separators by default.
   * 家数写成什么；默认千分位。
   */
  formatCount?: (count: number) => string
  /**
   * Text shown when there is no data; a dash by default.
   * 没有数据时写的字；默认「—」。
   */
  empty?: ReactNode
  /**
   * Height of the bar area in px, including the count row; 96 by default.
   * 柱区的高（px，含柱顶的家数那一行）；默认 96。
   */
  height?: number
  /** Extra class names on the root. */
  className?: string
}

const COUNT_ROW = 16
const TOTAL_ORDER = ['up', 'muted', 'down'] as const

/** 各色调的家数之和（没有数的档不算）。纯函数。 */
export function distributionTotals(bins: readonly DistributionBin[]): Record<'up' | 'muted' | 'down', number> {
  const sums = { up: 0, muted: 0, down: 0 }
  for (const bin of bins) {
    if (bin.count !== null && (bin.tone === 'up' || bin.tone === 'muted' || bin.tone === 'down')) {
      sums[bin.tone] += bin.count
    }
  }
  return sums
}

/** 柱高（px）：家数占最大档的比例乘以柱区高度（扣掉柱顶那一行）；有家数的至少 1px，没有的 0。纯函数。 */
export function distributionBarHeight(count: number | null, max: number, height: number): number {
  if (count === null || count <= 0 || max <= 0) return 0
  return Math.max(1, Math.round((count / max) * (height - COUNT_ROW)))
}

const defaultFormat = (count: number) => count.toLocaleString('en-US')

export function DistributionBars({
  bins,
  label,
  totals,
  formatCount = defaultFormat,
  empty = '—',
  height = 96,
  className,
}: DistributionBarsProps) {
  const filled = bins.filter((bin) => bin.count !== null)
  if (filled.length === 0) {
    return (
      <div
        className={cn('k-dist', className)}
        data-slot="distribution-bars"
        data-empty="true"
        aria-label={label}
        role="group"
      >
        <p className="k-dist-empty">{empty}</p>
      </div>
    )
  }
  const max = Math.max(...filled.map((bin) => bin.count!))
  const sums = distributionTotals(bins)
  return (
    <div className={cn('k-dist', className)} data-slot="distribution-bars" role="group" aria-label={label}>
      <div className="k-dist-plot" style={{ height }}>
        {bins.map((bin) => (
          <div
            key={bin.key}
            className="k-dist-col"
            data-slot="distribution-bin"
            data-key={bin.key}
            data-tone={bin.tone}
          >
            <span className="k-dist-count">{bin.count === null ? '—' : formatCount(bin.count)}</span>
            <i className="k-dist-fill" style={{ height: distributionBarHeight(bin.count, max, height) }} />
          </div>
        ))}
      </div>
      <div className="k-dist-axis" aria-hidden="true">
        {bins.map((bin) => (
          <span key={bin.key} className="k-dist-label">
            {bin.label}
          </span>
        ))}
      </div>
      {totals && TOTAL_ORDER.some((tone) => totals[tone] !== undefined) ? (
        <p className="k-dist-totals" data-slot="distribution-totals">
          {TOTAL_ORDER.map((tone) =>
            totals[tone] === undefined ? null : (
              <span key={tone} data-tone={tone}>
                {totals[tone]} <b>{formatCount(sums[tone])}</b>
              </span>
            ),
          )}
        </p>
      ) : null}
    </div>
  )
}
