# DateRangePicker 日期区间：先挑再应用

起点、终点两个日期框，右边的日历按钮打开双月日历。`commit="apply"` 时先挑再应用：弹层脚上左边状态字、右边「清除」「应用」，日历里的改动只放草稿，点「应用」才生效；`commit="immediate"`（默认）点完终点就生效，这份地图只走 apply。

## Sub-features

- `range-apply-status` 脚上状态字三档：还没点「选第一天」、点了起点「已选 1 天」、悬停或点了终点「已选 N 天」（含首尾）。「应用」在区间不完整时禁用。
- `range-apply-follow` 框跟着草稿走：点起点后起点段落填好、终点仍是占位。
- `range-apply-preview` 悬停预览区间；今天的格子有小点。
- `range-apply-discard` Esc、点外面收起：值没变，草稿丢掉。
- `range-apply-commit` 点「应用」：上报区间、收起、焦点回触发钮；「清除」清空草稿但不收起。
- `range-apply-keyboard` 键盘全程：方向键走日、Enter 选、Tab 到脚上钮、Enter 应用。

## How to get to it (user POV)

- 文档站左侧目录「表单」一组「DateRangePicker 日期区间」，地址 `#/date-range-picker`。
- 页上第三行「先挑再应用（commit=apply）」，右边 `<output data-gallery-range-apply>` 写当前已生效的区间，初始「未选」。演示固定「今天」是 2026-11-14。
- 打开：点那行的日历钮「选择区间」，或焦点在钮上按 Enter。

## Driving it with kui.mjs

前置：`$KUI doctor` 全 OK。只看第三行 `section.locator('.k-dr').nth(2)`；弹层渲染在页面根部的 portal 里，脚是 `page.locator('.k-dr-foot')`，状态字是脚里的 `role=status`。日期格的名字形如「2026年12月7日星期一」，用 `getByRole('button', { name: /12月7日/ }).first()` 找。

- **开。** 点「选择区间」。脚上状态字「选第一天」，「应用」disabled，页上恰有 1 个 `.k-cal-cell[data-k-today]`。
- **点起点、悬停终点。** 点 12 月 7 日：状态字「已选 1 天」，起点框日段「07」，终点框年段 `data-placeholder="true"`。悬停 12 月 18 日：「已选 12 天」，日历上 `.k-rcal .k-cal-cell[data-selected]` 共 12 个，「应用」仍 disabled。
- **点终点、Esc。** 点 12 月 18 日：「应用」enabled。按 Esc：脚消失，`<output>` 仍是「未选」，焦点回「选择区间」钮。再开：状态字又是「选第一天」。点外面（`page.mouse.click(5, 5)`）同样收起、值没变。
- **应用。** 再开，点 7 日、18 日，点「应用」：`<output>` 写「2026-12-07 ~ 2026-12-18」，脚消失，焦点回「选择区间」钮。
- **清除。** 再开：状态字「已选 12 天」。点「清除」：「选第一天」，「应用」disabled，脚还在，`<output>` 不变。
- **键盘。** 焦点在「选择区间」钮上按 Enter，焦点进日历（聚焦日是当前值的起点；页刚打开还没有值时是演示的今天 11 月 14 日。流程里前面已应用过 12 月 7–18 日，所以从 12 月 7 日起）；Enter 选起点（状态字「已选 2 天」：react-aria 键盘选完起点会把焦点挪到下一天）；→ → 后「已选 4 天」；Enter 选终点；Tab 到「清除」、再 Tab 到「应用」，Enter：`<output>` 写「2026-12-07 ~ 2026-12-10」（页刚打开就走这一步则是 2026-11-14 ~ 2026-11-17），焦点回钮。
- **证据。** `$KUI drive date-range-picker`：每步一张截图，`range-apply-open.aria.yml` 是打开时弹层的 ARIA 快照。

## Gotchas

- 页上有三个 DateRangePicker，一定先收到第三行（`.nth(2)`），否则「选择区间」匹配到三个。
- 点格子、翻月之后 Radix 自己的「点外面收起」会漏掉第一次点外面（react-aria 的按压截住了 pointerdown），件里已在 document 捕获阶段补了一道；如果以后这条回归，表现是点外面没反应、要点两次。
- 鼠标点起点是「已选 1 天」，键盘 Enter 选起点是「已选 2 天」（焦点被 react-aria 挪到下一天）；两条别混着断言。
- 弹层有入场动画：断言用会等待的 `expect(...).toBeVisible()`。
