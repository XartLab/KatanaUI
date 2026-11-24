# Omnibox 万能框

品种、策略、命令、页面、插件和「问 AI」在一个入口里：点按钮打开对话框，空查询按类列出几条并带页签计数；打品种名选中后它变成输入框里的标签、结果换成对它能做的事；打成问句时结果收起、回车去问；高亮行行尾写回车动作、右侧浮出预览卡，按住 Ctrl 回车是「新标签」。

## Sub-features

- `omnibox-tabs` 空查询按类列出几条；页签带条数；Tab / Shift+Tab 切页签（焦点留在输入框）；输入框为空时 ← → 也切；「显示全部 N」切到那一类。
- `omnibox-recent` 选过的命令、页面、对象再开时在「最近」里；「清除」清空它。
- `omnibox-scope` 打 AAPL 回车：输入框里出标签，结果是对它的动作，页签收起；空输入退格或点 × 删标签回全局；选动作时回调带着那个对象。
- `omnibox-ask` 输入像问句（问号结尾、中文疑问词句中任意位置、英文疑问词开头、「吗 / 呢」收尾）：结果收起，右侧提示变「问」，回车调 onAsk（带作用域）；只是够长的（长品种名）要等搜索确实没有结果才收起。问句搜出了结果时多一个「改为搜索」（或按 ↓）；什么都没搜到时回车也去问。
- `omnibox-hint` 高亮行行尾是回车动作（对象「查看选项」、命令「运行」、页面「打开」），按住 Ctrl / ⌘ 变「新标签打开」；Ctrl / ⌘ + 回车回调带「新标签」。
- `omnibox-preview` 高亮品种行停约 140ms 后，面板右侧浮出预览卡；换到命令行就收。
- `omnibox-slide` 指针在行间移动，高亮底色平滑滑过去。
- `omnibox-a11y` 作用域下焦点在 × 上按 Enter / 空格是删标签；换页签与结果个数在 role=status 里播报；标签文字挂在输入框描述上；嵌在页里的面板 Tab 到头能走出输入框；问句模式输入框 aria-expanded=false。
- `omnibox-ime` 输入法组字中，回车、Esc、退格、问句切换都不触发。

## How to get to it (user POV)

- 文档站左侧目录「浮层 → Omnibox 万能框」，地址 `#/omnibox`。页上「示例」里的按钮「打开万能框」弹出对话框（页下方「用法」里还有一个摆在页里的面板，不是这条流程要走的）。
- 键盘：焦点在按钮上按 Enter 打开；对话框里 Esc 关，焦点回到按钮。

## Driving it with kui.mjs

前置：`$KUI doctor` 全 OK。对话框在 portal 里：用 `page.getByRole('dialog', { name: '万能框' })`，不要在 `section` 里找。页签是 `getByRole('tab')`，行是 `getByRole('option')`。

- **打开。** `section.getByTestId('omnibox-open').click()`。对话框可见，焦点在 combobox，页签是 `全部 19 / 品种 7 / 策略 2 / 命令 4 / 页面 3 / 插件 3`，分组标题依次品种、策略、命令、页面、插件；盖在输入框上的示例是「AAPL 期权链」（每 2.8 秒换一条）。
- **Tab 切页签。** 按 `Tab`。`品种` 页签 `aria-selected="true"`，焦点仍在输入框，行数 6。
- **品种、预览、提示。** `Shift+Tab` 回全部，打 `AAPL`。第一行 `data-omnibox-id="sym:AAPL"`，行尾「查看选项」，右侧预览卡里有 `189.84`。
- **变成标签。** 回车。`[data-slot="omnibox-scope"]` 里是 AAPL，输入框为空，行依次是开图、下单草稿、看新闻、看期权链、加入自选，页签数量为 0。
- **退格。** 再按 `Backspace`。标签数 0，页签回到 6 个。
- **问句。** 打 `下周哪些持仓有财报？`。`[data-slot="omnibox-ask"]` 写「问」，`.k-omnibox-body-inner` 带 `inert`，面板高度 < 60。
- **提问。** 回车。页上 `omnibox-asked` 变成「提问：下周哪些持仓有财报？」，对话框关上。
- **新标签。** 再开，`hover` 到「AMD」行，行尾「查看选项」；`Control` 按下后变「新标签打开」；按住时回车。对话框关上，`omnibox-log` 是「选择：AMD（新标签）」。
- **证据。** `$KUI drive omnibox`：八步八张截图，`omnibox-open.aria.yml`、`omnibox-scope.aria.yml` 是打开态与标签态的 ARIA 快照。

「最近」「显示全部」「← → 切页签」「点 ×」「改为搜索」「输入法」这几条流程里没走，由 `e2e/omnibox.spec.ts` 覆盖；验收要走它们时手走或跑 `$KUI e2e e2e/omnibox.spec.ts`，在报告里写明。

## Gotchas

- 搜索故意延迟约 200ms（演示里 120ms 加 80ms 去抖）：回车按得比结果快时，组件把回车记着、结果一到对第一行生效，不会对着旧行动手；流程里先 `expect` 行出现再动手。
- 页上有两个万能框（示例里的对话框、用法里摆在页里的面板）：行与页签一律在 `dialog` 里找，不要用 `page.getByRole('option')`。
- 预览卡要面板一侧有 280px 空位（宽 640 的面板，视口至少约 1200 宽）：放不下它就不出，默认视口 1100 看不到；流程开头把视口设成 1400。预览卡 140ms 后才出，用会等待的 `expect(...).toContainText(...)`，不要立刻量。
- 无头 Chrome 里「按住 Control」用 `page.keyboard.down('Control')`，行尾提示靠 keydown 事件更新，要先按住再 `expect`。
- 输入法组字用真输入法驱动不了：e2e 里是手发 `compositionstart` 与 `isComposing: true` 的键盘事件，流程里不走。
