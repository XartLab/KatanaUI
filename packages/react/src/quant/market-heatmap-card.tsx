// SPDX-License-Identifier: MIT
// MarketHeatmap 的悬停卡片：跟着鼠标（位置由 CSS 弹簧过渡跟过去），写这只票的价格、各着色指标、大小指标与分组；不伸出图的右沿与下沿。
// 从 market-heatmap.tsx 拆出（G5），行为不变。
import { cn } from '../lib/cn.ts'
import { formatVolume } from '../lib/chart/format/index.ts'
import { SymbolMark } from '../katana/symbol-mark.tsx'
import { formatMetric } from './market-heatmap-model.ts'
import type { PlotBox } from './market-heatmap-hooks.ts'
import type { HeatmapColorBy, HeatmapItem, HeatmapSizeBy, MarketHeatmapLabels } from './market-heatmap-types.ts'

const CARD_W = 200
/** 悬停卡片的高（估算）：标题与内距 67，每行 18；只用来别让卡片伸出图的下沿。 */
const CARD_BASE_H = 67
const CARD_ROW_H = 18

/** open：卡片显示着；snap：这次是刚出现，位置直接放到鼠标旁、不从上一处滑过来。 */
export type Hover = { code: string; x: number; y: number; open: boolean; snap: boolean }

export type HeatmapCardProps = {
  hover: Hover
  hovered: HeatmapItem
  box: PlotBox
  labels: MarketHeatmapLabels
  colorBy: readonly HeatmapColorBy[]
  color: HeatmapColorBy
  size: HeatmapSizeBy
  showGroups: boolean
  priceText: (value: number) => string
}

export function HeatmapCard({
  hover,
  hovered,
  box,
  labels,
  colorBy,
  color,
  size,
  showGroups,
  priceText,
}: HeatmapCardProps) {
  const cardLeft = hover.x + 14 + CARD_W > box.width ? hover.x - 14 - CARD_W : hover.x + 14
  const cardRows =
    (hovered.price === undefined ? 0 : 1) +
    colorBy.length +
    (size.equal ? 0 : 1) +
    (showGroups && hovered.group ? 1 : 0)
  const cardHeight = CARD_BASE_H + cardRows * CARD_ROW_H
  const cardTop = Math.max(0, Math.min(hover.y + 14, box.height - cardHeight))
  return (
    <div
      className="k-mheat-card"
      data-slot="heatmap-card"
      data-open={hover.open || undefined}
      data-snap={hover.snap || undefined}
      aria-hidden={hover.open ? undefined : true}
      role="tooltip"
      style={{ left: cardLeft, top: cardTop, width: CARD_W }}
    >
      <div className="k-mheat-card-title">
        <SymbolMark code={hovered.code} name={hovered.name} src={hovered.logo} size={18} />
        <span className="k-mheat-card-code">{hovered.code}</span>
        <span className="k-mheat-card-name">{hovered.name}</span>
      </div>
      <dl className="k-mheat-card-rows">
        {hovered.price === undefined ? null : (
          <div>
            <dt>{labels.price}</dt>
            <dd>{priceText(hovered.price)}</dd>
          </div>
        )}
        {colorBy.map((option) => (
          <div key={option.key} data-active={option.key === color.key || undefined}>
            <dt>{option.label}</dt>
            <dd
              className={cn(
                (hovered.value[option.key] ?? 0) > 0 && 'is-up',
                (hovered.value[option.key] ?? 0) < 0 && 'is-down',
              )}
            >
              {formatMetric(hovered.value[option.key], option)}
            </dd>
          </div>
        ))}
        {size.equal ? null : (
          <div>
            <dt>{size.label}</dt>
            <dd>{(size.format ?? formatVolume)(hovered.size[size.key] ?? 0)}</dd>
          </div>
        )}
        {showGroups && hovered.group ? (
          <div>
            <dt>{labels.group}</dt>
            <dd>{hovered.group}</dd>
          </div>
        ) : null}
      </dl>
    </div>
  )
}
