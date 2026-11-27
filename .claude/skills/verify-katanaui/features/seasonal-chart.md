# SeasonalChart 季节性图

几年的走势按 366 格日历叠在一张图上，纵轴是相对年初基准的涨跌幅，看某段时间是不是年年涨或年年跌。上面一排年份开关隐去 / 显出一年（至少留一年）；焦点在图上按键盘出读数，列出那一天各年的涨跌幅；右上「Table view」换成每月一行的月末涨跌幅表；图窄于 520px 时图例另起一行，横轴只留单数月。

## Sub-features

- `seasonal-keys` 焦点在图上（`role="slider"`）：第一下 ← / → 落在今年最后一个点，← / → 一天，Shift 三天，PageUp / PageDown 上一个 / 下一个月初，Home / End 到 1 月 1 日 / 12 月 31 日，Esc 清掉读数。读数写在 `aria-valuetext`，也画成图上的 LCD 浮层。往年最后一个点之后沿用到年底，今年还没到的日子写「—」。
- `seasonal-legend` 点年份开关：`aria-pressed` 翻转，那一年的线隐去 / 显出。
- `seasonal-table` 点右上「Table view」：按下，图藏起来，换成表（region「Month-end change by year」）：表头 `Month` 加每个看得见的年，12 行，今年还没到的月写「—」；再点回到图。
- `seasonal-controlled` 受控隐藏：隐去哪些年在调用方，点开关只是告诉调用方；最后一个看得见的年关不掉。
- `seasonal-narrow` 整张图窄于 520px：图例单独占图操作下面的一行，横轴只留单数月的字。

## How to get to it (user POV)

- 文档站左侧目录「量化 → SeasonalChart 季节性图」，地址 `#/seasonal-chart`。
- 页上四张，各在一行，行头说明字不同：「五年叠画：右上「表格视图」」（2022 默认关，有 Table view）、「受控 hidden：图例状态在调用方」（初始隐去 2022、2023，下面一行回显「隐去的年：…」）、「窄于 520px：图例单独一行，横轴只留单数月」（400px 宽）、「没有数据」（只有一句 `Not connected`）。
- 演示数据是 2022–2026 五年的随机游走，今年只走到 11 月 20 日。
- 键盘：Tab 到年份开关（Enter / 空格切换）、Table view，再 Tab 到图上用上面的键。

## Driving it with kui.mjs

前置：`$KUI doctor` 全 OK。按行头说明字收到具体那张：`section.locator('.gal-row').filter({ hasText: '五年叠画' })`（另两张是 `'受控 hidden'`、`'窄于 520px'`）。图例是 `getByRole('group', { name: 'Years', exact: true })`，开关按年份开头找 `getByRole('button', { name: /^2023 / })`（名字是「年份 涨跌幅」），线是 `[data-slot="seasonal-line"]` 的 `data-year`，图是 `getByRole('slider', { name: 'Seasonals', exact: true })`。

- **默认。** 第一张五个开关，`2022` 的 `aria-pressed="false"`，画 2023–2026 四条线。
- **键盘读数。** `plot.focus()` 后 `aria-valuetext` 还没有；按 `ArrowLeft`：`aria-valuenow="324"`，`aria-valuetext` 以 `Nov 20` 开头、列出 2023–2026 四年，图里出现标题 `Nov 20` 的读数浮层。按 `PageUp`：`305`，`Nov 1`。按 `End`：`365`，`Dec 31 … 2026 —`，2025 的读数等于它图例上的涨跌幅（往年沿用最后一个点）。按 `Escape`：`aria-valuetext` 没了，浮层消失。
- **图例。** 点 `2023`：`aria-pressed="false"`，线剩 2024–2026 三条；再点回来，四条。
- **表格视图。** 点 `getByRole('button', { name: 'Table view', exact: true })`：`aria-pressed="true"`，region `Month-end change by year` 出现，表头 `Month 2023 2024 2025 2026`，12 行，`Dec` 那行 2026 一格是 `—`，图（slider）藏起来。再点：表没了，图回来。
- **受控隐藏。** 第二张：回显 `隐去的年：2022、2023`，线 2024–2026。点 `2024`：回显 `隐去的年：2022、2023、2024`，线 2025、2026。再点 `2025`，再点 `2026`：回显停在 `隐去的年：2022、2023、2024、2025`，`2026` 仍按下，只剩 2026 一条线。
- **窄图。** 第三张：图例的顶边不高于图操作（group `Chart actions`）的底边；第一张两者在同一行。第三张横轴看得见的月份是 `Jan Mar May Jul Sep Nov`，第一张是全部 12 个。
- **证据。** `$KUI drive seasonal-chart`：十一步十一张截图；`seasonal-default.aria.yml` 是第一张图（figure）的 ARIA 快照，`seasonal-table.aria.yml` 是表格视图的。

## Gotchas

- 页上三张有图例、都叫 `Years`，图都叫 `Seasonals`：不按行收一下会一次读出三个。演示没有 `data-testid`，只能按行头说明字（`.gal-row`）收。
- 给图焦点别用 `click`：指针一进图就按位置选了一天，第一下 ← 就不落在今年最后一个点上了。流程直接 `focus()`；键盘用户是 Tab 过来的，效果一样。
- 指针移出图、或焦点离开图，读数就清掉：读数步骤之间别去点别的地方。
- 图例开关的可见名字是「年份 涨跌幅」，但 `innerText` 在年份和涨跌幅之间是换行（`2023\n-4.46%`）：拆开用 `split(/\s+/)`，不要按空格拆。
- 表格视图里月份那一格是行头（`rowheader`），不算 `cell`：读一整行用 `row.locator('th, td')`，只取 `getByRole('cell')` 会少了月份。
- 表格视图开着时图是 `hidden`（`display: none`），关上后表整个从 DOM 里拿掉：表用 `toHaveCount(0)`，图用 `toBeHidden()` / `toBeVisible()`。
- 横轴的月份字对读屏隐藏，「只留单数月」是 CSS 容器查询把双数月 `display: none`：用 `getByText('Feb', { exact: true }).isVisible()` 逐个看，不读 ARIA 快照。
- 演示数据是固定种子的随机游走，涨跌幅的具体数随演示改动会变：流程只钉格号、年份、「—」与「读数等于图例」这类关系，不钉百分数。
