# IntradaySeries 盘中分钟线

A 股一天的分钟序列图：时间轴 09:30–15:00（`auction` 时从 09:15 起），午休压成一道细缝；涨停数、炸板率这类单位不同的序列分左右轴；虚线是「昨日同时段」；鼠标或键盘读同一分钟的全部序列；缺分钟留空。KatanaUI#260。

## Sub-features

- `axis-seam` 时间轴刻度是 09:30、10:30、11:30/13:00、14:00、15:00；11:30 与 13:00 之间是一道窄带，不是 90 分钟的宽度。
- `two-axes` 涨停数在左轴、炸板率在右轴，各有自己的刻度。
- `previous-dashed` 涨停数、炸板率各有一条同色虚线（昨日同时段）。
- `gap` 涨停数线在 10:12–10:14 断开，不连过去。
- `crosshair` 鼠标移到图上出竖线和悬停窗：时间，每条序列一行，带虚线的序列多一行「· 昨日同时段」。
- `keyboard` 聚焦绘图区后 ← → 走一分钟、Home / End 到头尾、Esc 清掉。
- `series-toggle` 页上的「全部 / 只看涨跌停数 / 只看炸板率」换显示的序列；只剩炸板率时只有右轴刻度。
- `auction` 第二张图轴从 09:15 起，有两道缝；成交额是柱，轴含 0。
- `empty` 第三块没有序列，写「暂无分钟数据」。

## How to get to it (user POV)

文档站左侧目录「A 股 → IntradaySeries 盘中分钟线」，地址 `#/intraday-series`。演示数据是闭式公式编的，每次打开一样。

## Driving it with kui.mjs

前置：`$KUI doctor` 全 OK。目前没有流程脚本（手走；2026-11-27 用 playwright 脚本走过，证据在 PR 里）。图 `[data-testid="intraday-series"]`，绘图区 `[data-slot="intraday-plot"]`。

- **悬停读数。** 鼠标移到绘图区 35% 处：`[data-slot="lcd-tooltip"]` 出现，标题是时刻（10:55），行有「涨停数」「涨停数 · 昨日同时段」「跌停数」「炸板率」「炸板率 · 昨日同时段」；移走后消失。
- **缝。** 鼠标移到绘图区正中：`data-active` 是 `11:30`（缝里读前一分钟）。
- **断线。** `[data-slot="intraday-line"][data-key="up"]` 的 `d` 里有 2 个 `M`（10:12–10:14 断开）。
- **切序列。** 点「只看炸板率」：图例只剩 1 项，`[data-slot="intraday-rtick"]` 4 个、`[data-slot="intraday-ytick"]` 0 个；点「全部」恢复。
- **键盘。** 聚焦绘图区，按 Home：`data-active` 是 `09:31`；End：`15:00`；Esc：属性消失。
- **证据。** 每步截图，悬停那一步贴 ARIA 快照；组件级像素由 `browser/cn-batch4.browser.test.tsx` 守着。

## Gotchas

- 悬停窗在绘图区里，要先 `mouse.move` 到绘图区，再等 150ms 左右出窗。
- 默认 `gapMinutes=1`：给 5 分钟线却不设它，每个点都是孤点、画不出线。
