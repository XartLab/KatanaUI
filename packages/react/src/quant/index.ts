// SPDX-License-Identifier: MIT
// @katana-ui/react/quant 的出口：量化领域的展示件与格式化函数（#1862）。只依赖包里下层（lib、primitives、patterns），不依赖行情、图表包与应用；
// 品种、价格精度、小数位、单位由调用方传最小的普通类型。纯函数另有 `@katana-ui/react/quant/format` 出口（不带 React，画布与 Worker 里用）。
export { ChangeText } from './change-text.tsx'
export { PnlText } from './pnl-text.tsx'
export * from './format/index.ts'
// @katanaview/ui/quant 的出口：量化领域的展示件与格式化函数（#1862）。只依赖包里下层（lib、primitives、patterns），不依赖行情、图表包与应用；
// 品种、价格精度、小数位、单位由调用方传最小的普通类型。纯函数另有 `@katanaview/ui/quant/format` 出口（不带 React，画布与 Worker 里用）。
export { ChangeText } from './change-text'
export { PnlText } from './pnl-text'
export * from './format'

// 时间序列与盈亏的件（#1917）。功能参照 Arc（uiarc.dev，2026-11-14 读），只取功能，实现原创。
export { BrushChart, BrushStrip, type BrushChartProps, type BrushLabels, type BrushStripProps } from './brush-chart'
export type { BrushWindow } from './brush-model'
export { WaterfallChart, type WaterfallChartProps } from './waterfall-chart'
export type { WaterfallBar, WaterfallStep } from './waterfall-model'
export { BulletMeter, type BulletMeterProps } from './bullet-meter'
export type { BulletState } from './bullet-model'
export { CalendarHeatmap, type CalendarDay, type CalendarHeatmapProps } from './calendar-heatmap'
