# StrategyLauncher 策略入口

一列策略与工具的入口卡，顶上一条可关的风险提示。每张卡是图标、名字、可选「新」角标、标签串、右箭头；点卡（或聚焦后按 Enter / 空格）告诉宿主打开哪一个，件自己不跳转。

## Sub-features

- `launcher-open` 点卡、Enter 或空格：回调 onOpen(id)，演示页上写「打开：<id>」。
- `launcher-dismiss` 点风险提示右上角的关闭钮：提示条消失，卡不动。
- `launcher-keyboard` Tab 先到关闭钮，再逐张走卡，焦点环可见。

## How to get to it (user POV)

- 文档站左侧目录「积木」一组：`StrategyLauncher 策略入口`，地址 `#/strategy-launcher`。
- 演示四张卡：网格策略、定投加仓（带「新」）、信号策略、运行中心；页脚一行写最近一次打开的 id。

## Driving it with kui.mjs

前置：`$KUI doctor` 全 OK。卡是 `section` 里 `list` 下的 `button`，提示条是 `getByRole('note')`。

- **默认。** 打开页。提示条可见，写「策略会按设定自动下单…」；四张卡；只有「定投加仓」带角标「新」；页脚「点一张卡」。
- **点卡。** 点「网格策略」那张：页脚变「打开：grid」。
- **键盘。** 焦点放在「关闭风险提示」上，Tab 两次到第二张卡，Enter：「打开：dca」；Tab 到第三张，空格：「打开：signal」。
- **关提示。** 点「关闭风险提示」：`getByRole('note')` 数量为 0，四张卡还在。
- **证据。** `$KUI drive strategy-launcher`：每步一张截图，`strategy-launcher-default.aria.yml` 是默认状态的 ARIA 快照。

## Gotchas

- 关闭钮只关本次：刷新页就回来（宿主要不要记住由它自己定）。
- 卡的名字是「名字 + 标签」连起来的整串，按名字找用 `{ hasText: '网格策略' }`，不要 `exact: true`。
