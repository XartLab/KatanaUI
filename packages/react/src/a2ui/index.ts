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
