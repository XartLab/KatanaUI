# 与 TradingView 对应件的差距（2026-11-15）

用户 2026-11-15：「经济日历啥的 很多得对着 TradingView 的组件来 要不然还是太难用了」。本文是这次审的结果：只列差距，不改（日历除外，见第一节）。
出处都是 TradingView 帮助中心、产品页与嵌入组件文档，2026-11-15 读；只取功能与信息结构，不抄代码。读不到的标「待核对」，不编。
我们不用 TradingView 蓝，不照搬动效；「有 / 没有」只比功能与信息结构。

## 一、日历（#52 已改）

出处（**主会话 2026-11-15 登录态实测**，tradingview.com/economic-calendar/ 与 /earnings-calendar/，深色；帮助中心「Economic Calendar」同日读，分红、IPO 页只读到公开页面文字）：

- 布局自上而下：标题；导航行（今天按钮、选日期、‹ › 按周翻、范围文字「Nov 9 — Nov 15, 2026」，右侧重要性、国家、时区「06:45 (UTC+8)」）；周条（周一到周日七张日卡，每张列出当天 Economic / Earnings / Dividends / IPO 各几条，为 0 的不显示，选中卡加深，今天日期下划线）；类别药丸（选中白底黑字）+ 重要性单开关（按下只看高重要）+ 「All categories」下拉（Bonds、Business、Consumer、GDP、Government、Health、Housing、Labor、Money、Prices、Trade、Taxes，单选）；
- 国家是模态框「Select countries」：搜索、预设「Entire world」「Top 20 economies」、按地区分组两列带旗帜复选、Cancel / Apply；
- 经济表：日期分隔行右侧写 Actual / Forecast / Prior；同一时间同一国家的事件合并（时间与国家只在组首行）；列是时间、国旗 + 国名、重要性小柱、事件名、Actual（加粗）、Forecast、Prior；**Actual 不上涨跌色**；点行无变化；
- 财报表：时段图标（太阳盘前、月亮盘后）+ 时间、徽标、代码胶囊、公司名；列 Estimate EPS、Actual EPS、EPS surprise、Estimate revenue、Actual revenue、Revenue surprise、Market cap；只有两个 surprise 列上色；数值带币种小字；行下有「Earnings materials」「Earnings call」两个小按钮；
- 嵌入组件文档（tradingview.com/widget-docs/widgets/calendars/economic-calendar/）只写了「按事件重要程度与受影响货币设过滤」，`importanceFilter`、`countryFilter` 参数名没读到（我们不做嵌入组件，不影响）。

| TV 有什么 | 我们有没有 |
| --- | --- |
| 导航行、周条、类别药丸 | 已做（选日期用原生日期框，国旗用国家代码徽标） |
| 重要性单开关、12 类下拉、国家模态框（预设、分组、取消 / 应用） | 已做；「前 20 大经济体」预设的国家列表由调用方传（`topRegions`） |
| 同时同国合并、Actual 加粗不上色、缺值「—」 | 已做 |
| 财报：时段图标、意外两列上色、币种小字、财报材料 / 电话会 | 已做；两个按钮是可选的行动作插槽（调用方给链接才显示） |
| 点行无展开 | 我们保留详情展开（说明、来源、历史值小图、下次发布），算比 TV 好的部分 |
| 财报 / 分红按列头排序 | 已做（每天内排序）；TV 的排序行为没实测，待核对 |
| 分红、IPO 的列与筛选 | 照公开页面文字做，没登录实测，待核对 |

## 二、其他件对 TradingView 的差距（只列）

### NewsFeed（对 TV News Flow）

出处：帮助中心「News Flow's filters overview」（43000732560）、「What is the News Flow?」（43000728828）。

| TV 有什么 | 我们有没有 | 建议 |
| --- | --- | --- |
| 七个可组合过滤：Watchlist、Instrument、Market、Corporate activity、Economics、Country、Provider；除 Watchlist 外都可多选；可「重置」（清值留着过滤）与「移除」（从面板拿掉） | 频道分段、来源多选芯片、关键词搜索、暂停 | 把过滤做成「可增删的过滤面板」：品种、市场、国家、事件类型、来源各一个多选，带重置与移除。最大的结构差距。 |
| 无过滤时显示全部可用新闻 | 同 | 无。 |
| 关键词、优先级过滤 | 我们有关键词；TV 帮助页没写这两项（待核对） | 保留。 |
| 新闻实时提醒（blog：real-time news alerts） | 没有 | 属于应用层告警，件不管；`NewsFeed` 暴露「新到一条」回调即可。 |

### MarketHeatmap（对 TV 热图）

出处：帮助中心「TradingView heatmaps: from global trends to details」（43000766446）。

| TV 有什么 | 我们有没有 | 建议 |
| --- | --- | --- |
| Size by（市值、成交量、成交额、等大）与 Color by（涨跌、表现、盘前盘后、相对成交量、波动、跳空）；色板 Classic / 色盲友好 / 单色 | 大小、颜色指标与色板由调用方传，三者都有 | 已覆盖；指标清单由调用方给，文档页示例补上相对成交量与波动。 |
| 分组（股票按行业、ETF 按资产类别、币不分组）；四种视图（分组或平铺 × 等大或按大小） | 分组与平铺已做 | 补「等大」视图的演示。 |
| 点组名放大；悬停出详情；点格子进品种页 | 前两项已做；点格子走 `RowActions` 菜单 | 无。 |
| 切换 LOGO、标题（无 / 代码 / 全名）、格内数值（价格、成交量、表现、无） | 没有 | 加三个显示开关（工具条里的「显示」菜单）。 |
| 指数 / 国家过滤（股票）、币种过滤（币） | 由调用方换数据 | 不进件。 |
| 全屏、图例、分享（下载 / 复制图片、复制链接） | 图例有；全屏、分享没有 | 全屏交给 `PanelFrame`；导出图片是应用层。 |

### TechnicalRating（对 TV 技术评级 / Technicals 页签）

出处：博客「Meet the new technicals tab! The gauges never looked so pretty」、帮助中心「Technical Ratings」（43000614331，只读到搜索摘要，正文没读，待核对）。

| TV 有什么 | 我们有没有 | 建议 |
| --- | --- | --- |
| 三个仪表：振荡指标、均线、总评；每个写参与指标数 | 已做 | 无。 |
| 周期切换 | 已做 | 无。 |
| 指标明细表（名称、值、动作） | 已做 | 无。 |
| 评级只是指标读数的汇总、不构成建议的提示 | 免责一句由调用方传 | 件内留位置，已做。 |
| 评级随周期变化的历史 / 屏幕上的评级列 | 没有 | 评级列属于 DataGrid（Screener 的 Technical Rating 列），见下。 |

### DataGrid（对 TV Screener）

出处：帮助中心「Quick and easy guide to TradingView screeners」（43000718885）。

| TV 有什么 | 我们有没有 | 建议 |
| --- | --- | --- |
| 顶部过滤面板：按类别（证券信息、市场数据、技术面）加过滤，每个过滤有条件，可手动设阈值，可重置与移除 | **没有**：DataGrid 只有排序、列宽、顺序、显隐 | 最大的差距。做一个独立的 `FilterBar`（可增删的条件芯片：字段 + 比较 + 值），DataGrid 不内置过滤，调用方过滤数据。 |
| 现成的列集合（表现、风险、票息…）与自建；右键列头设置 | 列显隐与顺序有，没有「列集合」切换 | 加列集合页签（`columnSets`），一个集合就是一份列显隐与顺序。 |
| 保存、复制、重命名、导出 CSV 的筛选方案（Screens 菜单） | 没有 | 方案是应用状态；件只暴露「当前过滤与列」的可序列化值。 |
| 图表视图（一格一图） | 没有 | 留给 `SmallMultiples`，不放进 DataGrid。 |
| 自动刷新间隔（10 秒 / 1 分钟 / 不刷） | 没有 | 属于数据源，调用方管。 |
| 把结果发到自选 | 行动作 | `RowActions` 已能做。 |

### MetricCard（对 TV 基本面卡）

出处：没有读到 TradingView 基本面卡（Financials / Key stats）的帮助页或产品页正文，本节**待核对**，不编。我们已有的结构取自 uiarc 的 Metric explorer，不是 TV。

| TV 有什么 | 我们有没有 | 建议 |
| --- | --- | --- |
| 待核对 | 标题、大号值、较前日 / 周 / 月 / 年变化、走势线与区间、阶段带、来源 | 下一步先读 TV 品种页的 Key stats 与 Financials 的页面再定。 |

## 最重要的 5 条差距

1. **DataGrid 没有过滤条**（Screener 的核心）：可增删的条件芯片 + 列集合页签。
2. **NewsFeed 的过滤结构**：TV 是七个可组合、可重置 / 可移除的多选过滤，我们只有频道、来源、关键词。
3. （原第 3 条日历类别过滤与意外列已在 #52 做完，已删。）
4. **MarketHeatmap 缺显示开关**：LOGO、标题（无 / 代码 / 全名）、格内数值（价格 / 成交量 / 表现 / 无）。
5. （原第 5 条日历列头排序已在 #52 做完。）
