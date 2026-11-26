# 研究资料与日历

三件放在一起（XartLab/katanaui#226）：日历的事件点与洞察、研究资料导入、模板库。都是调用方给数据与文字，件只显示与回调。

## Sub-features

- `calendar-events` 日历格子下的事件点：有事件的格子带点；悬停或键盘聚焦读出当天的事；日历脚一行洞察（图标加一句话）。DateTimeInput、DateRangePicker、TradingDatePicker、Calendar 四处都能带；不传就没有。
- `import-progress` 资料导入的清单：多文件并发上传的状态（等待、百分比、完成、失败）。
- `import-retry-remove` 失败行「重试」，每行「移除」；回调带 id，移除后焦点接给相邻行。
- `import-sources` 「上传 / 粘贴 / 链接」三个来源页签；粘贴与链接是回调，链接只认 http(s)。
- `template-search` 模板树的搜索：按标题过滤、命中的字高亮、命中的分支展开、Esc 清空。
- `template-tree-keys` 树的键盘：↑↓ 走、→ 展开、← 收起、Enter 选中。
- `template-edit` 标题与正文就地编辑：正文 ⌘/Ctrl+Enter 保存、Esc 取消；内置模板只读；输入法组字时不误触。
- `template-actions` 复制（写剪贴板）、复制为我的模板、使用模板（回调带 id）。

## How to get to it (user POV)

- 日历事件点：文档站「表单控件 → DateTimeInput 日期时间框」（`#/date-time-input`）最后一行「事件点与洞察（示例数据）」，点日历按钮；另三处在 `#/calendar`、`#/date-range-picker`、`#/trading-date-picker` 各自页上同名的一行。
- 资料导入：「表单控件 → FileImport 资料导入」，`#/file-import`。
- 模板库：「表单控件 → TemplateLibrary 模板库」，`#/template-library`。

## Driving it with kui.mjs

前置：`$KUI doctor` 全 OK。三条流程各对应一页：`$KUI drive calendar-events`、`drive file-import`、`drive template-library`。示例数据是编的（日历事件落在 2026-11，资料与模板是示例文字）。

- **日历事件点（`calendar-events`）。** 点「选回放起点的日期」→ 11 月有 5 个带 `data-has-events` 的格子，脚上 `.k-cal-insight` 写「已避开 11-27 美股半日市」→ 11-20 格子有两个点、`aria-describedby` 指到的节点读「期权到期和600519 除权」→ 悬停 11-27，读数行 `.k-cal-readout` 写「美股半日市」，移开回到选中日的事 → 键盘在日历里右移到 11-25，读数行跟到「000001 除权」→ 第二行「截止」的日历没有点与脚。证据：`calendar-events.aria.yml`。
- **资料导入（`file-import`）。** 4 行（62% 上传中带 `role=progressbar`、完成、失败带原因 `role=alert`、等待中）→ `setInputFiles` 选两个文件，两行同时上传中，「进度 +25%」两行同到 25% → 失败行点「重试 backtest_result.parquet」，日志「重试 r3」且行回到上传中 → 点「移除 factors_2026.csv」，行消失、日志「移除 r2」、焦点落在相邻一行 → 粘贴页签填字、Ctrl+Enter，日志「粘贴了 10 个字」且框清空 → 链接页签填 `ftp://…` 回车，框 `aria-invalid`、`role=alert` 写原因；填 https 链接回车，日志带链接。证据：`file-import.aria.yml`。
- **模板库（`template-library`）。** 默认选中「动量策略」→ 搜「周频」树剩 3 行、`mark` 是「周频」、`role=status` 播「1 个模板匹配」→ 搜「zzz」写「没有匹配的模板」，Esc 清空 → 在「动量策略」行 → 展开、← 收起 → 选「均值回归」（内置）正文没有可点的按钮 → 回「动量策略」点正文，改字后 Esc，字退回 → 再改，Ctrl+Enter，日志「保存 my-momentum：正文」→ 点「使用模板」「复制为我的模板」，日志带 id。证据：`template-library.aria.yml`。
- 输入法组字时 Enter / Esc / ⌘↵ 不误触：Playwright 的按键发不出组字态，要在页上手动用中文输入法试，或看 `e2e/research-calendar.spec.ts` 里用 `isComposing: true, keyCode: 229` 派发的断言；`drive` 流程里没走这一条，报告里写明。

## Gotchas

- 事件点是格子里的绝对定位小点，不改格子尺寸；要找带事件的格子用 `[data-has-events]`，不要按点的颜色找。
- 格子的 `aria-describedby` 是挂载后设到格子上的（CalendarCell 不转发它），读得到要等弹层画出来。
- 页签上鼠标停着时是悬停态，对比度会低于静止态：量对比度前把鼠标移开。
- 复制按钮写系统剪贴板，无头浏览器里要 `grantPermissions(['clipboard-read','clipboard-write'])` 才读得回来；`drive` 里只断言回调，不读剪贴板。
- 这三页的示例回调都写进页上的 `[data-gallery-import-log]` / `[data-gallery-template-log]`，是读结果的第二个地方。
