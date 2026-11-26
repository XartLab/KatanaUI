# KatanaUI 功能地图

从用户视角记文档站上组件的行为：是什么、怎么找到、怎么用 `kui.mjs` 走、看到什么算成功。实现细节不写在这里，走的时候现查。
第一版（2026-11-23，main `c9634db`）只收 main 上已有、有行为可以驱动的四个件；别的件走到了再加，照同一个格式。

## 基线

- 照 [SKILL.md](../SKILL.md) 的 Launch 起服务，`$KUI doctor` 全 OK。
- 浏览器：系统 Chrome，无头，视口 1100×1500，`zh-CN`，时区 UTC；每条流程一个新的浏览器上下文，`localStorage` 是空的。
- 主题：Graphite（地址不带 `?theme=`）；要验 Console 加 `--theme console`。
- 文档站的演示数据写死在 `packages/react/gallery/`，没有种子要准备，也不会被流程改坏：刷新就回到初始状态。
- 不驱动不是这次 `start` 起的实例（`doctor` 的 `port` 一行要是 OK）。

## 操控约定

- 每条流程从刚打开的页开始，地址 `http://127.0.0.1:5196/?theme=graphite#/<页 id>`，等 `[data-gallery="<页 id>"]` 出来再动手。
- 定位先用 ARIA 角色和可见名字，其次 `data-slot`、`data-testid`、`data-col`；不用坐标和 Tab 次序。名字照抄，大小写、空格都不改。
- 一页有几个同类演示时先收到具体那个（地图里写了收到哪个）。
- 每一步记动作和动作后的状态，状态读属性（`aria-sort`、`aria-selected`、`aria-expanded`、焦点）和用户看得见的文字。

## 每个功能文件的格式

一级标题加一段话说用户看得见的行为，然后固定四节：

1. `Sub-features`：短 id 加一句话。
2. `How to get to it (user POV)`：每一个入口。
3. `Driving it with kui.mjs`：以「前置：」开头；每条是「用户动作 → 流程里的确切写法 → 能观察到的结果」，最后一条写证据。
4. `Gotchas`：会浪费一次走查、或让结果不算数的坑。

## 证明与跳过的写法

- 一次 `$KUI drive <流程>` 的 `report.md` 就是这条功能的证明：每步截图、动作后的状态、提交号。
- 地图里列了几个入口，就要走几个；只走了其中一个，报告里写明哪个没走、为什么，不算整条通过。
- 走不到的路径写试了什么、缺什么前置条件。

## 功能

| 地图 | 流程 | 覆盖 |
| --- | --- | --- |
| [DataGrid 数据表](data-grid.md) | `drive data-grid` | 点表头排序（升 / 降 / 取消）、窄容器按优先级收列与「+N cols」展开收起 |
| [OrderTicket 下单面板](order-ticket.md) | `drive order-ticket` | 两栏算数、改杠杆、超可用报错、止盈止损模板、按风险算张数、开仓与平仓 |
| [弹出层](overlays.md) | `drive overlays` | Popover 与 Dialog 的点开、Esc 关、点外面关、焦点回到触发处 |
| [Tabs 页签](tabs.md) | `drive tabs` | 点页签换内容、底块跟随、方向键切换、禁用页签 |
| [联动组与选组件](link-group.md) | `drive link-group` | 同组同步、选组菜单（打勾与每组品种）、进有品种的组、进空组带着品种走、不联动、键盘选组与 Esc、自选联动、十字线联动 |
| [TagCombobox 带标签的多选](tag-combobox.md) | `drive tag-combobox` | 点字段开、点两项成标签、打字过滤并加强命中字、空输入退格两次删标签、标签换行时弹层下移 |
| [DateRangePicker 日期区间](date-range-picker.md) | `drive date-range-picker` | commit=apply 先挑再应用：状态字三档、悬停预览、Esc / 点外面丢草稿、应用、清除、键盘全程 |
| [AgentRunDetail 运行详情与 AgentRunList](agent-run-detail.md) | `drive agent-run-detail`（列表手走） | 五种状态的刻度与动作钮、进度条语义、阻塞问题卡确认、完成后接着跑、详情与步骤键盘收起、运行列表点开 |
| [RuleBuilder 规则构建器](rule-builder.md) | `drive rule-builder` | 条件树与回读、切 And / Or、同组换序（Alt+↑↓、拖动，跨组不落）、校验、动作与撤销 |
| [Omnibox 万能框](omnibox.md) | `drive omnibox` | 页签与计数、AAPL 变标签与退格、问句收起与回车去问、行尾提示、预览卡、Ctrl+回车新标签 |
| [AgentDrawer Agent 档案抽屉](agent-drawer.md) | `drive agent-drawer` | 三种状态、页签、热力格读数与方向键、最近运行点行回调 id、列表点开抽屉 |
| [研究资料与日历](research-calendar.md) | `drive calendar-events`、`drive file-import`、`drive template-library` | 日历事件点与洞察、资料导入（进度、重试、移除、粘贴、链接）、模板库（搜索、键盘、就地编辑、复制、使用） |
| [对照 Salt 补的七件](salt-gaps.md) | 还没有流程（手走） | Pill 改与删、SystemStatus 关闭、Calendar 选日与不可选日、ListBox 单选与多选、Link / Card / Panel 的样子 |
| [RatingPanel 技术评级三联](rating-panel.md) | `drive rating-panel` | 点周期与 ← / → + Enter 切周期、悬停与 Tab 聚焦出读数 |
| [SymbolNote 品种备注](symbol-note.md) | `drive symbol-note` | 悬停预览、点击与 Enter 钉住、编辑后保存、存空就是删除、Esc 收起与放弃草稿 |
| [SeasonalChart 季节性图](seasonal-chart.md) | `drive seasonal-chart` | 键盘读数（← / PageUp / End / Esc）、图例开关、表格视图、受控隐藏与最后一年关不掉、窄于 520px 的布局 |

## 待补

这几个件还没合进 main，合并以后照同一格式补上：

| 件 | 等哪个 PR | 合并后要补什么 |
| --- | --- | --- |
| 订单簿、深度图、成交明细 | XartLab/KatanaUI#140（`feat/104-orderbook`） | 新建 `orderbook.md` 与 `flows/orderbook.mjs`：合并档位、买卖两侧、占比 |
| Markdown 安全正文 | XartLab/KatanaUI#133（`feat/132-markdown`） | 新建 `markdown.md` 与流程：渲染、危险内容被拦下 |
| 弹出层滚动即关 | XartLab/KatanaUI#135（`fix/125-popover-scroll`） | 在 [弹出层](overlays.md) 加子功能 `popover-scroll-close`：页面或装着锚点的容器一滚就关；用 `el.click()` 开（见那份的 Gotchas） |
| 对照 Salt 补的七件 | XartLab/KatanaUI#104 的补件 PR | 写 `flows/salt-gaps.mjs`，把 [salt-gaps.md](salt-gaps.md) 里手走的几步变成 `drive salt-gaps` |

## 已走过的记录

| 日期 | 提交 | 走了哪些 | 结果 | 记录 |
| --- | --- | --- | --- | --- |
| 2026-11-23 | `c9634db` | 四条全走 | 全部 PASS | XartLab/KatanaUI#143 |
| 2026-11-23 | `3281e887`（`feat/150-rating-panel` 合入 main 后） | rating-panel、symbol-note | 两条 PASS；各做一次改坏，变红后还原 | XartLab/KatanaUI#159 |
| 2026-11-23 | `feat/150-rating-panel` 周期一排改 rovingFocus 后 | rating-panel | PASS 7 步；把 `rovingFocus` 改回 false，第 03 步（→ 到 5m）变红，已还原 | XartLab/KatanaUI#159 |
| 2026-11-23 | `c3eb2c28` | `link-group`（Graphite，十一步；合并前的工作树另走过一次 Console） | PASS；把选组件进组时的 joinLinkGroup 注释掉，第 06 步 FAIL（迷你图进空的组 C 后不再是 DDD） | XartLab/KatanaUI#162 |
| 2026-11-23 | `b0928449`（`feat/147-seasonal-port` 合入 main 后） | seasonal-chart | PASS；做了一次改坏，变红后还原 | XartLab/KatanaUI#169 |
