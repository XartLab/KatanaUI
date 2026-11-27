# 投研件：财务报表表、同业对比表、估值带、文档阅读器

用户在财务报表表里折叠科目、切原值 / 同比 / 环比，看更正过的格；在同业对比表里切指标组、按列排序时本公司不动；在估值带上扫读价格与各档位价位、打开表格视图。

## Sub-features

- `st-collapse` 点「期间费用」前的折叠钮：子科目消失，钮的 `aria-expanded` 变 `false`；再点回来。
- `st-mode` 点「同比」：格里变成带符号的百分比，`figure[data-slot="statement-table"]` 的 `data-mode="yoy"`。
- `st-revised` 2026 Q1 营业收入格右上有更正小点，读屏名写「第 2 版披露 · 2026-05-20 更正公告」。
- `cp-groups` 点页签「增长」：列换成营收同比、EPS 同比；页签 `aria-selected` 跟着变。
- `cp-subject` 按 PE 列排序（升、降）：第一行始终是 ALFA（写「本公司」）。
- `vb-scrub` 在估值带上按 → 扫读：LCD 读数列出价格、PE 与五档价位。
- `vb-table` 点「表格视图」：图换成表，表头是日期、价格、PE 与五档。
- `doc-find` 在文档阅读器查找框输入「资本开支」：计数「1 / 3」，Enter 到下一个，当前块左侧竖线。
- `doc-toc` 点目录「第三节 重大合同」：正文滚到那一节。
- `doc-cite` 悬停一段点引用钮：演示下方写「已引用：kref:doc/demo#<块 id>」。

## How to get to it (user POV)

- 文档站左侧目录「量化」下的「StatementTable 财务报表表」（`#/statement-table`）、「CompsTable 同业对比表」（`#/comps-table`）、「ValuationBand 估值带」（`#/valuation-band`）；「积木」下的「DocReader 文档阅读器」（`#/doc-reader`，收到 `[data-gallery-doc="main"]`）。
- 每页一个演示，收到 `[data-gallery-statement="main"]`、`[data-gallery-comps="main"]`、`[data-gallery-band="main"]`。

## Driving it with kui.mjs

前置：`$KUI doctor` 全 OK；新的浏览器上下文。还没有流程（手走）。

- **折叠。** `getByRole('button', { name: '收起 期间费用' }).click()` → 行里不再有「销售费用」，钮的名字变「展开 期间费用」。
- **同比。** `getByRole('radio', { name: '同比' }).click()`（ToggleGroup 的项是 radio）→ `data-mode="yoy"`，有 `data-tone="up"` 或 `"down"` 的格。
- **更正标记。** `[data-slot="statement-revised"]` 恰好一个，`aria-label` 含「第 2 版」。
- **指标组。** `getByRole('tab', { name: '增长' }).click()` → 列头有「营收同比」，没有「PE」。
- **本公司置顶。** 「估值」组下点 PE 列头的排序钮两次 → 两次第一行都是 ALFA，行上 `data-subject="true"`。
- **扫读。** 聚焦 `getByRole('group', { name: '示例：估值带' })`，按 → → LCD 出现，含「价格」「PE」「P50」。
- **表格视图。** 点「表格视图」→ `[data-slot="valuation-band-table"]` 出现。
- **证据。** 手走时每步截图，附提交号。

## Gotchas

- 同比要往前 4 列才有可比期：最早四个季度的同比是「—」，不是错。
- 同业表的底色是相对中位数的好坏，「净负债率」没写方向，不着色是对的。
- 估值带中间一段 PE 为负（演示的亏损期），那一段带线断开、价格线照画。
