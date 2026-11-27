# TradingView 小组件四件

对照 TradingView 小组件补的四个报价件（#154），各占文档站一页：SymbolInfo 品种报价头（代码、名称、状态灯、最新价与涨跌、区间条），SymbolOverview 多品种走势卡（品种页签、走势、读数、区间按钮），CrossRates 交叉汇率矩阵（汇率与热力两种、点格或按 Enter 回调这一对），CompanyProfile 公司简介卡（几项事实、可展开的正文、空态）。同一批里的 SeasonalChart 季节性图不在这份里。

## Sub-features

- `syminfo-quote` 报价头：代码 `AAA`、`Alpha Devices Incorporated · NASDAQ`、状态灯「Market open」、价 `212.40`、涨跌额 `-1.62` 与涨跌幅 `-0.76%`、`Delayed 15 min`。
- `syminfo-ranges` 两条区间 `meter`（`Day's range`、`52 week range`），`aria-valuenow` 是最新价 212.4；第二张没给区间就没有 `meter`，涨时写 `+12.40`。
- `symov-tabs` 点品种页签：选中换过去，图换成它的。
- `symov-readout` 聚焦走势按 Home / → / Shift+→ / End：滑块的 `aria-valuenow` 跟着走（0 / 1 / 4 / 119），出 LCD 读数框；Esc 清掉。
- `symov-range` 点区间按钮：它按下，原来那个弹起。
- `symov-percent` percent 卡：三只叠成三条线、选中的加粗、页签带色块；最后一刻的读数与页签上的涨跌幅一致。
- `xrates-grid` 6 × 6 格，对角线不写数；点一格回调这一对，它的行头列头加亮。
- `xrates-keyboard` 方向键在格子间走，Enter 回调，对角线上 Enter 不回调，Ctrl+End 到最后一格。
- `xrates-heatmap` 热力卡只写涨跌幅、按涨跌上色；没有货币时写 `Not connected`。
- `profile-expand` 简介：四项事实，正文折成 3 行，「Show more」展开、「Show less」收回，`aria-expanded` 跟着变。
- `profile-empty` 没有数据：只有公司名和 `Not connected`，没有按钮。

## How to get to it (user POV)

- 文档站左侧目录「报价与行情」一组：`SymbolInfo 品种报价头`（`#/symbol-info`）、`SymbolOverview 多品种走势卡`（`#/symbol-overview`）、`CrossRates 交叉汇率矩阵`（`#/cross-rates`）、`CompanyProfile 公司简介卡`（`#/company-profile`）。
- 每页预览区两到三张：报价头「报价头」「休市、没有区间」；走势卡「price」「percent」；汇率「rates」「heatmap」「未连接」；简介「有数据」「未连接」。
- 键盘：Tab 到走势图（`slider`）或汇率格子（`grid` 里只有一格在 Tab 序里），再按方向键。

## Driving it with kui.mjs

前置：`$KUI doctor` 全 OK。流程从 `#/symbol-info` 开始，中途点目录 `a.k-sidenav-link[href="#/<页 id>"]` 换到另外三页。

- **报价头。** `section.getByRole('region', { name: 'Alpha Devices quote' })`：含 `AAA`、`Alpha Devices Incorporated · NASDAQ`；`img「Market open」` 可见；`[data-slot="symbol-info-price"]` 写 `212.40`，`[data-slot="symbol-info-change"]` 写 `-1.62`；`meter「Day's range」` 的 `aria-valuenow="212.4"`、`aria-valuemin="209.8"`、`aria-valuemax="215.35"`，`meter「52 week range」` 的 `aria-valuenow="212.4"`。
- **第二张报价头。** `region「Bravo Semiconductor quote」`：`img「Market closed」`，价 `1,044.10`，涨跌额 `+12.40`，含 `+1.20%`，`meter` 0 个。
- **换页签。** 点目录 `#/symbol-overview`；第一张卡 `[data-slot="symbol-overview"]` 里 `tablist「Symbols」` 默认选中 `IDXA`；点 `tab` 名字以 `IDXB ` 开头的那个：它 `aria-selected="true"`，`tabpanel` 的名字以 `IDXB ` 开头；`slider「Price chart」` 的 `aria-valuenow="119"`，`aria-valuetext` 是 `05-01  IDXB 18,839.15`。
- **键盘读数。** `slider.focus()`，依次按 `Home`、`ArrowRight`、`Shift+ArrowRight`、`End`：`aria-valuenow` 是 `0`、`1`、`4`、`119`，每次 `[data-slot="lcd-tooltip"]` 可见；`End` 时 `aria-valuetext` 以 `05-01` 开头、`Home` 时以 `01-02` 开头；`Escape`：读数框消失，`aria-valuenow` 回到 `119`。
- **区间。** `group「Date range」` 里 `3M` 按下；点 `1Y`：`1Y` 的 `aria-pressed="true"`、`3M` 的是 `false`。
- **percent 卡。** 第二张卡：`[data-slot="symbol-overview-line"]` 3 条、其中 `.is-selected` 1 条，色块 3 个；`slider「Comparison chart」` 聚焦按 `End`，`aria-valuetext` 里 `IDXA`、`IDXB`、`IDXC` 三只的涨跌幅与各自页签上写的一样（`+0.10%`、`+3.40%`、`-4.41%`）。
- **点汇率格。** 点目录 `#/cross-rates`；`grid「Cross rates」` 里 `[data-slot="cross-rate"]` 36 格，`.is-diagonal` 6 格且没有字；`gridcell「EUR/USD」` 写 `1.0830 +0.18%`，`gridcell「USD/JPY」` 写 `155.28 +0.42%`；点 `EUR/USD`：`[data-gallery-picked]` 写 `点的是：EUR/USD`，`rowheader「EUR」` 与 `columnheader「USD」` 带 `is-hot`。
- **汇率键盘。** 焦点在 `EUR/USD`：按 `ArrowRight` 焦点到 `data-pair="EUR/EUR"`（对角线），按 `Enter` 回显不变；再 `ArrowRight` 到 `EUR/JPY`，`Enter` 回显 `EUR/JPY`；`ArrowDown` 两次到 `GBP/JPY`，`Enter` 回显 `GBP/JPY`；`Control+End` 焦点到 `AUD/AUD`。
- **热力与空态。** `grid「Currency heatmap」` 里 `AUD/JPY` 只写 `+1.08%`、`JPY/AUD` 只写 `-1.07%`，两格的计算底色不同；页上有 `Not connected`。
- **简介展开。** 点目录 `#/company-profile`；`region「Alpha Devices Incorporated」`：`heading` 3 级是公司名，`term` 依次 `Sector`、`Industry`、`Employees (FY)`、`Headquarters`；`button「Show more」` 的 `aria-expanded="false"`，记下正文 `[data-slot="company-profile-text"]` 的高；点它：按钮变 `Show less`、`aria-expanded="true"`，正文变高；再点：回到 `Show more`，高度回到原来的。
- **简介空态。** `region「Bravo Semiconductor」`：`[data-slot="company-profile-empty"]` 写 `Not connected`，没有 `button`、没有 `term`。
- **证据。** `$KUI drive tv-widgets`：十一步十一张截图，`symbol-info.aria.yml`、`company-profile.aria.yml` 是报价头与简介卡的 ARIA 快照。

## Gotchas

- 走势卡与汇率卡一页各有两三张，先收到具体那张：走势卡用 `[data-slot="symbol-overview"]` 的 `nth(0)` / `nth(1)`，汇率卡用 `grid` 的名字（`Cross rates` / `Currency heatmap`）。两张走势卡的 `tablist` 都叫 `Symbols`、区间组都叫 `Date range`。
- 页签的可读名是「代码 名称 价 涨跌幅」连在一起（`IDXB Bravo Tech 100 18,839.15 +3.40%`），用 `/^IDXB /` 这样的前缀正则找，不要写全名。
- 汇率格子的表头角上那一格在 ARIA 里也是 `gridcell`：数格子用 `[data-slot="cross-rate"]`，别数 `getByRole('gridcell')`。对角线格没有可读名，焦点在它上面时用 `data-pair` 读。
- 走势卡的区间按钮只回调、不换数据（演示里没接），按下以后图不会变；验的是按钮状态，不是数据。
- 「Show more」只在正文真被截断时才出（件量 `scrollHeight`，宽度变了重量）：换了视口宽度，折叠后的行数与按钮出不出都可能变。
- SeasonalChart（`#/seasonal-chart`）同一批合进来，但不在这份地图里，另由 #169 补。
