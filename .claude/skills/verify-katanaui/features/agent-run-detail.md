# AgentRunDetail 运行详情与 AgentRunList 运行列表

一次 Agent 运行的详情：头上返回钮、运行名与一颗随状态变的动作钮；大号百分比加 40 根竖短刻度的进度条，下面一行时间；阻塞时进度条下出 warn 色的问题卡与「确认」；完成时出「接着跑」建议动作；「详情」键值对与「步骤」两组可用键盘收起展开。列表侧 AgentRunList 一行一个运行，点开看详情。

## Sub-features

- `run-states` 五种状态（在跑、阻塞、完成，加暂停、失败）：刻度颜色、时间行、右上动作钮都跟着变（在跑「暂停」、暂停「继续」、阻塞「取消」、完成与失败「再跑一次」）。
- `run-progress` 进度条是 `role=progressbar`，`aria-valuenow` 是整数百分比，40 根刻度全 `aria-hidden`；在跑时第一根暗刻度是亮白的「当前刻度」。
- `run-question` 阻塞时的问题卡：标题、一句说明、「确认」；点确认走回调（演示里运行放行变在跑，问题卡消失）。
- `run-next` 完成后的「接着跑」：每个建议是一颗钮（图标 + 名字 | 预估时长），点它回调带它的 id。
- `run-sections` 「接着跑 / 详情 / 步骤」标题是按钮，`aria-expanded`，Enter / Space 收起展开；收起的内容 `hidden="until-found"`。
- `run-steps` 步骤每行：状态图标（勾、转圈、空圈、警示、叉）、名字、右边耗时或状态字；在跑与阻塞的那步 `aria-current="step"`，阻塞那步名字 warn 色。
- `run-list` 运行列表：一行写名字、副标题、状态字（灯加词）、相对时间、箭头；点行或 Tab 到行上按 Enter 打开，选中的行 `aria-current="true"`。

## How to get to it (user POV)

- 文档站左侧目录「AI → AgentRunDetail Agent 单次运行详情」，地址 `#/agent-run-detail`。页上依次是「可点：阻塞 → 确认 → 在跑」（`[data-gallery-ard="main"]`）、「在跑」（`running`）、「完成」（`done`，下面一行 `[data-gallery-ard="picked"]` 写选了哪个建议）、「暂停与失败」（`paused`、`failed`，详情一开始是收起的）。
- 文档站左侧目录「AI → AgentRunList Agent 运行列表」，地址 `#/agent-run-list`：两组共五行，默认选中「接入新数据源」，下面一行 `[data-gallery-arl="opened"]` 写已打开哪个。

## Driving it with kui.mjs

前置：`$KUI doctor` 全 OK。每份演示收到 `section.locator('[data-gallery-ard="<名>"]')`；页上不止一份，别用整页的角色查询。

- **在跑。** `running`：进度条 `getByRole('progressbar', { name: '运行进度' })` 的 `aria-valuenow="62"`、`aria-valuetext="62%，在跑"`（百分比向下取整，没跑完最多 99%），`[data-tick="lit"]` 24 根、`[data-tick="current"]` 1 根；`[data-slot="run-time"]` 写「已用 6 分 12 秒」「约剩 4 分钟」；右上按钮名「暂停」；没有 `[data-slot="run-question"]`。
- **阻塞。** `main` 的初始状态：`aria-valuenow="76"`，没有当前刻度；时间行只写「阻塞于 58 分钟前」；状态词「要你确认」；问题卡含「示例源 B 缺少访问密钥」；右上「取消」是 danger 样式（`data-variant="danger"`），「确认」的无障碍描述是问题的标题加说明。
- **完成。** `done`：`aria-valuenow="100"`，40 根全亮；时间行「用时 3 分 17 秒」；右上「再跑一次」；`[data-slot="run-next"] button` 两个，名字「发送报告给研究组」「30 天后再回补一次」，右侧写「约 2 分钟」「约 1 分钟」。
- **确认。** `main.getByRole('button', { name: '确认' }).click()`。状态词变「在跑」，问题卡消失，当前刻度出现，右上变「暂停」；再点「暂停」变「已暂停」、右上「继续」，再点「继续」回到「在跑」。
- **接着跑。** `done` 里点 `button[data-id="send"]`：`picked` 写「选了：发送报告给研究组」；点 `data-id="schedule"` 写「选了：30 天后再回补一次」。点右上「再跑一次」写「选了：再跑一次」。
- **键盘收起。** `running` 的 `getByRole('button', { name: '详情', exact: true })` 先 `focus()`，按 Enter：`aria-expanded="false"`，`.k-ard-panel` 的 `hidden` 是 `until-found`；按 Space：`aria-expanded="true"`，没有 `hidden`。「步骤」同样。
- **标题层级。** 默认运行名是 `h2`（`getByRole('heading', { level: 2 })`），分组标题与问题标题是 `h3`；列表标题 `h2`、分组标题 `h3`。调用方传 `headingLevel` 改。
- **一开始收起。** `paused`、`failed` 两份的「详情」`aria-expanded="false"`。
- **步骤。** `running` 的五步：第一步右边「46 秒」，第三步 `aria-current="step"`、右边「在跑」、图标有 `.k-status-spin`，第四步右边空、没有图标。`failed` 里 `li[data-status="failed"]` 右边「失败」。
- **列表。** `#/agent-run-list`：`[data-slot="run-row"]` 五个；`data-id="source-b"` 的 `aria-current="true"`，读屏名「接入新数据源, 示例源 B · 日线, 要你确认, 1 小时前阻塞」；点 `data-id="review"`，它选中、`opened` 写「已打开：复核回补结果」；`Tab` 到下一行按 Enter 打开它（「已打开：重算动量因子」）。
- **证据。** `$KUI drive agent-run-detail`：六步六张截图，`agent-run-progress.aria.yml` 是在跑那份进度条的 ARIA 快照。列表那页还没有流程，照上一条手走。

## Gotchas

- 页上有五份运行详情，`getByRole('button', { name: '暂停' })` 在整页会撞上多份；一定先收到某一份。
- 刻度是装饰：不要数 `getByRole`，数 `[data-tick]`；`lit` 的根数是进度向下取整（62% × 40 = 24.8 → 24）。
- 「可点那份」（`main`）刷新回到阻塞；它的状态只活在这一页的内存里。
- 收起用 `hidden="until-found"`：元素还在 DOM 里、`toBeVisible()` 是假；断言收起看 `aria-expanded` 与 `hidden` 属性，不要 `toHaveCount(0)`。
- 演示文字是中文，数是手写的示例；时间由演示给，不会随真实时间走。
