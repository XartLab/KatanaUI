// SPDX-License-Identifier: MIT
// 业绩条：一排等宽的格子，上行是周期（1 天、5 天、1 月 ……全部时间），下行是这一段的涨跌幅；点一格选中（灰底），回调交给调用方去切图表区间。
// 功能与布局参照 TradingView 品种页的 Performance 一行（主会话 2026-11-15 在真实浏览器里实测 /symbols/NASDAQ-AAPL/，只取布局与交互，不抄代码）：
// 十格等宽、涨跌幅上色、涨跌幅很大时写成「1.23K%」。颜色走涨跌语义色（--pnl-up / --pnl-down），选中是中性灰底，不用 TV 的蓝。
// 数与周期名都由调用方传，件不算涨跌幅。
import { useState } from 'react'
import { cn } from '../lib/cn.ts'
import { formatPercentChange, toneOf } from '../lib/chart/format/index.ts'

export type PerformanceItem = {
  key: string
  /** 周期名，调用方写好（「1 天」「Year to date」）。 */
  label: string
  /** 涨跌幅，百分数（12.5 就是 12.5%）；没有写 null / undefined，画「—」。 */
  change: number | null | undefined
}

export type PerformanceStripProps = {
  items: readonly PerformanceItem[]
  /** 选中的格子 key（受控）。 */
  value?: string
  defaultValue?: string
  onValueChange?: (key: string) => void
  /** 读屏名，如「区间业绩」。 */
  label: string
  digits?: number
  className?: string
}

/** 涨跌幅文字：一千个百分点以上写成「1.23K%」「4.5M%」，其余同 formatPercentChange；不是有限数写「—」。纯函数。 */
export function formatPerformance(value: number | null | undefined, digits = 2): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '—'
  const abs = Math.abs(value)
  if (abs < 1000) return formatPercentChange(value, digits)
  const [div, unit] = abs >= 1e6 ? [1e6, 'M'] : [1e3, 'K']
  return `${value < 0 ? '-' : '+'}${(abs / div).toFixed(digits)}${unit}%`
}

export function PerformanceStrip({
  items,
  value,
  defaultValue,
  onValueChange,
  label,
  digits = 2,
  className,
}: PerformanceStripProps) {
  const [inner, setInner] = useState(defaultValue)
  const current = value ?? inner
  return (
    <div className={cn('k-perf', className)} role="group" aria-label={label} data-slot="performance-strip">
      {items.map((item) => {
        const tone = typeof item.change === 'number' ? toneOf(item.change, digits) : 'flat'
        const on = item.key === current
        return (
          <button
            key={item.key}
            type="button"
            className="k-perf-cell"
            data-slot="performance-cell"
            data-key={item.key}
            data-tone={tone}
            aria-pressed={on}
            onClick={() => {
              if (value === undefined) setInner(item.key)
              onValueChange?.(item.key)
            }}
          >
            <span className="k-perf-label">{item.label}</span>
            <span className="k-perf-value">{formatPerformance(item.change, digits)}</span>
          </button>
        )
      })}
    </div>
  )
}
