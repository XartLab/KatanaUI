# 命令面板：行内说明与多步命令

命令面板（CommandPalette）里的行可以带灰色说明与「2 步」这类徽标；带徽标的命令选中后面板不关，进步骤页：头部一句话写命令名和已做的选择，页上是多选清单（全选三态），脚栏写「已选 N 项」与「返回」「主操作」。走完最后一步，面板关、回执写在页上、焦点回到触发钮。交互借 Jamie Merrill 的 Command menu（XartLab/katanaui#194），样子是我们自己的。

## Sub-features

- `row-description` 行带灰色说明（「重置图表」后面的「回到默认缩放与指标」）。
- `steps-badge` 多步命令的行带「2 步」徽标。
- `steps-enter` ↑↓ 走到那一行按 Enter：进第一步页，面板不关，焦点在筛选框。
- `steps-select` 勾选写进头部句子的小标签和脚栏的「已选 N 项」；全选行三态（`aria-checked` 为 `true` / `mixed` / `false`）；没选时「下一步」禁用。
- `steps-filter` 筛选框过滤当前步的选项；Enter 勾选高亮的行；Ctrl+Enter 走主操作。
- `steps-back` 输入为空按 Backspace 或点「返回」：退一步；第一步退回命令列表，选择清空。
- `steps-run` 最后一步点「导出」：面板关，回执里有各步的选择，焦点回触发钮；Esc 在步骤页里直接关面板。

## How to get to it (user POV)

- 文档站左侧目录「浮层」一组：`CommandPalette 命令面板（带最近）`，地址 `#/command-palette`。
- 页上「命令面板」钮，或在页上按 Ctrl+K（这一页上它盖过目录搜索）打开。
- 「数据」一组的「批量导出」是演示的多步命令：第一步「选择市场」（美股、港股、A 股、加密），第二步「选择字段」（开高低收、成交量、市盈率、技术评级）。

## Driving it with kui.mjs

前置：`$KUI doctor` 全 OK。面板在页面根部的 portal 里，用 `page.getByRole('dialog', { name: '命令面板' })` 找。

- **开面板。** 点 `section.getByRole('button', { name: /命令面板/ })`。「批量导出」行（`getByRole('option', { name: /批量导出/ })`）含「按市场与字段导出」，`[data-slot="command-meta"]` 文字是「2 步」。
- **进第一步。** 按 `ArrowDown` 直到该行 `aria-selected="true"`（cmdk 的高亮），按 Enter。`[data-slot="command-steps"]` 的 `data-step` 是 `market`，面板仍可见，焦点在筛选框。
- **勾两项。** 点 `getByRole('checkbox', { name: /^美股/ })`、`/^港股/`。`[data-slot="command-steps-tag"]` 文字是「美股」「港股」，`[data-slot="command-steps-count"]` 是「已选 2 项」，`getByRole('checkbox', { name: '全选' })` 的 `aria-checked` 是 `mixed`。
- **全选两下。** 点「全选」：全部 `aria-checked="true"`，「已选 4 项」；再点：全 `false`，「已选 0 项」，`getByRole('button', { name: '下一步' })` 禁用。
- **Backspace 退回。** 勾一项后按 `Backspace`（筛选框为空）：`command-steps` 数量为 0，命令列表回来；再进「批量导出」，「已选 0 项」、头部没有标签。
- **走第二步。** 勾美股、港股，点「下一步」：`data-step` 是 `fields`。勾「开高低收」，头部标签依次是「美股」「港股」「开高低收」。
- **跑。** 点 `getByRole('button', { name: '导出' })`：面板消失，`getByTestId('palette-log')` 含 `batch-export：market=us,hk · fields=ohlc`，「命令面板」钮拿着焦点。
- **证据。** `$KUI drive command-palette`：七步七张截图，`palette-list.aria.yml`、`steps-two-checked.aria.yml` 是命令列表与步骤页的 ARIA 快照。

## Gotchas

- 行是 cmdk 的 option，`aria-selected` 是高亮、不是已选；步骤页的清单行是 `role=checkbox`，已选只看 `aria-checked`。
- 清单行的名字是「主文字加说明」连在一起（「美股312 个品种」），用 `{ name: /^美股/ }` 匹配，别写 `exact`。
- 筛选框在步骤页里是普通文本框（名字「搜索命令…」），不是 combobox；命令列表里的那个才是 `combobox`。
- 页上有 `localStorage` 存的「最近」：流程每次是新上下文所以是空的；手走时「批量导出」跑过一次就会出现在「最近」里，`getByRole('option', { name: /批量导出/ })` 会匹配到两行，加 `.first()`。
- 面板有入场动画：断言用会等待的 `expect(...)`，不要开完立刻量。
- `e2e/hotkeys.spec.ts` 里「Ctrl+K 打开……」那条原来就找不到目录搜索框（`searchbox` 角色），与这个功能无关。
