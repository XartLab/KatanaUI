// SPDX-License-Identifier: MIT
// MarketHeatmap 的工具条：数据集、大小、颜色、分组（下拉或分段两种写法），全屏，显示开关（徽标、标题、格内数值），「在选股器打开」。
// 从 market-heatmap.tsx 拆出（G5），行为不变；状态都在主件里，这里只画与回调。
import { MaximizeIcon } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../primitives/select.tsx'
import { Switch } from '../primitives/switch.tsx'
import { ToggleGroup, ToggleGroupItem } from '../primitives/toggle-group.tsx'
import type {
  HeatmapColorBy,
  HeatmapSizeBy,
  HeatmapTitleMode,
  HeatmapValueMode,
  MarketHeatmapLabels,
  MarketHeatmapProps,
} from './market-heatmap-types.ts'

export type HeatmapToolbarProps = Pick<
  MarketHeatmapProps,
  'sizeBy' | 'colorBy' | 'toolbar' | 'datasets' | 'dataset' | 'onDatasetChange' | 'onOpenInScreener'
> & {
  labels: MarketHeatmapLabels
  size: HeatmapSizeBy
  color: HeatmapColorBy
  onSizeKey: (key: string) => void
  onColorKey: (key: string) => void
  hasGroups: boolean
  grouped: boolean
  onGrouped: (grouped: boolean) => void
  onFullscreen: () => void
  showLogo: boolean
  setShowLogo: (show: boolean) => void
  titleMode: HeatmapTitleMode
  setTitleMode: (mode: HeatmapTitleMode) => void
  valueMode: HeatmapValueMode
  setValueMode: (mode: HeatmapValueMode) => void
}

export function HeatmapToolbar({
  labels,
  sizeBy,
  colorBy,
  size,
  color,
  onSizeKey,
  onColorKey,
  hasGroups,
  grouped,
  onGrouped,
  onFullscreen,
  showLogo,
  setShowLogo,
  titleMode,
  setTitleMode,
  valueMode,
  setValueMode,
  toolbar = 'dropdowns',
  datasets,
  dataset,
  onDatasetChange,
  onOpenInScreener,
}: HeatmapToolbarProps) {
  const display = labels.display
  return (
    <div className="k-mheat-bar" data-slot="heatmap-toolbar">
      {datasets && datasets.length > 0 ? (
        <Select value={dataset ?? datasets[0].key} onValueChange={(next) => onDatasetChange?.(next)}>
          <SelectTrigger aria-label={labels.dataset ?? labels.group} className="k-mheat-select">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {datasets.map((option) => (
              <SelectItem key={option.key} value={option.key}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}
      {toolbar === 'dropdowns' ? (
        <>
          <Select value={size.key} onValueChange={onSizeKey}>
            <SelectTrigger aria-label={labels.sizeBy} className="k-mheat-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sizeBy.map((option) => (
                <SelectItem key={option.key} value={option.key}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={color.key} onValueChange={onColorKey}>
            <SelectTrigger aria-label={labels.colorBy} className="k-mheat-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {colorBy.map((option) => (
                <SelectItem key={option.key} value={option.key}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {hasGroups ? (
            <Select value={grouped ? 'grouped' : 'flat'} onValueChange={(next) => onGrouped(next === 'grouped')}>
              <SelectTrigger aria-label={labels.view} className="k-mheat-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="grouped">{labels.grouped}</SelectItem>
                <SelectItem value="flat">{labels.flat}</SelectItem>
              </SelectContent>
            </Select>
          ) : null}
        </>
      ) : (
        <>
          <div className="k-mheat-field">
            <span className="k-mheat-field-label">{labels.sizeBy}</span>
            <ToggleGroup variant="sm" aria-label={labels.sizeBy} value={size.key} onValueChange={onSizeKey}>
              {sizeBy.map((option) => (
                <ToggleGroupItem key={option.key} value={option.key}>
                  {option.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
          <div className="k-mheat-field">
            <span className="k-mheat-field-label">{labels.colorBy}</span>
            <ToggleGroup variant="sm" aria-label={labels.colorBy} value={color.key} onValueChange={onColorKey}>
              {colorBy.map((option) => (
                <ToggleGroupItem key={option.key} value={option.key}>
                  {option.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
          {hasGroups ? (
            <div className="k-mheat-field">
              <span className="k-mheat-field-label">{labels.view}</span>
              <ToggleGroup
                variant="sm"
                aria-label={labels.view}
                value={grouped ? 'grouped' : 'flat'}
                onValueChange={(next) => onGrouped(next === 'grouped')}
              >
                <ToggleGroupItem value="grouped">{labels.grouped}</ToggleGroupItem>
                <ToggleGroupItem value="flat">{labels.flat}</ToggleGroupItem>
              </ToggleGroup>
            </div>
          ) : null}
        </>
      )}
      {labels.fullscreen ? (
        <button
          type="button"
          className="k-mheat-fullscreen"
          data-slot="heatmap-fullscreen"
          aria-label={labels.fullscreen}
          title={labels.fullscreen}
          onClick={onFullscreen}
        >
          <MaximizeIcon size={14} aria-hidden="true" />
        </button>
      ) : null}
      {display ? (
        <>
          <div className="k-mheat-field">
            <span className="k-mheat-field-label">{display.logo}</span>
            <Switch checked={showLogo} onCheckedChange={setShowLogo} aria-label={display.logo} />
          </div>
          <div className="k-mheat-field">
            <span className="k-mheat-field-label">{display.title.label}</span>
            <ToggleGroup
              variant="sm"
              aria-label={display.title.label}
              value={titleMode}
              onValueChange={(next) => setTitleMode(next as HeatmapTitleMode)}
            >
              <ToggleGroupItem value="none">{display.title.none}</ToggleGroupItem>
              <ToggleGroupItem value="code">{display.title.code}</ToggleGroupItem>
              <ToggleGroupItem value="name">{display.title.name}</ToggleGroupItem>
            </ToggleGroup>
          </div>
          <div className="k-mheat-field">
            <span className="k-mheat-field-label">{display.value.label}</span>
            <ToggleGroup
              variant="sm"
              aria-label={display.value.label}
              value={valueMode}
              onValueChange={(next) => setValueMode(next as HeatmapValueMode)}
            >
              <ToggleGroupItem value="none">{display.value.none}</ToggleGroupItem>
              <ToggleGroupItem value="price">{display.value.price}</ToggleGroupItem>
              {size.equal ? null : <ToggleGroupItem value="size">{display.value.size}</ToggleGroupItem>}
              <ToggleGroupItem value="change">{display.value.change}</ToggleGroupItem>
            </ToggleGroup>
          </div>
        </>
      ) : null}
      {onOpenInScreener && labels.openInScreener ? (
        <button type="button" className="k-mheat-open" data-slot="heatmap-open-screener" onClick={onOpenInScreener}>
          {labels.openInScreener}
        </button>
      ) : null}
    </div>
  )
}
