# 对照 Salt 补的七件（#104）

Pill、SystemStatus、Calendar、ListBox、Link、Card、Panel 七页：可点可关的胶囊、全站消息条、月历、常驻选项列表、文字链接、卡片、纯容器。
有交互可驱动的是前四件；Link、Card、Panel 只看画出来的样子与原生行为（Tab 聚焦、Enter 跳转）。

## Sub-features

- `pill-edit` 点胶囊本体：「点开改的条件」读数换成这颗的字。
- `pill-dismiss` 点 ×，或焦点在本体上按 Backspace / Delete：这颗从行里消失；「重置」把四颗都放回来。
- `pill-toggle` 点「到价提醒」：`aria-pressed` 在 true / false 之间换，底色跟着换。
- `sysstat-dismiss` 第一条（计划维护）的关闭钮：这条消失，原处出现「再显示维护通知」按钮，点它回来。
- `sysstat-roles` 五条消息各自的语气：`data-tone` 是 info / ok / warn / danger / neutral，图标形状各不同。
- `calendar-pick` 点一个可选的日子：选中换到它，读数 `[data-gallery-calendar]` 写出 YYYY-MM-DD。
- `calendar-unavailable` 周末与 2026-11-26：点了选中不变，格子带删除线。
- `calendar-keyboard` 焦点在日格上按方向键与 PageUp / PageDown：焦点按天、按月走，Enter 选中。
- `listbox-single` 第一个列表（选账户）：点「账户 B」选中换过去，读数 `[data-gallery-listbox]` 写 `b`；点已选的不取消；「旧模拟盘」点不动。
- `listbox-multi` 第二个列表（布局，给了 onAction）：单击只选这一项，Ctrl + 单击加选，读数 `[data-gallery-listbox-multi]` 跟着变；双击或 Enter 让 `[data-gallery-listbox-open]` 写出那一项的 id。

## How to get to it (user POV)

- 文档站左侧目录「表单控件 → Pill 胶囊」，地址 `#/pill`。
- 「反馈 → SystemStatus 全站消息条」，`#/system-status`。
- 「表单控件 → Calendar 月历」，`#/calendar`；第一张是可选的（2026 年 11 月，选中 20 日），第二张是禁用的 en-US 周日开头。
- 「表单控件 → ListBox 选项列表」，`#/list-box`。
- 「布局与导航 → Link 文字链接」`#/link`、「Card 卡片」`#/card`、「Panel 纯容器」`#/panel`。

## Driving it with kui.mjs

前置：`$KUI doctor` 全 OK。这一份还没有流程文件（`flows/salt-gaps.mjs` 待写，见索引的「待补」），先用 `$KUI shot <页 id>` 留截图与 ARIA 快照，交互照下面一条条手走。

- **改条件。** `#/pill`，`getByTestId('pill-cap').getByRole('button', { name: '市值 > 100 亿', exact: true }).click()`。`[data-gallery-pill-edit]` 的字是「市值 > 100 亿」。
- **去掉条件。** `getByRole('button', { name: '去掉条件 P/E < 20' }).click()`。`getByTestId('pill-pe')` 不在页上；剩三颗。再 `getByRole('button', { name: '涨幅 > 3%', exact: true }).focus()` 后按 `Backspace`，`pill-chg` 也不在了。点「重置」，四颗回来。
- **开关。** `getByTestId('pill-toggle').getByRole('button').click()`。`aria-pressed` 从 `true` 变 `false`。
- **关消息。** `#/system-status`，`getByRole('button', { name: '关闭维护通知' }).click()`。`getByTestId('sysstat-info')` 不在页上，出现按钮「再显示维护通知」；点它，消息回来。
- **选日子。** `#/calendar`，第一张 `section.getByRole('application').first()`，点 `getByRole('button', { name: /November 24, 2026|11月24日/ })`（名字按 locale 由 react-aria 写，zh-CN 下是中文日期，先 `aria` 存一份快照再定名字）。`[data-gallery-calendar]` 是 `2026-11-24`。
- **点不了的日子。** 点 2026-11-26 那一格（`aria-disabled="true"`）：读数不变。
- **单选列表。** `#/list-box`，`getByRole('listbox', { name: '选账户' }).getByRole('option', { name: /账户 B/ }).click()`。`[data-gallery-listbox]` 是 `b`；再点它一次仍是 `b`。
- **多选列表。** `getByRole('listbox', { name: '布局' }).getByRole('option', { name: '复盘' }).click()`。`[data-gallery-listbox-multi]` 变成 `review`；再 `getByRole('option', { name: 'A 股盘面' }).click({ modifiers: ['Control'] })`，读数是 `review,cn`；双击「复盘」，`[data-gallery-listbox-open]` 是 `review`。
- **证据。** 每页 `$KUI shot <页 id>` 的截图与 ARIA 快照，加上面各步动作后的读数。

## Gotchas

- Pill 的本体与 × 是两个按钮：按名字找 × 时用 dismissLabel（「去掉条件 …」），找本体用 `exact: true` 的条件字，免得两个都命中。
- 去掉一颗以后焦点由调用方放；演示里没放，焦点会落到 body，接着按键不会再删别的。
- 消息条五条里四条没有关闭钮，只有第一条有；演示都传了 `role="note"`，读屏快照里不是 alert。
- Calendar 的日格名字跟 locale 走，en-US 与 zh-CN 写法不同；第二张日历是禁用的，点它没有任何反应，不要拿它当失败。
- ListBox 的「布局」列表给了 onAction：单击是「只选这一项」，多选要按 Ctrl / Shift；切换选中要按 Space。
