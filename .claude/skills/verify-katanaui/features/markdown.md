# Markdown 安全正文

模型写的回话和帮助文档的正文照 Markdown 排版：粗体、列表、表格、行内代码照常画，引用小标画在占位符的位置。会把数据带出去的东西被拦下：模型写的 HTML 原样当字、图片不取只写「[图片：说明]」、外链只认 http(s) 并在新标签页打开。文档模式下标题带锚点，认得的相对链接点了交给页面、不跳页，不认得的只留文字。

## Sub-features

- `md-render` 回话：`结论` 是粗体，两条列表项里各画一个引用小标（「财新 1」「上交所 2」），三行的表格，行内代码 `katana quote 600519`。
- `md-block-html` 模型写的 `<script>…</script>` 原样显示成一行字，正文里没有 `script` 元素。
- `md-block-image` 图片只写 `[图片：日线截图]`，正文里没有 `img`，页面也没去取那张图。
- `md-external-link` 外链「上交所披露」：`href` 是原样的 https 地址，`target="_blank"`、`rel="noopener noreferrer"`。
- `md-doc-anchor` 文档模式：标题带 `data-anchor`（GitHub 的规则：`快速上手`、`下单-f9`）。
- `md-doc-link` 文档模式：认得的相对链接「设置」写成站内链接，点了回显 `点了：settings.md`、地址不变；不认得的「开发者文档」不是链接、只留字。

## How to get to it (user POV)

- 文档站左侧目录「AI → Markdown 安全正文」，地址 `#/markdown`。
- 预览区两块：「回话 + 角标槽」（`[data-gallery-markdown="reply"]`）和「帮助文档」（`[data-gallery-markdown="doc"]`，下面一行回显 `点了：…`）。

## Driving it with kui.mjs

前置：`$KUI doctor` 全 OK。正文根是两块里各自的 `[data-slot="markdown"]`，流程里叫 `reply` 和 `doc`。

- **回话排版。** 打开页。`reply.locator('strong')` 第一个写 `结论`；第一个列表 2 个 `listitem`，第 1 项里有 `button「财新 1」`、第 2 项里有 `button「上交所 2」`；`reply.getByRole('table')` 3 行，表头 `指标 今日 5 日`，有一格 `-3.2 亿`；`reply.locator('code')` 写 `katana quote 600519`。
- **HTML 与图片被拦。** `reply.getByText("<script>alert('模型写的 HTML 只当字')</script>", { exact: true })` 可见；`reply.locator('script')`、`reply.locator('img')` 都是 0 个；`[图片：日线截图]` 可见；`performance.getEntriesByType('resource')` 里没有 `example.com/chart.png`。
- **外链。** `reply.getByRole('link', { name: '上交所披露' })`：`href="https://www.sse.com.cn"`、`target="_blank"`、`rel="noopener noreferrer"`。只读属性，不点（点了会开新标签页出站）。
- **文档锚点与链接。** `doc` 里 `heading` 1 级「快速上手」`data-anchor="快速上手"`、2 级「下单 F9」`data-anchor="下单-f9"`；`link「设置」` 的 `href="#"`、`data-target="settings.md"`；`getByRole('link', { name: '开发者文档' })` 是 0 个，字还在。
- **点相对链接。** 回显先是 `点了：（还没点）`；点「设置」：回显 `点了：settings.md`，`page.url()` 跟点之前一样。
- **证据。** `$KUI drive markdown`：五步五张截图，`markdown-reply.aria.yml`、`markdown-doc.aria.yml` 是两块正文的 ARIA 快照。

## Gotchas

- 演示里只有 `<script>` 和一张 `https://example.com/chart.png` 的图这两样危险内容，没有 `javascript:`、`data:` 链接；要验那两种得改演示文本或看单测 `src/ai/markdown.test.tsx`，`drive` 走不到。
- `<script>` 那段在 ARIA 快照里是一段 `paragraph`，看上去像标签，其实是字：断言用「没有 `script` 元素」，不要只看快照文字。
- 引用小标是 portal 进占位符的，正文 HTML 换了才重新挂：断言等 `toBeVisible()`，不要在打开页的同一刻数按钮。
- 页上有两个 1 级标题（页标题「Markdown 安全正文」和文档里的「快速上手」），按名字找，或先收到 `doc`。
