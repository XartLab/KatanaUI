// SPDX-License-Identifier: MIT
// MarketHeatmap 的图例：七档色块与各档的值边界；悬停或聚焦一档预览（其余格子变暗），点一档隐藏这一档的格子。
// 从 market-heatmap.tsx 拆出（G5），行为不变。
import { formatLegend, formatRange, HEAT_STEPS, stepCenter, type HeatStep } from './market-heatmap-model.ts'
import type { HeatmapColorBy, MarketHeatmapLabels } from './market-heatmap-types.ts'

export type HeatmapLegendProps = {
  color: HeatmapColorBy
  /** 一档的宽（指标的单位）。 */
  unit: number
  hiddenSteps: ReadonlySet<number>
  labels: MarketHeatmapLabels
  onPreview: (step: number | null) => void
  onToggle: (step: number) => void
}

export function HeatmapLegend({ color, unit, hiddenSteps, labels, onPreview, onToggle }: HeatmapLegendProps) {
  return (
    <ol className="k-mheat-legend" data-slot="heatmap-legend" aria-label={color.label}>
      {HEAT_STEPS.map((step: HeatStep) => {
        const off = hiddenSteps.has(step)
        return (
          <li key={step}>
            <button
              type="button"
              aria-pressed={off}
              aria-label={labels.segment(formatRange(step, unit, color))}
              title={formatRange(step, unit, color)}
              className="k-mheat-segment"
              data-slot="heatmap-segment"
              data-step={step}
              onPointerEnter={() => onPreview(step)}
              onPointerLeave={() => onPreview(null)}
              onFocus={() => onPreview(step)}
              onBlur={() => onPreview(null)}
              onClick={() => onToggle(step)}
            >
              <i className="k-mheat-swatch" data-slot="heatmap-swatch" data-step={step} data-off={off || undefined} />
              <span>{formatLegend(stepCenter(step, unit), color)}</span>
            </button>
          </li>
        )
      })}
    </ol>
  )
}
