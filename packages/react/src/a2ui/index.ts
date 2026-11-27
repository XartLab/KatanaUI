// SPDX-License-Identifier: MIT
// @katana-ui/react/a2ui 的出口：把 KatanaUI 的组件登记成 A2UI v1.0 目录，让智能体只发布局数据、前端用我们的件渲染。
// 这是独立入口：@a2ui/react、@a2ui/web_core、zod 是可选的 peer 依赖，主入口 @katana-ui/react 不引这里的任何东西。
export {
  BASIC_LAYOUT_NAMES,
  EXCLUDED_FUNCTIONS,
  KATANA_APIS,
  KATANA_CATALOG_ID,
  KATANA_COMPONENTS,
  KATANA_INSTRUCTIONS,
  katanaCatalog,
} from './catalog.ts'
export { KatanaAiStatus, KatanaAiStatusApi } from './components/katana-ai-status.tsx'
export { KatanaAlert, KatanaAlertApi } from './components/katana-alert.tsx'
export { KatanaCheckbox, KatanaCheckboxApi } from './components/katana-checkbox.tsx'
export { KatanaToggleGroup, KatanaToggleGroupApi } from './components/katana-toggle-group.tsx'
export { KatanaMultiSelect, KatanaMultiSelectApi } from './components/katana-multi-select.tsx'
export { KatanaChipGroup, KatanaChipGroupApi } from './components/katana-chip-group.tsx'
export { KatanaNumberInput, KatanaNumberInputApi } from './components/katana-number-input.tsx'
export { KatanaDecimalField, KatanaDecimalFieldApi } from './components/katana-decimal-field.tsx'
export { KatanaDateRangePicker, KatanaDateRangePickerApi } from './components/katana-date-range-picker.tsx'
export { KatanaDurationPicker, KatanaDurationPickerApi } from './components/katana-duration-picker.tsx'
export { KatanaCombobox, KatanaComboboxApi } from './components/katana-combobox.tsx'
export { KatanaPasswordInput, KatanaPasswordInputApi } from './components/katana-password-input.tsx'
export {
  KatanaToast,
  KatanaToastApi,
  KatanaToastHostContext,
  type KatanaToastRequest,
} from './components/katana-toast.tsx'
export { KatanaCodeBlock, KatanaCodeBlockApi } from './components/katana-code-block.tsx'
export { KatanaJsonViewer, KatanaJsonViewerApi } from './components/katana-json-viewer.tsx'
export { KatanaSymbolMark, KatanaSymbolMarkApi } from './components/katana-symbol-mark.tsx'
export { KatanaCommand, KatanaCommandApi } from './components/katana-command.tsx'
export { KatanaButton, KatanaButtonApi } from './components/katana-button.tsx'
export { KatanaChangeText, KatanaChangeTextApi } from './components/katana-change-text.tsx'
export { KatanaDateTimeInput, KatanaDateTimeInputApi } from './components/katana-date-time-input.tsx'
export { KatanaDecisionQueue, KatanaDecisionQueueApi } from './components/katana-decision-queue.tsx'
export { KatanaHypothesisLedger, KatanaHypothesisLedgerApi } from './components/katana-hypothesis-ledger.tsx'
export { KatanaMetricCard, KatanaMetricCardApi } from './components/katana-metric-card.tsx'
export { KatanaPnlText, KatanaPnlTextApi } from './components/katana-pnl-text.tsx'
export { KatanaSelect, KatanaSelectApi } from './components/katana-select.tsx'
export { KatanaSlider, KatanaSliderApi } from './components/katana-slider.tsx'
export { KatanaSparkline, KatanaSparklineApi } from './components/katana-sparkline.tsx'
export { KatanaSwitch, KatanaSwitchApi } from './components/katana-switch.tsx'
export { KatanaTextField, KatanaTextFieldApi } from './components/katana-text-field.tsx'
export { KatanaWebSearch, KatanaWebSearchApi } from './components/katana-web-search.tsx'
export { KatanaBadgeGroup, KatanaBadgeGroupApi } from './components/katana-badge-group.tsx'
export { KatanaLed, KatanaLedApi } from './components/katana-led.tsx'
export { KatanaLcd, KatanaLcdApi } from './components/katana-lcd.tsx'
export { KatanaRollingText, KatanaRollingTextApi } from './components/katana-rolling-text.tsx'
export { KatanaStatusIcon, KatanaStatusIconApi } from './components/katana-status-icon.tsx'
export { KatanaProgress, KatanaProgressApi } from './components/katana-progress.tsx'
export { KatanaMeter, KatanaMeterApi } from './components/katana-meter.tsx'
export { KatanaRatingText, KatanaRatingTextApi } from './components/katana-rating-text.tsx'
export { KatanaEstimateBadge, KatanaEstimateBadgeApi } from './components/katana-estimate-badge.tsx'
export { KatanaPriceTag, KatanaPriceTagApi } from './components/katana-price-tag.tsx'
export { KatanaQuoteCard, KatanaQuoteCardApi } from './components/katana-quote-card.tsx'
export { KatanaGaugeBar, KatanaGaugeBarApi } from './components/katana-gauge-bar.tsx'
export { KatanaRatingGauge, KatanaRatingGaugeApi } from './components/katana-rating-gauge.tsx'
export { KatanaRangeBar, KatanaRangeBarApi } from './components/katana-range-bar.tsx'
export { KatanaSparkTile, KatanaSparkTileApi } from './components/katana-spark-tile.tsx'
export { KatanaKeyStats, KatanaKeyStatsApi } from './components/katana-key-stats.tsx'
export { KatanaPerformanceStrip, KatanaPerformanceStripApi } from './components/katana-performance-strip.tsx'
export { KatanaPeerCards, KatanaPeerCardsApi } from './components/katana-peer-cards.tsx'
export { KatanaStatementTable, KatanaStatementTableApi } from './components/katana-statement-table.tsx'
export { KatanaCompsTable, KatanaCompsTableApi } from './components/katana-comps-table.tsx'
export { KatanaValuationBand, KatanaValuationBandApi } from './components/katana-valuation-band.tsx'
export { KatanaFlowGauges, KatanaFlowGaugesApi } from './components/katana-flow-gauges.tsx'
export { KatanaRegimeStrip, KatanaRegimeStripApi } from './components/katana-regime-strip.tsx'
