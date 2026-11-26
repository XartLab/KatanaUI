# 加载状态：Loading 的最短停留与 Button 进行中

两件事，都是「等」：整块内容等数据时，骨架出了至少留 500ms，不一闪而过；一个按钮等一次请求时，满 300ms 才在原地出转圈、出了至少留 500ms，按钮的字与宽度不变，期间再按无效。

## Sub-features

- `loading-min-shown` `#/loading` 页「等数据」行：骨架出现（约 500ms）后至少留 500ms。骨架刚出 10ms 数据就到，骨架仍留到出现后满 500ms 才换成内容；500ms 内到的数据不出骨架，内容直接出现（#251，kubai 017）。
- `button-pending` `#/button` 页「进行中（pending）」行：点「保存修改」，满 300ms 才出小环；字与宽度不变；进行中再按（点、Enter、空格）无效，焦点仍在按钮上；请求完成转圈已留够就收，`aria-busy` 摘掉。
- `button-pending-min` 「快速保存」（0.4 秒请求）：转圈 300ms 出，请求 400ms 结束，转圈留到 800ms 才收。
- `button-spin-icon` 「刷新」图标钮（0.3 秒请求）：按下立刻转图标本身，没有另外的转圈；请求结束后转到整圈（640ms）才停。

## How to get to it (user POV)

- 文档站「反馈 → Loading 加载态」`#/loading`，「等数据」那一行有按钮「数据到了」（点过变「重新等」）。
- 文档站「表单 → Button 按钮」`#/button`，页中「进行中（pending）」一行有三个钮：「保存修改」「快速保存」和图标钮「刷新」，旁边有「触发次数」读数（数的是真正触发了点击的次数）。

## Driving it with kui.mjs

还没有流程脚本（手走）。前置：`$KUI doctor` 全 OK。时间边界差几十毫秒，用 Playwright 的 `page.clock`（`install({ time: 0 })`、开页、`pauseAt(60_000)`、`runFor(n)`）推时间；e2e 里就是这样写的，照抄。

- **骨架留够。** 开 `#/loading`；点「数据到了」，再点「重新等」（从这一刻重新计时）。`runFor(510)`：「等数据」那一行里 `.k-loading-line` 出现。点「数据到了」：骨架还在、`[data-gallery-loaded]` 还没有；`runFor(489)` 仍是这样；再 `runFor(1)`：内容「数据到了。」出现、骨架没了。
- **快的数据不出骨架。** 再点「重新等」，`runFor(400)`，点「数据到了」：内容立刻出现，全程 `.k-loading-line` 数量为 0。
- **按钮转圈。** 开 `#/button`，量 `[data-gallery-pending="save"]` 的宽度（`boundingBox().width`）。点它：`aria-busy="true"`、`aria-disabled="true"`，读数「保存 1」。`runFor(299)`：`[data-slot="button-spinner"]` 数量 0；`runFor(1)`：数量 1；字仍是「保存修改」，宽度与点之前一样。
- **再按无效。** 转圈出来后点（`click({ force: true })`）、聚焦后按 Enter 与空格：读数仍是「保存 1」，焦点仍在按钮上，没有 `disabled` 属性。`runFor(900)`：转圈没了、`aria-busy` 摘掉、宽度不变；再点一次读数变「保存 2」。
- **转圈留够。** 点「快速保存」，`runFor(300)` 出转圈，`runFor(100)`（请求已结束）转圈还在，再 `runFor(399)` 还在，`runFor(1)` 没了。
- **转自己的图标。** 点「刷新」：`data-spinning="true"` 立刻出现，里面没有 `button-spinner`；`runFor(639)`（含请求结束）仍转，`runFor(2)` 之后 `data-spinning` 没了。
- **证据。** 每步截图加量到的宽度数值、转圈出现与消失的时刻（假时钟下的毫秒）、读数变化。

## Gotchas

- 一定要推假时钟：真时间下 300ms、500ms 的边界在忙的机器上量不准。
- 转圈是绝对定位的小环，在按钮左内边距里（图标按钮居中），不进文字排版：量宽度要在转圈出现之后量才算数。
- 进行中的按钮是 `aria-disabled` 不是 `disabled`：Playwright 的 `click()` 会把它当成不可点而等到超时，要 `{ force: true }`；这正是「仍可聚焦」的样子。
- Suspense 模式的 Loading 没有最短停留（React 自己摘骨架），`#/loading` 页上只有「等数据」那一行是 pending 模式。
