# 弹出层

点触发钮打开一块浮层：Popover 是不打断的说明浮层，Dialog 是要裁决的模态框。用户按 Esc、点外面（Popover）或点「取消」（Dialog）把它关上，焦点回到打开它的那个钮。Popover 开着时，页面或装着它触发钮的容器一滚，它就关上，不会跟着触发钮滚出屏幕还开着；不相干的容器滚不关。

## Sub-features

- `popover-open` 点「弹层」或焦点在钮上按 Enter：浮层出现，钮的 `aria-expanded` 变 `true`，焦点进到浮层里。
- `popover-esc` 按 Esc：浮层消失，焦点回到「弹层」钮。
- `popover-outside` 点浮层外的空白：浮层消失。
- `dialog-open` 点「对话框」：模态框「恢复默认布局」出现，焦点落在第一个钮「取消」上。
- `dialog-esc` 按 Esc：模态框关上，焦点回到「对话框」钮。
- `dialog-cancel` 点「取消」：同样关上。
- `popover-scroll-close` Popover 开着时滚页面，或滚装着触发钮的容器：浮层关上；滚一个不装触发钮的容器：浮层不关（#125，修在 #135）。

## How to get to it (user POV)

- 文档站左侧目录「浮层」一组：`Popover 弹层`（`#/popover`）、`Dialog 对话框`（`#/dialog`）。
- 键盘：Tab 到触发钮，Enter 或空格打开，Esc 关。
- 滚动即关：`#/popover` 页在 1500 高的视口里滚不动，走 `积木 → NewsFeed 新闻流`（`#/news-feed`）。那页「News panel」里的新闻流在页面里，下面「宽 1000px」那张装在一个能横向滚的外框（`data-testid="news-split"`）里；两张的过滤条上都有「市场」，点它开一个 Popover。

## Driving it with kui.mjs

前置：`$KUI doctor` 全 OK。流程从 `#/popover` 开始，中途点目录换到 `#/dialog`，最后换到 `#/news-feed`。

- **开弹层。** `section.getByRole('button', { name: '弹层', exact: true }).click()`。`[data-slot="popover-content"]` 可见，标题「取数口径」，钮 `aria-expanded="true"`，焦点在浮层里。
- **Esc 关弹层。** `page.keyboard.press('Escape')`。`popover-content` 数量为 0，钮 `aria-expanded="false"`，焦点在「弹层」钮上。
- **键盘开。** 焦点仍在钮上，按 Enter。浮层又出现。
- **点外面关。** 在触发钮右边 300px 处点一下（`page.mouse.click`，那里是空白）。浮层消失。
- **换到对话框页。** `page.getByRole('navigation', { name: '文档目录' }).locator('a.k-sidenav-link[href="#/dialog"]').click()`，等 `[data-gallery="dialog"]`。
- **开对话框。** 点 `getByRole('button', { name: '对话框', exact: true })`。`getByRole('dialog', { name: '恢复默认布局' })` 可见，页上只有这一个 dialog，焦点在「取消」上。
- **Esc 关对话框。** 按 Escape。dialog 数量为 0，焦点在「对话框」钮上。
- **取消关对话框。** 再开，点框里的「取消」。dialog 数量为 0，焦点回到「对话框」钮。
- **确认对话框（#238）。** 换到 `#/alert-dialog`，点「平仓」（`exact: true`）。`getByRole('alertdialog', { name: '平掉 BTCUSDT 多单' })` 可见，焦点在「取消」上；点页面左上角（背板）对话框还在；按 Escape 关掉，页上「最后一次：还没选」不变，焦点回「平仓」钮。再开、点框里的「平仓」：关掉，页上写「最后一次：平仓」，确认钮字色是 `--k-actionable-negative-foreground`。「删除自选列表」开的是 sm，宽 320。
- **证据。** `$KUI drive overlays`：七步七张截图，`popover-open.aria.yml`、`dialog-open.aria.yml` 是打开时浮层与模态框的 ARIA 快照。
- **换到新闻流页，开「News panel」的「市场」。** 点目录 `a.k-sidenav-link[href="#/news-feed"]`；先 `hover()` 预览区开头那段「演示数据（标题与来源都是虚构的…」说明文字，再 `frame.getByRole('button', { name: '市场', exact: true }).evaluate((el) => el.click())`。`[data-slot="popover-content"][data-state="open"]` 1 个，钮 `aria-expanded="true"`。
- **滚页面关。** `page.mouse.wheel(0, 300)`。`window.scrollY` 变大，开着的浮层 0 个，钮 `aria-expanded="false"`。
- **滚不相干的容器不关。** `split.hover()`，再用 `el.click()` 开「News panel」的「市场」，`page.mouse.wheel(200, 0)`。`news-split` 的 `scrollLeft` 变大、`window.scrollY` 不变；等 300ms 浮层还在（1 个）。按 Escape 关掉。
- **滚装着锚点的容器关。** 鼠标还在外框上，用 `el.click()` 开「宽 1000px」那张的「市场」，等 300ms 仍开着；`page.mouse.wheel(-150, 0)`。`news-split` 的 `scrollLeft` 变小、`window.scrollY` 不变，开着的浮层 0 个，钮 `aria-expanded="false"`。
- **证据。** `$KUI drive overlays`：十一步十一张截图，`popover-open.aria.yml`、`dialog-open.aria.yml` 是打开时浮层与模态框的 ARIA 快照；第 9 到 11 步的「看到什么」里记了每次滚动前后的 `pageY` 与 `splitX`。

## Gotchas

- 浮层和模态框渲染在页面根部的 portal 里，不在 `[data-gallery]` 里面：用 `page.locator(...)` / `page.getByRole('dialog')` 找，不要在 `section` 里找。
- `#/dialog` 页上还有「代码开的对话框」等别的钮，名字要 `exact: true`，否则「对话框」会匹配到好几个。
- 浮层有入场动画（`kc-pop-in`）：断言可见性用会等待的 `expect(...).toBeVisible()`，不要开完立刻量尺寸。
- 验滚动即关时，打开浮层要用 `locator.evaluate((el) => el.click())`：文档站页头是 sticky 的，Playwright 的 `click` 被挡住时会自己再滚一次页面，这次滚动本身就会把浮层关掉，结果不算数。同理，鼠标要在开浮层之前 `hover()` 到位，开着时再 `hover()` 也可能触发 Playwright 自己的滚动。
- `#/popover` 页在 1100×1500 的视口里整页高 1500，滚不动，验不了「滚页面关」，所以换到 `#/news-feed`（整页高约 6700）。
- 滚轮先滚鼠标下面能滚的那个元素：「滚页面」那一步先把鼠标放在新闻流外面的说明文字上再滚；外框 `news-split` 只有横向可滚（内容 1000px、可见约 700px），所以用横向滚轮 `wheel(dx, 0)`，再读它的 `scrollLeft` 确认真滚了。
- 滚动事件晚一帧才到，判「不关」要等一会儿（300ms）再数浮层，立刻数会以为没关只是还没收到事件。
- 浮层关的时候有出场动画，节点还在、`data-state="closed"`：数开着的浮层用 `[data-state="open"]`。
