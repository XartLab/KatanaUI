# @katana-ui/react（中文说明）

> 对外的英文说明在 [README.md](../README.md)。本文是内部说明，写给开发这个包的人。源头仓库是 XartLab/KatanaUI（2026-11-14 起，#2；以前是 KATANAview 的 `packages/ui`，文中「决策记录」「#数字」未注明仓库的指 KATANAview）。

KatanaConsole 自建的组件框架（决策记录 0049（KATANAview 的 docs/architecture/adr/0049-self-built-ui-framework.md））：Radix 做行为底座，shadcn 的代码做起步，Tailwind v4 写样式，颜色、字体、间距、动效全部取自 `tokens.json` 生成的 token。
私有包（还没发 npm），许可证 **MIT**（用户 2026-11-14 定，#1876），好复用到别的量化项目，包括不是 AGPL 的项目；KATANAview 应用与它的 `@katanaview/*` 包仍是 AGPL-3.0。`src/primitives/` 里的文件是 shadcn/ui 的衍生（MIT，文件头写着出处），我们自己写的件在 `src/katana/`（也是 MIT）。
不依赖任何应用代码，所以 MIT 的包里不会混进 AGPL 的代码（单独成仓库后，物理上就引不到）。包里每个源文件头写 `SPDX-License-Identifier: MIT`。现在没有脚本自动查（KATANAview 时的检查脚本没搬过来）：新文件照现有文件写头，提交前用 `grep -rLE 'SPDX-License-Identifier: MIT' src --include='*.ts' --include='*.tsx' --include='*.css'` 找漏写的，再 `grep -rn AGPL src` 确认没混进 AGPL。

## 分层

```
tokens → theme → lib → layout → primitives → katana → patterns → quotes → quant → blocks
```

只许往左依赖（`.dependency-cruiser.cjs` 的 `ui-*` 规则）。

| 层 | 目录 | 放什么 |
| --- | --- | --- |
| tokens | 另一个包 `@katana-ui/tokens`（`packages/tokens/`） | `src/tokens.json`（token 源头，手改这份）、`src/tokens.css`（`pnpm tokens:sync` 从 `tokens.json` 与 `motion.tokens.json` 生成，不手改）、`src/motion.tokens.json`（三条弹簧）；本包的 `src/tokens.css` 与 `src/tokens-json.ts` 只是把 `./tokens.css`、`./tokens.json` 出口转发过去 |
| theme | `src/theme/` | `theme.css`：Tailwind v4 的 `@theme inline` 把 token 接成工具类；`motion.css`：入场、退场的关键帧与 `data-state` 动效 |
| lib | `src/lib/` | `chart/`（图表共用底座，G5 从 quant 下沉：`chart-kit/` 零件与配色、`chart-scale` 比例尺与分位数、`series-geometry` 序列几何、`scatter-model`、`brush-model`、`format/` 价格涨跌幅数量的纯函数，出口仍是 `@katana-ui/react/quant/format`）、`cn`（`clsx` + `tailwind-merge`，认得 `k-text-*` 字号档）、`focus`（焦点环类）、`motion`（弹簧参数）、`use-scrubber`（序列图共用的扫读钩子，#1917）、`link-group`（联动组 `useLinkGroup`：同组的件共用品种、周期、十字线、可见区间，#22 G8，KatanaUI） |
| layout | `src/layout/` | 排版原语与分量（#115）：`Stack`（竖排）、`Cluster`（横排换行）、`Sidebar`（一窄一宽，放不下上下叠）、`Switcher`（容器窄于阈值整体竖排）、`Grid`（等宽格）、`Reel`（横向滚动）。间距只收 `space-*` 刻度名（`space.ts`，单测跟 tokens.json 对账），原语只管位置与间距，不画边框、不带底色，样式在 `theme/layout.css`；模式借自 Every Layout，只借模式不取代码（见 `NOTICE`）。`EmphasisProvider` / `useEmphasis`（`emphasis.tsx`）：三档分量 hero / standard / compact，默认 standard，往下继承；分量只改字号档、显示多少、要不要表头，不改颜色与密度。认分量的件：`QuoteCard`、`PriceTag`、`GaugeBar`（katana 层）、`DataGrid`、`NewsFeed`（blocks 层），其余件照 standard 画；这些件读 `useEmphasis()`，所以 layout 在它们下面。没有依据的数（`SIDEBAR_CONTENT_MIN`、`SIDEBAR_SIDE_WIDTH`、`SWITCHER_THRESHOLD`、DataGrid 的 `COMPACT_ROW_LIMIT`）写成具名常量并标「待定」；`GRID_MIN` 240 取自 KATANAview layout.md「面板最小 240」 |
| primitives | `src/primitives/` | 无业务的基础件：button（含 `icon` 变体）、input、select、toggle-group、slider、checkbox、switch、tooltip、popover、dialog、dropdown-menu、context-menu、tabs、accordion、sheet、hover-card、command（`cmdk`）、scroll-area、separator、progress、alert、card（#104）、field、label；`lib/opener-focus` 是 dialog 与 sheet 共用的「关上时焦点回开启处」 |
| katana | `src/katana/` | KATANA 自有的件（见下）：led、lcd、dot-matrix、rolling-text、badge、kbd、skeleton 与加载态、toast（弹出提示的外观，计时与队列在应用里）、notification-bell、status-icon、ai-status、matrix-orb、arcade-pixel（取自 SmoothUI，MIT）、step-player、code-block、web-search（这几件交互学自 rare-ui，实现原创，文件头写明）；json-viewer（#1919：功能参照 Arc，只取公开页面写出的功能与交互，实现原创）；pill、system-status、link、panel（#104 对照 Salt 补，只取结构）；ruler-slider（单向刻度尺，#157：手感照 exposure-slider，带数字的大刻度与点按改自 Arc 免费仓库的 ruler-slider，MIT）；表单与动作件 2026-11-18（G2）搬到了 patterns/，行情件（G4）搬到了 quotes/；可以用 primitives，不是 shadcn 的衍生，所以单放一处（`primitives/` 的文件头另写 shadcn/ui 的出处） |
| patterns | `src/patterns/` | 由基础件组出来的固定搭法：multi-select（弹层加勾选）、combobox（弹层加 command：可搜索的单选或多选下拉）、chip-group（分面筛选芯片组）、date-range-picker（双月日历加预设；commit="apply" 先挑再应用，默认 immediate，#192）、tree-view（react-aria 的 Tree，数据驱动）（后三件 #1919）；list-box（react-aria 的 ListBox，常驻页面的选项列表）、calendar（react-aria 的 Calendar，单独摆放的月历，皮肤同 date-time-input 的日历）（#104）；表单与动作件（G2，2026-11-18 从 katana/ 搬来）：number-input（算式输入与框内标签，#1919）、date-time-input、duration-picker、password-input、shortcut-recorder、theme-selector、hold-to-confirm、delete-button、task-list（password-input 到 task-list 中的六件交互学自 rare-ui，hold-to-confirm 与 shortcut-recorder 参照 Arc，实现都原创），连同 filter-bar、view-switcher、rendering-settings、font-catalog、range-histogram-slider；split-button（拆分按钮）、tag-input（标签输入）、inline-edit（原地改名）改自 Arc 免费仓库的同名件（#1954，MIT，见 `NOTICE`）。纯函数放同名的 `*-model.ts`。值回调一律 `value / defaultValue / onValueChange`，文案一律 `labels`（旧名留一个版本作 @deprecated）。可以依赖 primitives、lib 与 katana 的读数件（ShortcutRecorder 用 Kbd） |
| quotes | `src/quotes/` | 行情套件（出口 `@katana-ui/react/quotes`；2026-11-18 G4 从 katana、quant、patterns 收拢，旧出口照旧再导出）：sparkline 与 mini-chart、treemap、price-tag、quote-card、range-bar、rating-gauge、gauge-bar、symbol-mark（从应用的分析视图提来 #1884，或功能参照 TradingView 小组件，只取给用户看什么、怎么交互，不嵌不抄），以及 change-text、pnl-text、tone-text、rating-text、technical-rating、metric-card（含 `variant="tile"`，即 SparkTile）、key-stats、peer-cards、performance-strip、watchlist、quote-table、row-actions；`cell-type`（表格格内排版的共用件：代码芯片、单位小字、缩写，DataGrid 与 QuoteTable、Watchlist、LimitLadder、EventCalendar 共用，样式 `theme/cell-type.css`，#92，不进出口）。行情行统一一个模型 `QuoteRow`（`{ id, symbol, name, last, change, changePct }`，数字，文字由 `formatPrice` 写）。可以用 lib、primitives、katana、patterns 与纯函数的 `lib/chart/format`；quant、blocks 反过来用它 |
| quant | `src/quant/` | 量化领域的件与格式化（出口 `@katana-ui/react/quant`）：格式化函数（源码在 `lib/chart/format/`：价格按精度或 tick、涨跌幅、数量缩写；纯函数另有 `@katana-ui/react/quant/format` 出口，画布与 Worker 里用）。只依赖下面几层，不依赖行情、图表包与应用；品种、精度、单位由调用方传。有两个及以上调用方的才进；时间序列与盈亏（#1917，图都画在 viewBox 里、文字与十字线叠成 HTML，比例尺与路径在 `lib/chart/series-geometry`，几何都是纯函数）：`BrushChart` 与 `BrushStrip`（概览刷选条加主图）、`lib/chart/chart-kit/`（图表共用底座）、`CalendarHeatmap`（一年的日盈亏，涨跌发散色）、`HorizonChart`（地平线图）；`MarketHeatmap`（市场热力图，跨市场共用，#15：照 TradingView 股票热力图，排布用 `quotes/treemap-model` 的 `layoutTreemap`，格子里的徽标是 `SymbolMark`，工具条是 `ToggleGroup`） |
| blocks | `src/blocks/` | 拼面板用的积木（出口 `@katana-ui/react/blocks`，#1869）：`DataGrid`（数据表：TanStack 行为、虚拟滚动、列排序 / 改宽 / 拖序 / 显隐、键盘选择，列声明类型 price / quantity / pnl / change / side / time / symbol / text / number，#90 加 percent / compact / rating / spark / range / date、bar 的 barMax 单边条与 comfortable 档）、`EmptyState`（空态）、`Toolbar` 零件与 `ToolButton`、`EstimateBadge`、`EventTimeline`（#1919：按显示时区分天的事件流，对设计稿 EventTimeline 卡）、`SmallMultiples`（同步十字线的小图阵列）、`SeriesExplorer`（KPI 瓦片点开成图面板、对账、刷选条、表格视图的盈亏探索，#1917、#1931）、`AttributionBars`（盈亏归因：Toolbar 顶行、编号清单、零轴条形、合计读数）、`Whiteboard`（#51：白板，底座 React Flow `@xyflow/react`（MIT）、布局 dagre；受控 nodes / edges / onChange，纯 JSON；便签、分组框、指标 / 序列、卡片插槽、假说五种节点，普通 / 带状态 / 反馈三种边，`getDownstream` 给下游名单；React Flow 只引 base.css，颜色变量在 `.k-wb` 上改成我们的 token）。可以用下面所有层，不依赖应用：快捷键表、文案、右键菜单怎么画、问 Agent 经 `DataGridHost`（`DataGridHostProvider`）注入，没提供时表照常能用（没有快捷键与标准右键项）。包里不带语言，文案都由调用方传 |

### KATANA 自有件（#1860）

读数与状态灯这类件是我们自己的，不是 shadcn 起步的，原来在应用的 `src/ui/`：Led、Lcd、DotMatrix、RollingText、BadgeGroup、Kbd、NumberInput、DateTimeInput、Skeleton 与 Loading、LoadingBoundary、LoadingView。
样子照组件卡，没改：规则是 `src/theme/` 下的普通 CSS（NumberInput、DateTimeInput 2026-11-18 搬到了 patterns/，css 名不变）（`led.css`、`lcd.css`、`kbd.css`、`badge.css`、`rolling-text.css`、`number-input.css`、`date-time.css`、`loading.css`），类名 `k-*` 原样保留，应用里按这些类写的覆盖规则照旧生效。
文字一律由调用方传（`label`、`LoadingTexts`、`DateTimeLabels`），包里没有中文；跟应用耦合的部分（徽标从市场包来、快捷键按平台拆块、文字按界面语言翻）留在 `src/ui/` 的适配层，调用处不用改。

### 分布与关系类的件（#1918）

功能参照 Arc（uiarc.dev，2026-11-14 读：目录页与件名；源码页要授权，没读），只学「有哪些部分、键盘怎么走、动效怎么表现」，实现原创，不装它的 registry、不抄代码；每个件的文件头写明出处。样式一件一个 css（`src/theme/<件名>.css`，共用的图右上三件那一行与表格视图在 `chart-kit.css`），颜色只用语义 token。

| 件 | 层 | 用途 |
| --- | --- | --- |
| `UptimeBars` | katana | 数据源 / 连接健康的逐格可用条（一格一天或一小时） |
| `RangeHistogramSlider` | patterns | 筛选器：在全体分布的直方图上拖区间（照 APG 多把手滑块） |
| `Ridgeline`、`QuantileLayers`、`SlopeChart`、`ConnectedScatter` | quant（出口 `@katana-ui/react/quant`） | 各组收益分布叠画、前后对比、波动 vs 收益的月度轨迹；共用 `lib/chart/chart-scale.ts`（比例尺、刻度、分位数） |
| `SymbolGalaxy` | blocks（出口 `@katana-ui/react/blocks`） | 品种星系：按行业 / 市场 / 因子分位 / 状态聚团，面积是市值、颜色是涨跌，切分组时点平滑迁移 |

这几件都有纯函数的模型文件（`*-model.ts`）与单测；文档站页上的演示数据用固定种子生成并在页上写明。应用里接真实数据另开票。

### 对照 TradingView 小组件补缺的第二批（#147，KATANAview #1884）

功能参照 TradingView 小组件（tradingview.com/widget-docs，2026-11-23 读：各页只有一两句说明，演示页的配置给了参数名；具体排布页面没写的标「待核对」），只取给用户看什么、怎么交互，不嵌、不抄代码；皮肤用 Graphite token，不用 TradingView 蓝。数与文字都由调用方传，包里不带语言与数据源。

| 件 | 层 | 对 TV | 用途 |
| --- | --- | --- | --- |
| `SymbolInfo` | quotes | Symbol Info | 品种报价头：徽标、代码、名称、交易所、状态灯，大号价与涨跌，一排区间条 |
| `SymbolOverview` | quotes | Symbol Overview | 多品种走势卡：品种页签、走势（price 只画选中的；percent 叠画比涨跌）、区间按钮 |
| `CrossRates` | quotes | Forex Cross Rates / Heatmap | 交叉汇率矩阵：汇率模式与热力模式（七档同 Treemap），方向键走格 |
| `CompanyProfile` | quotes | Company Profile | 公司简介卡：几项事实、可折叠正文、没数据时空态 |
| `SeasonalChart` | quant | Seasonal Chart | 季节性图：各年按一年里的第几天叠画，年份开关，`seasonalSeries` 按年切数据 |

没做：经济地图（世界地图着色要地理数据与投影库，加依赖、定数据源后另开票）。基本面、新闻、Market Data 的分组网格已有 `KeyStats` / `MetricCard`、`NewsFeed`、`DataGrid` 分节。

### 设计稿覆盖（#1870）

`docs/coverage-map.json` 是手写的：设计稿存档的每张组件卡（`design/katana-console/project/components/`）落在哪一类（基础件、自有件、量化、积木、面板）、落点、做没做。
`pnpm ui:coverage`（`scripts/ui-coverage.mjs`，2026-11-15 #14 从 KATANAview 搬回）生成 `docs/coverage.md`；`pnpm test` 先跑它的 `--check`：有卡没映射、映射的落点（包的出口名或仓库路径）不存在、`coverage.md` 不是最新，都红。落点写 `src/` 开头的是 KATANAview 应用里的文件（本仓库里没有），不核对；本仓库里的文件写 `packages/react/...` 或 `design/...`，照常核对。文档站的「覆盖」页（`#/coverage`）显示每一类的「已做 / 总数」，数字与 `coverage.md` 用同一份汇总（`docs/coverage-core.ts`）。
新增或改名一个件，同一个 PR 里更新映射；积木层（DataGrid、EmptyState、Toolbar，#1869）落地后，把 `planned` 里的名字挪进 `at`。

### 应用里换了什么、没换什么（#1870）

- **换了：** 告警弹出提示（`src/shell/AlertToasts.tsx`）的外观用包里的 `Toast*`（`katana/toast.tsx`）；队列、计时、悬停暂停、位置偏好仍是应用的（`toast-queue.ts`，决策记录 2026-11-13 #1797），`.kc-toast` 类名留着给 e2e 与 Graphite 的玻璃皮肤用。原来 shell.css 里那段 `.kc-toast*` 规则删了。
- **没换：命令搜索（`QuickSearch.tsx`）→ `Command`。** 它自己排名、给「匹配 xx」的别名提示、分「最近」「命令」两段、回车避开输入法组字，用的是跟指标库、品种搜索共用的 `.kc-ib-*` 外框。换成 cmdk 要关掉它的过滤、重写这一整套外框，收益只是少一段键盘移动的代码，风险是动三处共用的样式。留给把 `.kc-ib-*` 整套收进包的那一次。
- **没换：交易所多选（`SymbolSearch.tsx` 的 `VenueFilter`）→ `Combobox`。** 它是两列网格带 LOGO、状态灯和底部「全选 / 全部清除 / 完成」，行是 `role=checkbox`；`Combobox` 是单列的 listbox。要换得先给 `Combobox` 加两列与底栏，不然样子会变。现在包里的 `Combobox` 没有应用里的调用方，只在包与文档站里。
- **没换：4px 滚动条（#1799）→ `ScrollArea`。** #1800 把滚动条做成了全局的原生 CSS（`scrollbar-width` 与 `::-webkit-scrollbar`），所有滚动容器自动带上；换成 `ScrollArea` 要给每个滚动容器套一层，还会带来自绘滚动条与原生滚动条并存的问题。`ScrollArea` 留给需要自绘滚动条的地方（比如要在滚动条上放标记）。

## 徽标（#94）

`SymbolMark` 没给 `src` 时读外层的 `LogoProvider`（`@katana-ui/logos/react`，另一个包 `packages/logos`）：来源、代码规范化、缓存、命令行都在那个包，本包只在 `quotes/symbol-mark.tsx` 用 `useLogo`。没有 Provider 时行为不变。
同仓库开发读 logos 的 TS 源码：它的 exports 有 `katana-source` 条件，本包 `tsconfig.json` 的 `customConditions`、`vite.config.ts` 的 `sourceConditions`（截图配置与 `ds-build` 也用）开着它；`tsconfig.build.json` 关掉它，构建 lib 时读 logos 的 lib（logos 的 `prepare` 先构建）。不用通用的 `source` 条件名：`@internationalized/date` 等第三方包也用它指向自己的 TS 源码。来源与许可规则写在文档站「基础 → 图标与资源 → 徽标」。

## 三层 token 与密度（#1943）

组件只读 characteristics（`--k-actionable-*`、`--k-focused-*` …）与密度变量（`--k-size-base`、`--k-spacing-*`），不读 palette（`ink-*`、`alpha-white-*` …）；高度与内距随容器上的 `data-density="high|medium|low"` 变，默认 medium。照 Salt 的 Foundation → Palette → Characteristics 分层，三层各是什么、密度表、命名规则见 [theming.md](theming.md#三层-token-与密度1943)。目前只有 Button 迁过来（`src/characteristics.test.ts` 守着），其余件后续逐个迁。

## 应用怎么用

只从这几个出口引：

```ts
import { Button, Switch } from '@katana-ui/react' // 组件
import '@katana-ui/react/tokens.css' // token，先引
import '@katana-ui/react/fonts.css' // 随包的字体声明（Barlow、DM Mono、Doto、Maple、Michroma、方舟像素），用到字体就引
import '@katana-ui/react/ui.css' // Tailwind 主题与动效，最后引
import { snappy } from '@katana-ui/react/motion' // 弹簧参数（motion/react 用）
import { ChangeText, formatPrice } from '@katana-ui/react/quant' // 量化层
import { QuoteTable, Watchlist, MetricCard } from '@katana-ui/react/quotes' // 行情套件（旧的根出口与 quant 出口照旧可引）
import { DataGrid, EmptyState } from '@katana-ui/react/blocks' // 积木层
```

`ui.css` 要最后引：Tailwind 的工具类不放进 `@layer`，同样的选择器权重下靠引入次序压过应用里的旧样式。没有 preflight，不改应用已有的基础样式。
应用里不要用与 Tailwind 工具类同名的类名（`.flex`、`.hidden`、`.border`、`.container` 这类）：工具类不在 `@layer` 里，同名的应用类会被它压住或压住它。
应用自己的组件想用 Tailwind 类，要在应用的 CSS 里为那些文件加 `@source`（目前没有这种用法）。

## 添加一个组件

```
pnpm --filter @katana-ui/react exec shadcn add <component>
```

`shadcn` 命令行钉在 4.22.2，配置在本目录的 `components.json`（文件落到 `src/primitives/`，`cn` 用 `src/lib/cn`）。生成之后要做：

1. 文件头补上 MIT 与出处，格式照现有文件（没有脚本查，用上面「许可证」那段的 grep 自查）。
2. 尺寸、圆角、颜色、动效改成我们的：取 token，不写色值；字号用 `k-text-*`；焦点环用 `lib/focus`；动效写进 `theme/motion.css`，缓动取 `--ease-snappy` 等。
3. 文案不写死在组件里（需要的文字由调用方传，比如 Dialog 的 `closeLabel`），包里不出现中文。
4. 在 `src/index.ts` 导出；在文档站加它的页（见下一节）；在 `e2e/ui-gallery.spec.ts`（本包内）加断言用户看得见的行为。
5. 对应设计稿的卡，在 `docs/coverage-map.json` 里把状态与落点改过来，跑 `pnpm ui:coverage` 重新生成 `coverage.md`。
6. 文件名保持 shadcn 的短横线小写（`dropdown-menu.tsx`），这是 `scripts/check-components.mjs` 的例外：它只扫应用的 `src/`。

## 文档站

开发服务器（`pnpm dev:all`）与 e2e 测试台上有 `/ui-gallery.html`（根目录的 `vp preview` 没有）：组件文档站，版式照 kobra.systems 的组件页（2026-11-14 读，只取结构）。
左侧目录按类分组，右侧一个组件一页，地址 `#/<件名>`（直接打开、前进后退都行）；每页依次是实时预览（默认 Graphite，页头切 Console，`?theme=console` 直接以它打开）、属性表、组成、键盘操作。正式构建里没有。
悬停、按下、键盘焦点没法静态摆出来，用鼠标和 Tab 键去碰页上的件，`e2e/ui-gallery.spec.ts` 量它们的计算样式。

加一个件的文档页：在 `gallery/registry.ts` 的 `PAGES` 里加一项（说明、覆盖的出口名、属性表、组成、键盘），在 `gallery/pages/` 写它的演示、在 `gallery/demos.tsx` 登记。
`gallery/registry.test.tsx` 把页和 `src/index.ts` 的出口对账：每个导出的件都要有页，每页写的件都要存在。属性表是手写的，改了组件的属性要同步改它。

## 给别的项目用：shadcn 注册表

`registry.json` 是 shadcn registry 的清单（shadcn 4.22.2 的 schema），由 `scripts/registry-json.mjs` 从源码生成，不手写；每个源文件一项，`registryDependencies` 与 npm 依赖从 import 里扫出来。
`pnpm --filter @katana-ui/react registry:build` 先生成清单，再 `shadcn build` 出到 `r/`（在 `.gitignore` 里，发版时生成）。

- **type 的分法：** `primitives/` 的件是 `registry:ui`；`lib/`（含 `lib/chart/`、`lib/chart/format/`）是 `registry:lib`，`lib/chart/chart-kit/` 合成一项 `registry:component`；`patterns/`、`quotes/`、`quant/` 与 `blocks/` 的件是 `registry:component`（`quotes/` 与 `patterns/` 里的纯函数是 `registry:lib`）；`style`（token、Tailwind 主题、动效，共六个 CSS）是 `registry:style`。
- **命名：** `@katana/<文件名>`（`button`、`multi-select`、`change-text`）。每层的文件名要唯一，生成时查。
- **落点：** 每个文件装到 `src/katana/ui/<层>/<文件>`，保持包内的相对结构，所以件之间的相对 import 与 `theme.css` 里 `@source` 的相对路径在别的项目里原样有效。

别的项目的 `components.json` 加命名空间注册表（仓库是私有的，`Authorization` 头读环境变量 `GITHUB_TOKEN`；`r/` 要放在这个项目能访问的地址，下面的地址是占位，换成实际托管处）：

```json
{
  "registries": {
    "@katana": {
      "url": "https://<托管 r/ 的地址>/{name}.json",
      "headers": { "Authorization": "Bearer ${GITHUB_TOKEN}" }
    }
  }
}
```

装法（项目要用 Tailwind v4）：

```
npx shadcn add @katana/style @katana/button @katana/change-text
```

然后在入口样式里先引 `katana/ui/tokens.css`、最后引 `katana/ui/ui.css`（次序见上面「应用怎么用」）。换皮只覆盖哪些变量见 [theming.md](theming.md)。

### 行快捷操作与品种菜单（#23，TradingView 便利交互 #22 第 1 条）

`quotes/row-actions.tsx`：`RowActions`（行右端浮出的图标按钮条，浮在行上不挤列宽）、`symbolMenu`（标准品种菜单段：开图、加自选、新建告警、复制代码，固定次序；调用方的项接在后面）、`RowContextMenu`（给一组行或格子包上同一份右键菜单，菜单键与 Shift+F10 也开）、`RowActionMenuItems`。
件只认 `{ key, label, icon?, shortcut?, onSelect }`，文案与动作都由调用方传。三处套用，各加一个可选 prop，不传就没有：`DataGrid.rowActions(row)`、`LimitLadder.rowActions(item)`、`MarketHeatmap.cellActions(item)`（格子小，只有右键菜单）。
连板天梯的行是 `role=option`，里面不许有可聚焦子项（axe nested-interactive），所以它的按钮是 `pointerOnly` 的 span，键盘走菜单键。DataGrid 没有宿主键位表时，菜单键与 Shift+F10 也开右键菜单。
出处：TradingView 品种搜索结果行悬停出开图与概览（帮助中心 Symbol search tips，2026-11-15 读）；自选行悬停显示哪些按钮与右键菜单的项，页面没写，待核对。

## 精密仪器语言（#7）

根定义在设计稿存档的 `design/katana-console/project/precision-instrument.md`（Precision Instrument UI）（含组件库里的视觉语言，§11）；本包不另存一份。

## 许可证

MIT（用户 2026-11-14 定，#1876），见本文开头。别的项目经注册表装进去的文件，文件头也是 MIT。

## 设计系统包

`design-system/` 是 design-pipeline（0.15.0-beta.1）格式的设计系统包，**由脚本从代码生成，不手写**：`pnpm --filter @katana-ui/react ds:build`。
`tokens.json` 来自 `@katana-ui/tokens` 的 `src/tokens.json`（只带实装了的 Console 与 Graphite，补 `contrast`；对不上比例的 token 保留原值，比值写在它的 usage 里），
`README.md` 来自手写的 `ds/guidelines.md`，`components/bundle.css` 是 `tokens.css` 加 Tailwind 编出的 `ui.css`，
每个件的 `README.md` 与 `preview.html` 读文档站的页数据（`gallery/registry.ts` 的 `PAGES`：说明、属性、组成、键盘；预览是 `gallery/demos.tsx` 经 `react-dom/server` 渲染的静态 HTML，预览里摆件的版面类在 `gallery/preview.css`），经 `ds/render.tsx` 生成，不另写一份。页就是件：加一页（含自有件、量化件）设计系统包就多一个件，注册表的 item 说明也读同一页；每页的 `cardHeight` 是预览卡的高度（生成后在卡里量）。
门禁是 `pnpm lint:ds`，用法见 测试（KATANAview 的 docs/contributing/testing.md）。

## 测试

- `pnpm --filter @katana-ui/react test`：纯逻辑（`cn`、弹簧参数）与基础件的服务端渲染结构。根目录的 `pnpm test` 包含它。
- `pnpm --filter @katana-ui/react typecheck`：根目录的 `pnpm typecheck` 包含它。
- 浏览器行为（#2 第 4 步从 KATANAview 搬来）：`pnpm test:e2e`（根目录或本包都行）。`playwright.config.ts` 先 `vp build` 打包文档站、再 `vp preview` 给页面，只跑 dpr-1 一个项目。`e2e/ui-gallery.spec.ts` 量计算样式、键盘、动效、像素，`e2e/ui-gallery-a11y.spec.ts` 每页在两个主题下跑 axe 与控制台检查（当场修不了的违规列在 `e2e/ui-gallery-a11y-known.json`，只许减）。同一份断言不为过关而放松：跑红了先查是这边缺东西还是测试过期。
- Playwright 要的 Chromium 跟机器上预装的版本不一致时，用 `PLAYWRIGHT_BROWSERS_PATH` 指到一个放软链的目录（目录名按 Playwright 要的版本号，如 `chromium-1194`，指向预装的那份），或 `pnpm exec playwright install chromium`。
- Happo 视觉回归（要云端账号，不进门禁）：`pnpm --filter @katana-ui/react test:happo`，用 `e2e/ui-gallery-happo.spec.ts`。

## 单独成仓库（#1881）

本目录同步成镜像仓库 XartLab/KatanaUI（同步工作流在 #1866），split 出去之后本目录就是那个仓库的根，所以它自己带一整套工具链，不靠 KATANAview 的根目录：

- `package.json`：`dev`（起文档站）、`build:site`（文档站加 `r/`，地址前缀读 `SITE_BASE`）、`test`、`typecheck`、`check`；依赖都写死版本，与根目录一致；没有 `workspace:*`。
- `vite.config.ts`：Vite+ 的配置（构建、单测、格式化、代码检查）；`index.html` 是独立站点的入口（在 KATANAview 里文档站仍是根目录开发服务器的 `/ui-gallery.html`，用 `gallery/ui-gallery.html`，用法不变）。
- `tsconfig.json`：不再 extends 根目录的 `tsconfig.base.json`。
- `scripts/build-site.mjs`：`vp build`，再 `registry:build`，把 `r/` 拷进 `dist/r/`。
- `scripts/standalone.test.ts`：扫本目录的源码、配置、文档，出现越出包的 `../` 路径就红。
- `.github/workflows/pages.yml`：只在镜像仓库里生效（GitHub 不读子目录的 `.github`），push 到 main 时测试、构建并发布到 Pages。
- `README.md`（英文，对外）、`CONTRIBUTING.md`（英文）、本文件（中文，内部）。
- token：源头与生成器在 `packages/tokens`（`@katana-ui/tokens`，2026-11-14 #2 第 2 步拆出），包里的 `ds-build`、`ds-tokens.test.ts`、`theming.test.ts`、`motion.test.ts` 按包名读它的出口（本地靠 `linkWorkspacePackages` 连到仓库里那份）；改 token 在那个包里改 `src/tokens.json` 再 `pnpm tokens:sync`。
- 设计稿覆盖表的脚本（`pnpm ui:coverage`）已在本仓库重建（`scripts/ui-coverage.mjs`，#14）。
- `pnpm-lock.yaml` 是本包自己的锁（镜像里 `pnpm install --frozen-lockfile` 读它）：改了 `package.json` 的依赖后，在本目录跑 `pnpm install --lockfile-only --ignore-workspace` 并提交；根目录的 `pnpm lint:ui-lock`（`pnpm test` 里有）查它与 `package.json` 同步。根目录的安装不读它。

在 KATANAview 里改了 `package.json` 的依赖，要与根目录的版本保持一致；根目录的 `pnpm install` 照旧装这个包。
