// SPDX-License-Identifier: MIT
// SeriesExplorer 图上的事件点：点 + 斜引线 + 编号 + 短标签，标签在四个方向里挑第一个不压数据线、不出界的。从 series-explorer.tsx 拆出（G5），行为不变。
import type { CSSProperties } from 'react'
import { fontFor, measureText } from '../../lib/text-measure.ts'
import { pct, PLOT_W, type Plot } from '../../lib/chart/series-geometry.ts'
import { pointValue, type SeriesDef, type SeriesPoint } from './series-explorer-model.ts'

export type SeriesEventsProps = {
  events: readonly { at: number; label: string }[]
  shown: readonly SeriesPoint[]
  def: SeriesDef
  plot: Plot
  chartHeight: number
}

export function SeriesEvents({ events, shown, def, plot, chartHeight }: SeriesEventsProps) {
  return events.map((event, n) => {
    const i = shown.findIndex((point) => point.at === event.at)
    const value = i < 0 ? null : pointValue(shown[i]!, def.key)
    if (i < 0 || value === null) return null
    const x = plot.xAt(i)
    const y = plot.yAt(value)
    // 引线与标签的避让（简单版）：四个方向（上 / 下 × 右 / 左）按「空间大的一侧、靠右的往左」排好先后，
    // 取第一个标签框不压数据线的；都压就用第一个。标签字宽用 pretext 量（2026-11-17），绘图区宽仍按 700px 估（1px ≈ PLOT_W / 700）；
    // 长度取到边缘留 16px 为止（标签半行高 8px 加余量）（10–28px）。
    const run = 28
    const pxToX = PLOT_W / 700
    const textW = (measureText(event.label, fontFor(400, 11, '--font-sans-small')) + 22) * pxToX
    const prefTop = y > chartHeight / 2
    const prefRight = x <= PLOT_W * 0.65
    const choices = [
      [prefRight, prefTop],
      [prefRight, !prefTop],
      [!prefRight, prefTop],
      [!prefRight, !prefTop],
    ].map(([right, top]) => {
      const room = top ? y - 16 : chartHeight - y - 16
      const rise = Math.max(10, Math.min(28, room))
      const endY = top ? y - rise : y + rise
      const from = right ? x + run * pxToX : x - run * pxToX - textW
      const clash = shown.some((point, j) => {
        const v = pointValue(point, def.key)
        if (v === null || def.kind !== 'line') return false
        const px = plot.xAt(j)
        return px >= from && px <= from + textW && Math.abs(plot.yAt(v) - endY) < 10
      })
      const inside = from >= 0 && from + textW <= PLOT_W && endY >= 10 && endY <= chartHeight - 10
      return { right, top, rise, ok: inside && !clash }
    })
    const pick = choices.find((choice) => choice.ok) ?? choices[0]!
    const rise = pick.rise
    const sx = pick.right ? 1 : -1
    const sy = pick.top ? -1 : 1
    return (
      <span
        key={event.at}
        className="k-sx-evt"
        data-slot="series-event"
        data-side={sx < 0 ? 'left' : 'right'}
        data-up={sy < 0 ? 'true' : undefined}
        style={
          {
            left: pct(x),
            top: y,
            '--k-run': `${run}px`,
            '--k-rise': `${rise}px`,
            '--k-sx': sx,
            '--k-sy': sy,
            '--k-len': `${Math.hypot(run, rise)}px`,
            '--k-deg': `${(Math.atan2(sy * rise, sx * run) * 180) / Math.PI}deg`,
          } as CSSProperties
        }
      >
        <i className="k-sx-evt-dot" />
        <b className="k-sx-evt-lead" />
        <span className="k-sx-evt-text">
          <em>{String(n + 1).padStart(2, '0')}</em> {event.label}
        </span>
      </span>
    )
  })
}
