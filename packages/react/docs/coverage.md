<!-- SPDX-License-Identifier: MIT -->
<!-- 生成文件：pnpm ui:coverage。手写的是 coverage-map.json，不要改这份。 -->

# 设计稿覆盖表

设计稿存档 `design/katana-console/project/components/` 的 105 张组件卡，每张落到了哪里、做没做（#1870）。
归属：基础件（`primitives/`）、自有件（`katana/`）、量化（`quant/`）、积木（`blocks/`，#1869）、面板（KATANAview 应用的 `src/panels` 与外壳）。
状态：已做（卡的内容在包里或应用里做出来了，落点写在「落在哪里」）、部分（做了一块，缺什么写在备注）、没做。
「计划」是已经定了名字、还没有的落点（积木层的 DataGrid、EmptyState、Toolbar，#1869），落地后挪进现有落点。

## 汇总

| 归属 | 已做 | 部分 | 没做 | 总数 | 已做 / 总数 |
| --- | --- | --- | --- | --- | --- |
| 基础件 | 4 | 0 | 0 | 4 | 4 / 4 |
| 自有件 | 4 | 0 | 0 | 4 | 4 / 4 |
| 量化 | 7 | 0 | 0 | 7 | 7 / 7 |
| 积木 | 6 | 0 | 0 | 6 | 6 / 6 |
| 面板 | 20 | 15 | 49 | 84 | 20 / 84 |
| 合计 | | | | 105 | 41 / 105 |

## 每张卡

| 卡 | 分组 | 归属 | 落在哪里 | 状态 | 备注 |
| --- | --- | --- | --- | --- | --- |
| AccountMirror | 组合 | 面板 | — | 没做 | ATAS Following Manager 的对应，复制交易面板还没有这块界面 |
| AccountRail | 组合 | 面板 | — | 没做 | 账户轨，账户面板是表，没有卡片轨与选中合计 |
| AgentsStatus | 运行中心 | 面板 | `src/shell/AgentsPane.tsx` | 部分 | 有代理列表，没有可用灯、延迟、用量、费用与 MCP 一栏 |
| AlertCenter | 发现 | 面板 | `src/panels/alerts` | 已做 |  |
| AliceSessions | 运行中心 | 面板 | `src/panels/alice-session` | 已做 |  |
| AlphaLedger | 决策 | 面板 | — | 没做 | 研究层，还没有对应面板 |
| BondCalc | 固收 | 面板 | — | 没做 | 固收，还没有对应面板 |
| BreakWorkbench | 对账 | 面板 | — | 没做 | 对账，还没有对应面板 |
| BrinsonAttribution | 资产管理 | 面板 | — | 没做 | 资产管理，还没有对应面板 |
| Calendar | 发现 | 面板 | `src/panels/journal/TradingCalendar.tsx`、`CalendarHeatmap` | 部分 | 交易日历有；发散热力底色在组件库有了（CalendarHeatmap，一年的日盈亏），还没接进交易日历，换手模式没有 |
| CashLedger | 资产管理 | 面板 | — | 没做 | 资产管理，还没有对应面板 |
| ChartTrader | 交易 | 面板 | `src/panels/chart/ChartTradeBar.tsx`、`src/panels/chart/TradeOverlay.tsx` | 部分 | 图上看单与下单有，拖动改价与止盈止损线没有 |
| ClusterSearch | 订单流 | 面板 | — | 没做 | 足迹扫描器，还没有对应面板 |
| CommandLine | 工作台 | 积木 | `Command`、`src/shell/QuickSearch.tsx` | 已做 | 命令面板用 Command，底栏常驻命令行（GO Bar）不是这一张的范围 |
| ConsensusBlock | 交易 | 量化 | `ConsensusBlock` | 已做 |  |
| Controls | 基元 | 基础件 | `Button`、`Input`、`Select`、`Slider`、`Checkbox`、`Switch`、`Tabs`、`ToggleGroup` | 已做 |  |
| CorporateActions | 资产管理 | 面板 | — | 没做 | 资产管理，还没有对应面板 |
| Cover | — | 自有件 | `packages/react/design-system/components/Cover` | 已做 | 封面页，随设计系统带出 |
| DOMHeatmap | 订单流 | 面板 | `src/panels/heatmap` | 部分 | 有热力图面板，盘口历史（时间 × 价格）一层没有 |
| DOMLadder | 订单流 | 面板 | `src/panels/dom` | 已做 |  |
| DataGrid | 数据 | 积木 | `DataGrid` | 已做 | #1869 把 DataTable 抽成积木 DataGrid；应用里 panels/kit/DataTable.tsx 是薄适配层 |
| DataQuality | 研究 | 面板 | — | 没做 | 研究层，还没有对应面板 |
| DataSources | 运行中心 | 面板 | `src/shell/ConnectionList.tsx` | 部分 | 连接列表有，延迟 LCD 与今日拉取量没有；组件库已有 UptimeBars 逐格可用条（#1918）可补逐日可用，面板里还没接 |
| DatasetCatalog | 研究 | 面板 | `src/shell/DatasetSourcesPane.tsx`、`TreeView` | 部分 | 数据集来源有，字段数、频率、覆盖区间没有；目录树的件（TreeView）已有，面板还没有接它 |
| DecisionJournal | 决策 | 面板 | — | 没做 | 决策层，还没有对应面板 |
| DecisionQueue | 决策 | 面板 | — | 没做 | 决策层，还没有对应面板 |
| DeploymentBoard | 研究 | 面板 | — | 没做 | 研究层，还没有对应面板 |
| DotMatrix | 点阵 | 自有件 | `DotMatrix` | 已做 |  |
| DrawingToolbar | 图表 | 面板 | `src/panels/chart/SelectedToolbar.tsx`、`src/panels/chart/FavoritesToolbar.tsx` | 已做 |  |
| Entitlements | 运行中心 | 面板 | — | 没做 | 许可与权限，还没有对应面板 |
| EquityCurve | 图表 | 量化 | `EquityCurve` | 已做 | quant 层的 EquityCurve（时间轴、基准线、镜像回撤、对数轴、概览刷选条、表格视图）；应用的回放概览页已改用它（#1931） |
| EventStudy | 研究 | 面板 | — | 没做 | 研究层，还没有对应面板 |
| EventTimeline | 发现 | 积木 | `EventTimeline` | 已做 | 件（按显示时区分天、新的在前）已做，发现区的面板还没有接它（#1919 不动 src/） |
| ExitStrategy | 交易 | 面板 | `src/panels/order-ticket` | 部分 | 下单面板里有止盈止损，自动退出两种模式没有 |
| ExposureTimeline | 盈亏 | 面板 | — | 没做 | 盈亏，还没有对应面板 |
| FactorDecay | 研究 | 面板 | — | 没做 | 研究层，还没有对应面板 |
| FactorExposure | 资产管理 | 面板 | — | 没做 | 资产管理，还没有对应面板 |
| FactorIC | 图表 | 面板 | — | 没做 | 研究层，还没有对应面板 |
| FactorLibrary | 研究 | 面板 | — | 没做 | 研究层，还没有对应面板 |
| FillLog | 组合 | 面板 | `src/panels/trades` | 已做 |  |
| FlowGauges | 订单流 | 量化 | `FlowGauges` | 已做 |  |
| Footprint | 图表 | 面板 | `src/panels/chart` | 部分 | 图表有，足迹层没有 |
| Fundamentals | 资产管理 | 面板 | — | 没做 | 资产管理，还没有对应面板 |
| GreeksBoard | 衍生品 | 面板 | — | 没做 | 衍生品，还没有对应面板 |
| Heatmap | 图表 | 量化 | `src/panels/heatmap` | 已做 | 应用里有，还没抽进 quant 层 |
| HypothesisLedger | 研究 | 面板 | — | 没做 | 研究层，还没有对应面板 |
| IndicatorPanel | 图表 | 面板 | `src/panels/chart/IndicatorDialog.tsx` | 已做 |  |
| IntradayPnL | 盈亏 | 面板 | `SeriesExplorer`、`HorizonChart` | 部分 | 盈亏探索（区间、KPI、堆叠柱加线、明细）与多品种日内窄带在组件库有了；面板与数据接线还没有 |
| LCDReadout | 工作台 | 自有件 | `Lcd` | 已做 |  |
| LiveDivergence | 研究 | 面板 | — | 没做 | 研究层，还没有对应面板 |
| LossLimits | 盈亏 | 面板 | `src/panels/loss-limits` | 已做 |  |
| MBOTrackers | 订单流 | 面板 | — | 没做 | 逐单订单簿，还没有对应面板 |
| Meter | 工作台 | 量化 | `Meter` | 已做 |  |
| ModelCard | 研究 | 面板 | — | 没做 | 研究层，还没有对应面板 |
| NewsFeed | 发现 | 面板 | `NewsFeed` | 已做 | 件已做（列表与卡片、频道、来源、搜索、暂停、新消息计数）；应用里接真实新闻源另开票 |
| Notes | 工具 | 面板 | — | 没做 | Markdown 笔记，还没有对应面板 |
| OptionsChain | 衍生品 | 面板 | — | 没做 | 衍生品，还没有对应面板 |
| OptionsFlow | 衍生品 | 面板 | — | 没做 | 衍生品，还没有对应面板 |
| OrderBasket | 资产管理 | 面板 | — | 没做 | 资产管理，还没有对应面板 |
| OrderBlotter | 组合 | 面板 | `src/panels/orders` | 已做 |  |
| OrderTicket | 交易 | 面板 | `src/panels/order-ticket` | 已做 |  |
| Overlays | 基元 | 基础件 | `Dialog`、`Sheet`、`Popover`、`Tooltip`、`HoverCard`、`DropdownMenu`、`ContextMenu`、`Toast` | 已做 |  |
| PanelFrame | 工作台 | 积木 | `PanelFrame`、`EmptyState`、`Toolbar`、`src/workspace/PaneFrame.tsx` | 已做 | #1901：PanelFrame 是壳（标题栏、联动色点、可折叠、焦点括号、状态内容区）；应用的 PaneFrame 是挂旧类名的薄适配层 |
| ParamScatter | 研究 | 面板 | — | 没做 | 研究层，还没有对应面板 |
| PerformanceReport | 资产管理 | 面板 | — | 没做 | 资产管理，还没有对应面板 |
| PnLAttribution | 组合 | 面板 | `AttributionBars` | 部分 | 零轴条形归因（正负分组、折「其他」、费用·税在底）组件库有了；面板接线与维度切换的数据还没有 |
| PnLLedger | 盈亏 | 面板 | `SeriesExplorer` | 部分 | 按期明细表与堆叠柱在 SeriesExplorer 里有了；台账数据接线与面板还没有 |
| PositionBook | 组合 | 面板 | `src/panels/positions` | 已做 |  |
| PositionHistory | 盈亏 | 面板 | — | 没做 | 盈亏，还没有对应面板 |
| Preferences | 工作台 | 面板 | `src/shell/AppSettingsDialog.tsx` | 已做 |  |
| PriceChart | 图表 | 面板 | `src/panels/chart` | 已做 |  |
| QuantileLayers | 图表 | 面板 | — | 没做 | 研究层，还没有对应面板；组件库已有 Ridgeline 山脊图（#1918）可画各层收益分布，面板里还没接 |
| RebalanceDesk | 资产管理 | 面板 | `src/panels/rebalance` | 部分 | 有再平衡面板，目标组合与当前组合的差额表没有对齐设计稿；组件库已有 SlopeChart 斜率图（#1918）可画再平衡前后权重，面板里还没接 |
| RegimeStrip | 研究 | 量化 | `RegimeStrip` | 已做 |  |
| ReplayBar | 订单流 | 面板 | `src/panels/chart/ReplayBar.tsx` | 已做 |  |
| ReportBuilder | 工具 | 面板 | — | 没做 | 报告装配，还没有对应面板 |
| RiskBoard | 组合 | 面板 | `src/panels/risk-board` | 已做 |  |
| RobustnessGate | 研究 | 面板 | — | 没做 | 研究层，还没有对应面板 |
| RunInspector | 研究 | 面板 | — | 没做 | 研究层，还没有对应面板 |
| RunLauncher | 研究 | 面板 | — | 没做 | 研究层，还没有对应面板 |
| RunQueue | 运行中心 | 面板 | `src/panels/run-center` | 部分 | 运行中心有，队列与失败分栏没有 |
| Screener | 发现 | 面板 | `src/panels/screener` | 已做 |  |
| SeriesBrowser | 研究 | 面板 | — | 没做 | 研究层，还没有对应面板 |
| SignalMonitor | 研究 | 面板 | — | 没做 | 研究层，还没有对应面板 |
| SmartTape | 订单流 | 面板 | `src/panels/tape` | 已做 |  |
| SparkTile | 图表 | 量化 | `SparkTile` | 已做 |  |
| Splitter | 工作台 | 基础件 | `Splitter`、`src/workspace/WorkspaceCanvas.tsx` | 已做 | #1901：Splitter 在包的 primitives 里（自写，没用 react-resizable-panels）；工作区的格子分割线用它 |
| StatusBar | 工作台 | 积木 | `StatusBar` | 已做 | #1901：包里有分段模型的 StatusBar；应用现在没有底部状态栏（顶栏右上的 LocalServiceStatus 另算），还没有调用方 |
| StatusLED | 工作台 | 自有件 | `Led` | 已做 |  |
| StrategyCompare | 研究 | 面板 | — | 没做 | 研究层，还没有对应面板；组件库已有 ConnectedScatter 连线散点图（#1918）可画波动与收益的月度轨迹，面板里还没接 |
| StressTest | 资产管理 | 面板 | — | 没做 | 资产管理，还没有对应面板 |
| SymbolMap | 运行中心 | 面板 | — | 没做 | 代码映射，还没有对应面板 |
| SystemHealth | 运行中心 | 面板 | `src/shell/LocalServiceStatus.tsx` | 部分 | 本地服务状态有，六块仪表没有；组件库已有 UptimeBars 逐格可用条（#1918）可补逐小时可用，面板里还没接 |
| TCA | 资产管理 | 面板 | — | 没做 | 资产管理，还没有对应面板 |
| Talk | 发现 | 面板 | — | 没做 | 交易聊天流，还没有对应面板 |
| TaxLots | 盈亏 | 面板 | — | 没做 | 盈亏，还没有对应面板 |
| Toggle | 工作台 | 基础件 | `Switch`、`ToggleGroup` | 已做 |  |
| TradeStats | 资产管理 | 面板 | `src/panels/journal/StatsPage.tsx` | 已做 |  |
| VolSurface | 衍生品 | 面板 | — | 没做 | 衍生品，还没有对应面板 |
| VolumeProfile | 订单流 | 面板 | `src/panels/volume-stats` | 部分 | 有成交量统计，价位分布轮廓没有 |
| WalkForward | 研究 | 面板 | — | 没做 | 研究层，还没有对应面板 |
| Watchlist | 发现 | 面板 | `src/panels/watchlist` | 已做 |  |
| WorkspaceTabs | 工作台 | 积木 | `WorkspaceTabs` | 已做 | #1901：包里有标签条；应用的工作区切换仍是菜单（src/shell/WorkspaceMenu.tsx），换不换是产品决定，等用户定 |
| Workspaces | 运行中心 | 面板 | `src/shell/WorkspaceManagerDialog.tsx` | 已做 |  |
| YieldCurve | 固收 | 面板 | — | 没做 | 固收，还没有对应面板 |
