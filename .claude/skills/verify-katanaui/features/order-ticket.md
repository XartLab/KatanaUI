# OrderTicket 下单面板

永续合约的下单面板：买（开多）卖（开空）两栏并排，各有自己的价格、成本、张数和下单钮。用户填成本或改杠杆，面板当场算出张数、占用、可开；填错（超过可用、止损放在盈利一侧）时这一栏报错、下单钮变灰；能下的时候点钮，调用方收到一张单。文档站的演示把收到的单回显在面板下面。

## Sub-features

- `ticket-calc` 按成本、杠杆、手续费算张数与占用，两栏同时更新。
- `ticket-leverage` 改杠杆：成本框不动，张数跟着变。
- `ticket-issue` 成本超过可用余额：这一栏报错、下单钮禁用，另一栏不受影响。
- `ticket-exits` 勾「TP / SL」、选出场模板：按这一栏的方向填止盈止损（空头止盈在下、止损在上）。
- `ticket-risk` 「Size by → Risk」：按风险额和止损距离算张数；止损在盈利一侧时报错。
- `ticket-submit` 点下单钮：回显 `open buy|sell <张数> @ <价>`。
- `ticket-close` 切到「Close」：钮变成 `Close short` / `Close long`，不显示保证金，下的是只减仓的单。

## How to get to it (user POV)

- 文档站左侧目录「积木 → OrderTicket 下单面板」，地址 `#/order-ticket`。
- 演示数据：BTC-USDT-SWAP，一张 0.01 BTC，最新价 60000，可用 250 USDT，默认 100 倍、成本 10 USDT，开平手续费各 0.05%。

## Driving it with kui.mjs

前置：`$KUI doctor` 全 OK。面板 `section.locator('[data-slot="order-ticket"]').first()`，两栏 `[data-slot="ticket-form"][data-side="buy|sell"]`，栏里的格子都是 `[data-slot="ticket-*"]`，回显是 `section.locator('output').first()`。

- **默认算数。** 打开页。两栏并排；买栏 `ticket-size` 写 `1.51 Cont ≈ 0.0151 BTC`，`ticket-cost` 写 `9.97 USDT`，`ticket-max` 写 `37.87 Cont`；钮写 `Open long` / `Open short`。
- **改杠杆。** `ticket-leverage` 填 `10`。买栏成本框仍是 `10`，两栏张数都变成 `0.16 Cont`；填回 `100` 张数回到 `1.51 Cont`。
- **超可用。** 买栏 `ticket-amount` 填 `300`。买栏 `ticket-issue` 写 `Costs more than the available balance`，买栏下单钮禁用，卖栏下单钮仍可点。
- **开多。** 买栏填回 `10`，点 `ticket-submit`。回显 `open buy 1.51 @ 60000`。
- **止盈止损模板。** 卖栏点 checkbox，`getByRole('combobox', { name: 'Exit template' })` 选 `Scalp · TP 1% / SL 0.5%`。`ticket-take-profit` 是 `59400.0`，`ticket-stop-loss` 是 `60300.0`。
- **按风险算。** 卖栏 `Size by` 选 `Risk`，成本框填 `50`，止损填 `59000`：`ticket-issue` 写 `The stop loss is on the profit side of the entry`。止损改回 `60300`：张数 `13.88 Cont`；点下单，回显 `open sell 13.88 @ 60000`。
- **平仓。** 点 `getByRole('button', { name: 'Close', exact: true })`。买栏钮写 `Close short`，没有 `ticket-margin`；成本框填 `2` 下单，回显 `close buy 2 @ 60000`。
- **证据。** `$KUI drive order-ticket`：七步七张截图，`order-ticket-default.aria.yml` 是默认状态整个面板的 ARIA 快照。

## Gotchas

- 下单面板只把单交给调用方（`onSubmit`），不连任何交易所；文档站里「下单」唯一能观察的结果就是面板下面的回显，回显没出来就算没下成。
- 下拉框（`Exit template`、`Size by`）的选项渲染在面板外面的弹层里：选项用 `page.getByRole('option', …)` 找，不要在 `section` 里找。
- 页上的文案是英文（演示传的 `labels`），组件包里不带语言；按名字找控件用英文名。
- 张数按 `lotSize` 向下取整（0.165 → 0.16），断言写到两位小数，不要用自己算的浮点数比。
- 「Close」页签切过去以后不会自己切回来；同一个上下文里接着验开仓，先点「Open」。
