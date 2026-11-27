# DerivativesBoard 交易数据看板与加密异动

永续合约的「交易数据」：六张卡的网格（持仓量及成交量、资金费率、主动买卖量、多空账户比、精英多空趋向、合约基差），每张有标题、信息钮和自己的周期按钮；悬停或 ← → 扫读出竖线和悬停窗；没有数据的卡写「暂无数据」。同一个 PR（XartLab/KatanaUI#245 模块 1）里 MoveFeed 多了「只看当前品种」勾选和「5 分钟涨幅 / 跌幅」类型。

## Sub-features

- `board-six` 页上第一块是六张卡，次序同 OKX，每张一个标题（h3）、一个信息钮、一组周期按钮。
- `period-pick` 点一张卡的周期按钮：只有这张卡的选中项换，页上「周期回调」一行写「卡名 → 周期」，别的卡不动。
- `funding-periods` 资金费率卡的周期只有「近 7 天 / 近 14 天」；演示里它受控在 14 天。
- `scrub` 鼠标移到图上，或聚焦图后按 ← →：出一条竖线和悬停窗，窗里是时间与这一格各序列的值；Esc 清掉；Home / End 到头尾。
- `info-tip` 悬停或聚焦信息钮：出这张卡的说明。
- `empty-card` 第二块里没给数据、给了空序列、全是缺失值的卡，各写「暂无数据」，其余卡照画。
- `single-card` 第三块是单独的一张多空账户比卡（周期默认 1 小时）。
- `move-only-current` 异动页（`#/move-feed`）加密例子：顶栏有「当前币对」勾选；勾上只列当前品种的行，总条数跟着变；切「当前品种」按钮，筛选对象跟着换。
- `move-types` 同一例子里类型胶囊写「5 分钟涨幅」「5 分钟跌幅」「15 分钟涨幅」，涨的读涨色、跌的读跌色。

## How to get to it (user POV)

- 文档站左侧目录「积木 → DerivativesBoard 交易数据看板」，地址 `#/derivatives-board`。
- 异动流：左侧目录「MoveFeed 异动时间流」，地址 `#/move-feed`，滚到第二块（`[data-testid="move-feed-crypto"]`）。
- 演示数据是编的闭式公式（从 2026-11-24 00:00 UTC 起每小时一根，24 根；资金费率 21 次结算），时间轴默认写 UTC 的 `MM-DD HH:mm`。

## Driving it with kui.mjs

前置：`$KUI doctor` 全 OK。看板 `[data-testid="derivatives-board"]`，卡 `[data-slot="derivatives-card"][data-kind="<kind>"]`，周期组 `[data-slot="derivatives-periods"]`，图 `[data-slot="derivatives-chart"] [role="group"]`。目前没有流程脚本（手走，还没有 `drive derivatives-board`）。

- **六张卡。** 打开页。看板里 `[data-slot="derivatives-card"]` 有 6 张，`data-kind` 依次是 `openInterestVolume`、`fundingRate`、`takerVolume`、`longShortRatio`、`topTraderRatio`、`basis`；每张有一个名为「…的说明」的按钮。
- **切周期。** 在持仓量及成交量卡点「1 小时」。该卡的「1 小时」`aria-pressed="true"`、「5 分钟」为 `false`；`[data-testid="derivatives-last"]` 写「周期回调：持仓量及成交量 → 1 小时」；别的卡的选中项没变。
- **资金费率周期。** 资金费率卡只有两个按钮「近 7 天」「近 14 天」，「近 14 天」是按下的；点「近 7 天」，回调行写「资金费率 → 近 7 天」。
- **扫读。** 在持仓量及成交量卡的图上 `hover`。出现 `[data-slot="derivatives-cross"]` 和 `[data-slot="lcd-tooltip"]`，窗里有「持仓量」「成交量」两行；移开后都消失。聚焦图（Tab）按 `ArrowRight`：落在最新一格，再按 `Home` 落到第一格，按 `Escape` 清掉。
- **信息提示。** 聚焦持仓量及成交量卡的信息钮：出现提示，文字以「持仓量是尚未平仓的合约总量」开头。
- **空态。** `[data-testid="derivatives-sparse"]` 里三张卡：持仓量及成交量（空序列）和合约基差（全是缺失值）各有 `[data-slot="derivatives-empty"]`，写「暂无数据」；资金费率那张有图。
- **单卡。** `[data-testid="derivatives-single"]` 里一张卡，「1 小时」是按下的。
- **只看当前品种。** 在 `#/move-feed` 的加密例子里：默认有 7 行，勾「当前币对」后只剩 BTC-USDT 的 3 行，`[data-slot="move-summary"]` 写「共 3 条」；点「ETH-USDT-SWAP」按钮后变成 ETH 的 2 行、「共 2 条」；取消勾选回到 7 行。
- **类型文字。** 同一例子里行的类型胶囊有「5 分钟涨幅」「5 分钟跌幅」「15 分钟涨幅」。
- **证据。** 手走时每步截图，勾选与扫读两步还要贴 ARIA 快照；组件级的像素由 `browser/derivatives.browser.test.tsx`（pixelgate 基线）守着。

## Gotchas

- 件不取数：切周期只发回调，图上的数据不会变，别把「图没变」当成没切成，看按钮的 `aria-pressed` 和回调行。
- 时间轴默认按 UTC 写；调用方用 `formatTime` 换时区，演示没换。
- 图是 `role="group"`，不是 `img`：悬停窗在它里面，读屏名写「卡名，最新 …」。
- 扫读按 ← → 之前要先聚焦图（Tab，或点一下图再移开鼠标）；鼠标在图上时悬停优先。
- 「当前币对」勾选只在传了 currentSymbol 时才有；A 股的 MoveFeed 例子没有它。
