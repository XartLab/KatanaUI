# AgentDrawer Agent 档案抽屉

一个 Agent 本身的档案：头是名字与一句说明，属性区写状态、标签、触发、负责人、创建时间，下面三个页签「用量 / 配置 / 历史」。用量页有两张指标卡、一张活动热力格（最近 12 周每天跑了几次）和最近运行列表。悬停或键盘落到热力格的一格，格子下面读出「10-14 跑了 11 次」；点最近运行的一行只回调运行 id；Agent 列表点一行，右边的抽屉打开它的档案。

## Sub-features

- `drawer-status` 三种状态：在跑 / 暂停 / 停用各有状态词、图标与语气（在跑是中性亮色加转圈，不是强调色橙）。
- `drawer-tabs` 页签：点「配置」换成调用方给的内容，指标卡不在了；点回「用量」又出现。
- `activity-grid` 热力格：`role=grid`，一天一格，0 次是空格，跑过的分 5 档；读屏名是整句。
- `activity-readout` 悬停或键盘聚焦一格，格子下面写那一格的整句；方向键走格（← → 前后一周，↑ ↓ 前后一天，Home / End 头尾）。
- `recent-runs` 最近运行：点一行或在行上按 Enter，回调运行 id；结果是图标加词。
- `agent-table` Agent 列表（DataGrid）点一行，Sheet 里打开抽屉；Esc 关闭。

## How to get to it (user POV)

- 文档站左侧目录「AI → AgentDrawer Agent 档案抽屉」，地址 `#/agent-drawer`。
- 页上从上到下：三个抽屉（在跑、暂停、停用），每个一行说明；最下面是 Agent 列表（`data-testid="agent-table"`）。
- 抽屉里的数据是示例：「盘前扫描」，每个交易日 08:30 跑，周末不跑；时钟固定在 2026-11-23 09:00。

## Driving it with kui.mjs

前置：`$KUI doctor` 全 OK。只动第一个抽屉（`[data-slot="agent-drawer"]` 的第一个，状态是「在跑」），页底的 `[data-testid="agent-drawer-opened"]` 记着最近点开的运行 id。

- **三种状态。** 打开页。三个抽屉，状态词依次是 `在跑`、`暂停`、`停用`，`data-tone` 依次是 `progress`、`warn`、`neutral`；第一个抽屉属性区的名是 状态 / 标签 / 触发 / 负责人 / 创建时间，页签是 用量 / 配置 / 历史，两张指标卡（`节省时间` `本月花费`）。
- **页签。** `getByRole('tab', { name: '配置' }).click()`：「配置页由调用方给」可见，指标卡数是 0；再点 `用量`，指标卡数回到 2。
- **热力格。** `getByRole('grid', { name: '最近 12 周每天跑的次数' })`：84 个 `gridcell`，`data-level` 取遍 0 到 5，每格 `aria-label` 是整句（`10-14 跑了 11 次` 或 `…没跑`）。
- **悬停读数。** 第 31 个格子 `hover()`：`[data-slot="agent-activity-readout"]` 的字等于那格的 `aria-label`；鼠标移到页外，读数行回到「共 12 周，悬停或用方向键看某一天」。
- **方向键。** 第 31 格 `focus()`，按 `ArrowRight`：焦点格的 `data-date` 加 7 天；再按 `ArrowDown`：再加 1 天；读数行跟着换成焦点格的整句。
- **最近运行。** 第 2 行（价格突破）的按钮 `click()`，页底写 `onOpenRun：r4`；第 4 行的按钮 `focus()` 再按 `Enter`，写 `onOpenRun：r2`；第 1 行结果是 `在跑`，第 2 行是 `失败`。
- **列表点开。** `getByTestId('agent-table')` 里 `getByRole('rowheader', { name: '回补日线' }).click()`：`getByRole('dialog', { name: '回补日线' })` 出现，状态 `暂停`、触发含 `事件`；`Escape` 后对话框消失。
- **证据。** `$KUI drive agent-drawer`：七步七张截图，`agent-drawer-running.aria.yml` 是在跑抽屉的 ARIA 快照，`agent-drawer-sheet.aria.yml` 是列表点开的抽屉。

## Gotchas

- 页上三个抽屉的结构一样，不收到 `.first()` 会撞三个同名元素；页底的 `agent-drawer-opened` 也有三个。
- 热力格的 DOM 顺序是「一行一个星期」（先周一那一行的 12 格、再周二……），不是时间先后；第 31 格不是第 31 天，用 `data-date` 认日期。第一周不满时第一行比后面的行少一格（Home 到 9 月 1 日，在周二那一行）。
- 到头的方向键不拦（页面照常滚）：第一列按 ← 焦点不动，不算 bug；要验方向键先把焦点放在中间的格子上。
- 「在跑」的图标在转，截图会拍到不同角度；比较像素用组件截图（测试里把动画跑完一圈），不比这里的截图。
- 点最近运行只回调运行 id：件不打开任何东西，页底那一行是演示页自己写的。
- 控制台里「两个同 key 的子节点…decisions」是文档站目录的老报错，kui.mjs 已记在 known 里。
