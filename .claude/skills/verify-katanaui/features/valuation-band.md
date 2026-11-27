# ValuationBand 估值带

估值（市盈率、市净率）历史曲线，背后是历史分位带（默认 20 / 50 / 80），当前点标「估值 · P分位」，悬停读某一点的估值与分位。KatanaUI#260。

## Sub-features

- `bands` 三条分位线隔出四块带，由低到高越来越深；右边标「20 分位 11.3 倍」这样的分位标注。
- `current` 最后一个有值的点是圆点，旁边写「估值 · 分位」。
- `crosshair` 悬停出竖线和窗：时间、市盈率、历史分位（P91）；← → 逐点，Home / End，Esc 清掉。
- `custom-percentiles` 第二张图是 10 / 50 / 90 分位。
- `gap` 第二张图中间 8 周缺值，线断开、不进分位。

## How to get to it (user POV)

文档站左侧目录「量化 → ValuationBand 估值带」，地址 `#/valuation-band`。数据是编出来的 260 周。

## Driving it with kui.mjs

前置：`$KUI doctor` 全 OK。目前没有流程脚本（手走）。图 `[data-testid="valuation-band"]`，绘图区 `[data-slot="valuation-plot"]`。

- **分位标注。** `[data-slot="valuation-ptick"]` 三个，文字是「20 分位 11.3 倍」「50 分位 13.7 倍」「80 分位 15.6 倍」。
- **悬停。** 鼠标移到绘图区 60% 处：窗里是日期（2024-11-18）、「市盈率 16.3 倍」「历史分位 P91」。
- **断线。** `[data-testid="valuation-band-pb"] [data-slot="valuation-line"]` 的 `d` 里有 2 个 `M`。
- **证据。** 每步截图；像素由 `browser/cn-batch4.browser.test.tsx` 守着。

## Gotchas

- 分位按整段传入的历史算（含当前点），换窗口要换传入的数据，不是图上的开关。
