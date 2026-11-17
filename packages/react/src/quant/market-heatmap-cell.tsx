// SPDX-License-Identifier: MIT
// MarketHeatmap 的一格：按格子的真实像素分四档写字（大 = 徽标 + 代码 + 读数；中 = 代码 + 读数；小 = 只有徽标；更小 = 只有色块）。
// 从 market-heatmap.tsx 拆出（G5），行为不变；选中、漫游焦点、悬停卡片的状态在主件里。
import type { CSSProperties, FocusEvent, KeyboardEvent } from 'react'
import { cn } from '../lib/cn.ts'
import { formatVolume } from '../lib/chart/format/index.ts'
import { fontFor, measureText } from '../lib/text-measure.ts'
import { SymbolMark } from '../katana/symbol-mark.tsx'
import type { TreemapCell } from '../katana/treemap-model.ts'
import { formatMetric } from './market-heatmap-model.ts'
import type {
  HeatmapColorBy,
  HeatmapEntry,
  HeatmapSizeBy,
  HeatmapTitleMode,
  HeatmapValueMode,
} from './market-heatmap-types.ts'

/** 格子多小就不写字（像素）：宽要放得下整个代码（pretext 量的真实字宽，两边内距共 10），不然画出来是被截断的半截代码；再加一行读数要更高。 */
const MIN_CODE_W = 40
const CODE_PAD_W = 10
const MIN_CODE_H = 24
const MIN_VALUE_H = 40
/** 徽标分三档（按格子实际像素，同一个件不分小屏大屏）：徽标直径、需要的最小宽高；公司名要更大的格子。待定（#15）：像素阈值没实测，照 1920×1080 与 760 宽两种面板目测取的。 */
const LOGO_TIERS = [
  { size: 32, w: 140, h: 120 },
  { size: 24, w: 96, h: 72 },
] as const
/** 格子的四档（用户 2026-11-15 实测 TradingView 热图）：大 = 徽标 + 代码 + 读数；中 = 代码 + 读数；小 = 只有徽标（没图片是首字母）；更小 = 只有色块。 */
const SMALL_LOGO = 16
const MIN_SMALL_W = 20
const MIN_SMALL_H = 20
const NAME_W = 120
const NAME_H = 110

/** 格内代码 / 名字的真实宽度（像素，12px 半粗体数据字）：用 pretext 量，不再按每字 7.4 估（2026-11-17）。 */
const textWidth = (text: string) => measureText(text, fontFor(600, 12, '--font-num'))

export type HeatmapCellProps = {
  cell: TreemapCell<HeatmapEntry>
  size: HeatmapSizeBy
  color: HeatmapColorBy
  /** 着色指标落在哪一档；没有数是 null。 */
  step: number | null
  /** 图例里这一档被隐藏了。 */
  hidden: boolean
  /** 这一组里拿 Tab 的那一格（漫游焦点）。 */
  tabbable: boolean
  selected: boolean
  flash?: 'up' | 'down'
  /** 变暗的原因：图例预览别的档、悬停别的组。 */
  dim?: 'legend' | 'group'
  showLogo: boolean
  titleMode: HeatmapTitleMode
  valueMode: HeatmapValueMode
  priceText: (value: number) => string
  onSelect?: (code: string) => void
  onKeyDown: (event: KeyboardEvent<HTMLElement>) => void
  onFocus: (event: FocusEvent<HTMLElement>) => void
  onBlur: () => void
}

export function HeatmapCell({
  cell,
  size,
  color,
  step,
  hidden,
  tabbable,
  selected,
  flash,
  dim,
  showLogo,
  titleMode,
  valueMode,
  priceText,
  onSelect,
  onKeyDown,
  onFocus,
  onBlur,
}: HeatmapCellProps) {
  const item = cell.data
  const w = cell.x1 - cell.x0
  const h = cell.y1 - cell.y0
  const showCode =
    w >= Math.max(MIN_CODE_W, textWidth(titleMode === 'name' ? item.name : item.symbol) + CODE_PAD_W) && h >= MIN_CODE_H
  const showValue = showCode && h >= MIN_VALUE_H
  const logo = showCode && showLogo ? LOGO_TIERS.find((tier) => w >= tier.w && h >= tier.h) : undefined
  const logoOnly = !showCode && showLogo && w >= MIN_SMALL_W && h >= MIN_SMALL_H
  const showName = titleMode === 'code' && logo !== undefined && logo.size >= 24 && w >= NAME_W && h >= NAME_H
  const text = formatMetric(item.value[color.key], color)
  const cellValue =
    valueMode === 'price'
      ? item.price === undefined
        ? '—'
        : priceText(item.price)
      : valueMode === 'size'
        ? (size.format ?? formatVolume)(item.size[size.key] ?? 0)
        : text
  return (
    <div
      role="button"
      tabIndex={hidden ? -1 : tabbable ? 0 : -1}
      aria-label={`${item.name} ${item.symbol} ${text}`}
      aria-pressed={selected}
      aria-hidden={hidden || undefined}
      className={cn('k-mheat-cell', flash && 'k-live-flash')}
      data-slot="heatmap-cell"
      data-code={item.symbol}
      data-size={size.equal ? 1 : (item.size[size.key] ?? 0)}
      data-step={step ?? 'na'}
      data-hidden={hidden || undefined}
      data-dim={dim}
      data-flash={flash}
      data-selected={selected || undefined}
      data-labelled={showCode}
      data-logo={logo?.size ?? (logoOnly ? SMALL_LOGO : undefined)}
      style={{ left: cell.x0, top: cell.y0, width: w, height: h } satisfies CSSProperties}
      onClick={() => onSelect?.(item.symbol)}
      onKeyDown={onKeyDown}
      onFocus={onFocus}
      onBlur={onBlur}
    >
      {showCode ? (
        <>
          {logo ? (
            <SymbolMark className="k-mheat-logo" code={item.symbol} name={item.name} src={item.logo} size={logo.size} />
          ) : null}
          {titleMode === 'none' ? null : (
            <span className="k-mheat-code">{titleMode === 'name' ? item.name : item.symbol}</span>
          )}
          {showName ? <span className="k-mheat-name">{item.name}</span> : null}
          {showValue && valueMode !== 'none' ? <span className="k-mheat-value">{cellValue}</span> : null}
        </>
      ) : logoOnly ? (
        <SymbolMark code={item.symbol} name={item.name} src={item.logo} size={SMALL_LOGO} />
      ) : null}
    </div>
  )
}
