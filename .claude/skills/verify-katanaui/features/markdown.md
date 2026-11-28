# Markdown 安全正文

模型写的话（回话）与帮助文档两段。回话里粗体、列表、表格、行内代码照常画；HTML 不执行、原样当字；图片不画，只写「[图片：说明]」，地址不出现在页上；链接只认 `http(s)`，在新标签页打开、不带来源；`markdownSlot(n)` 的位置画出调用方给的节点（这里是引用小标）。帮助文档多三样：标题带 `data-anchor`，认得的相对链接写成 `href="#"` + `data-target`（点了交给 `onOpenLink`，不跳页），不认得的只留文字。

## Sub-features

- `md-render` 粗体、列表、表格、行内代码照常画。
- `md-slot` 占位符 `markdownSlot(n)` 的位置画 `slots[n]`；序号超出槽数的当没有。
- `md-no-html` HTML 不渲染：`script` 成了字，页上没有 `script` / `img` 元素。
- `md-image` 图片只写说明：`.k-md-image` 写 `[图片：日线截图]`，图片地址不出现在页上。
- `md-link` 外链只认 `http(s)`：`target="_blank"`、`rel="noopener noreferrer"`；`javascript:` 与站内相对路径不写成链接。
- `md-doc` 文档模式：标题带锚点；认得的相对链接点了交给 `onOpenLink` 不跳页，不认得的只留文字。

## How to get to it (user POV)

- 文档站左侧目录「AI → Markdown 安全正文」，地址 `#/markdown`。
- 页上两段：`[data-gallery-markdown="reply"]`（「回话 + 角标槽」）与 `[data-gallery-markdown="doc"]`（「帮助文档」，下面一行回显「点了：…」）。
- 回话演示文本里有：两条列表（各带一个角标槽）、一张指标表、`katana quote 600519`、[上交所披露](https://www.sse.com.cn)、一张日线截图、一段 `<script>`。

## Driving it with kui.mjs

前置：`$KUI doctor` 全 OK。每段的根是 `[data-slot="markdown"]`（内容用 `innerHTML` 写进去），回话是 `[data-gallery-markdown="reply"]`，文档是 `[data-gallery-markdown="doc"]`。

- **回话渲染。** `[data-slot="markdown"]` 里第一个 `strong` 写「结论」；`li` 两条；`table` 里有「涨跌幅」；第一个 `code` 写 `katana quote 600519`。
- **角标槽。** `.k-md-slot` 两个，每个里面各有一个 `[data-slot="web-search-citation"]`（小标写站名与序号）。
- **HTML 当字。** 回话里 `script` 数量为 0、`img` 数量为 0，`innerText` 里有 `<script>alert('模型写的 HTML 只当字')</script>` 这一句字。
- **图片只写说明。** `.k-md-image` 写 `[图片：日线截图]`；回话的 `innerText` 里没有 `example.com`。
- **外链。** 回话里「上交所披露」的 `href` 是 `https://www.sse.com.cn`，`target="_blank"`，`rel="noopener noreferrer"`。
- **文档模式。** `h1[data-anchor="快速上手"]`、`h2[data-anchor="下单-f9"]` 各一个；「设置」的链接带 `data-target="settings.md"`。
- **点相对链接。** 点「设置」：回显写「点了：settings.md」，`page.url()` 与点之前一致（不跳页）。
- **不认得的链接。** 「开发者文档」不是链接（`getByRole('link')` 找不到），页上只剩文字；文档里 `a` 只有一个。
- **证据。** `$KUI drive markdown`：八步八张截图，`markdown-reply.aria.yml` 与 `markdown-doc.aria.yml` 是两段的 ARIA 快照。

## Gotchas

- 演示文本写死在 `gallery/pages/ai.tsx`（`MD_REPLY` / `MD_DOC`）：要验别的写法先改演示再走流程，不要在这份地图上写成「当前页没有这条」。
- 回话演示是两条列表、两个角标槽（`markdownSlot(0)`、`markdownSlot(1)`），不是三条一个。
- `[图片：日线截图]` 来自 `labels.image` 的默认文案，调用方可以换（比如英文包）：断言跟演示的文案走，别写成组件的固定输出。
- 点认得的相对链接后地址栏不变（`href="#"`）：断言「没跳页」用前后 `page.url()` 一致，不要用 `expect(page).toHaveURL(...)`。
- 文档模式的锚点走 GitHub 规则（`github-slugger`）：中文标题的锚点就是标题本身，重名才加 `-1`、`-2`。
- 页上还有别的 `data-slot="markdown"` 实例（同一页其它演示）：按 `[data-gallery-markdown="reply"|"doc"]` 收到具体那段再找。