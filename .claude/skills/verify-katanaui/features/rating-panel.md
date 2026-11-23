# RatingPanel 技术评级三联

摆动指标、汇总、均线三个评级仪表并排，汇总居中放大，每个仪表下写卖出 / 中性 / 买入的个数。上方一排周期按钮，换周期三个仪表一起换数。指针停在一个仪表上，或键盘 Tab 到它，名字那一行换成读数（带正负号两位小数的分数加档位词）。

## Sub-features

- `rating-timeframe-click` 点周期按钮：它按下（`aria-pressed="true"`），原来那个弹起，三个仪表换成这个周期的分数与个数。
- `rating-timeframe-keyboard` 焦点在周期按钮上按 Tab：焦点到下一个周期（每个周期按钮都是一个 Tab 停靠点），不换周期；按 Enter 才选中。
- `rating-readout-hover` 指针停在一个仪表上：读数淡入，名字淡出；指针移开读数收起。
- `rating-readout-focus` Tab 到一个仪表（`role="meter"`）：它出读数；再 Tab 到下一个，读数跟着走。

## How to get to it (user POV)

- 文档站左侧目录「报价与行情 → RatingPanel 技术评级三联」，地址 `#/rating-panel`。
- 页上两块：「三联」带周期按钮 `1m 5m 15m 1h 4h 1D 1W 1M`，默认 `1D`；「窄栏 280px」没有周期按钮，汇总独占一行。
- 键盘：Tab 依次走过八个周期按钮（方向键不在周期之间走），再 Tab 依次到 `摆动指标`、`汇总`、`均线` 三个仪表。

## Driving it with kui.mjs

前置：`$KUI doctor` 全 OK。只看带周期按钮的那块：`section.getByRole('group', { name: '技术评级', exact: true }).filter({ has: page.getByRole('group', { name: '周期', exact: true }) })`。仪表用 `getByRole('meter', { name: '汇总', exact: true })`，读数是仪表里的 `[data-slot="rating-panel-readout"]`。

- **默认。** 打开页。三个 meter；`1D` 的 `aria-pressed="true"`；`汇总` 带 `is-primary`，`aria-valuetext` 是 `强烈买入, +0.65; 卖出 2, 中性 5, 买入 19`；说明字里的当前周期 `getByTestId('rating-panel-frame')` 是 `1D`。
- **点周期。** `getByRole('button', { name: '1m', exact: true }).click()`。`1m` 按下、`1D` 弹起，当前周期 `1m`，`汇总` 的 `aria-valuetext` 是 `强烈卖出, -0.58; 卖出 18, 中性 5, 买入 3`。
- **键盘切周期。** 焦点留在 `1m` 上按 `Tab`：焦点到 `5m`，`1m` 仍按下；再按 `Enter`：`5m` 按下，当前周期 `5m`，`汇总` 是 `卖出, -0.31; 卖出 14, 中性 6, 买入 6`。
- **悬停出读数。** `meter('汇总').hover()`。读数的 `opacity` 从 0 到 1，文字 `-0.31卖出`（`textContent`，分数与档位之间没有空格）。指针移到说明字 `getByTestId('rating-panel-frame')` 上：`opacity` 回到 0。
- **聚焦出读数。** 焦点仍在 `5m` 上（悬停不挪焦点），按 `Tab` 六下，焦点依次到 `15m`、`1h`、`4h`、`1D`、`1W`、`1M`；再按一下到 `摆动指标`，它的读数 `opacity` 1、文字 `-0.27卖出`。再按 `Tab`：焦点到 `汇总`，汇总的读数出来，摆动指标的收起。
- **证据。** `$KUI drive rating-panel`：七步七张截图，`rating-panel-default.aria.yml` 是三联打开时的 ARIA 快照（group → 周期按钮组 → 三个 meter）。

## Gotchas

- 页上两块都叫「技术评级」：不按带周期按钮收一下，`getByRole('meter', { name: '汇总' })` 会读出两个。
- 周期按钮是 `aria-pressed` 的开关（`role=button`），不是 `radio`：用 `getByRole('button', { pressed: true })` 读当前周期。Tab 过去不换周期，要 Enter 或空格才换。
- 文档站这页的键位表（`gallery/registry.ts` 里 rating-panel 的 `keys`）写「← / → 在周期之间移动焦点」，实际共用的 ToggleGroup 关了 `rovingFocus`：方向键不动，每个周期按钮都是 Tab 停靠点（2026-11-23 在 `3281e887` 上实测）。流程照实际走 Tab；键位表和件哪边对，由件的作者定，定了改这里和流程。
- 读数对读屏是隐藏的（`aria-hidden`），读屏读的是 meter 的 `aria-valuetext`；读数显没显看计算后的 `opacity`，不看 `toBeVisible`（`opacity: 0` 也算 visible）。
- 读数淡入淡出有过渡（`--dur-snappy`）：用 `expect.poll` 等 `opacity` 到 0 或 1，不要动完立刻读。
- 聚焦出读数靠 CSS 的 `:focus-visible`（2026-11-23 把它从读数的选择器里删掉，第 6 步就红）：用键盘 Tab 把焦点送过去，别拿指针点仪表代替。
