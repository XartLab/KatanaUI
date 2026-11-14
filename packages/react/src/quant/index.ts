// SPDX-License-Identifier: MIT
// @katana-ui/react/quant 的出口：量化领域的展示件与格式化函数（#1862）。只依赖包里下层（lib、primitives、patterns），不依赖行情、图表包与应用；
// 品种、价格精度、小数位、单位由调用方传最小的普通类型。纯函数另有 `@katana-ui/react/quant/format` 出口（不带 React，画布与 Worker 里用）。
export { ChangeText } from './change-text'
export { PnlText } from './pnl-text'
export * from './format'
