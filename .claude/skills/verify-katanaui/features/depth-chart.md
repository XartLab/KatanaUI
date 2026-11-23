# DepthChart 深度图

深度图按价位显示买卖累计量，提示框和读屏状态行同时更新距中间价的百分比。

## Sub-features

- `depth-offset-zero` 距中间价舍入成零时，提示框和读屏状态行都显示 `0.00%`。

## How to get to it (user POV)

- 打开文档站 `#/depth-chart`，使用名为「深度图（演示）」的绘图区。

## Driving it with kui.mjs

前置：`$KUI doctor` 全 OK。从新打开的页面开始，演示保持初始档位。

- 聚焦 `section.getByRole('group', { name: '深度图（演示）' })`，按 `ArrowLeft`。`[data-slot="lcd-tooltip"]` 的标题显示 `100.00`，「距中间价」一行显示 `0.00%`。
- 读绘图区 `aria-describedby` 所指的 `[data-slot="depth-readout"]`，文本包含「买盘 100.00」且以「距中间价 0.00%」结尾。
- 保存按键后的截图与读屏状态行文本作为证据。

## Gotchas

- 页面还可能显示静态用法例子。按「深度图（演示）」定位，便于用最优买价 `100.00` 复现。
