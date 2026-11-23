# 弹出层

点触发钮打开一块浮层：Popover 是不打断的说明浮层，Dialog 是要裁决的模态框。用户按 Esc、点外面（Popover）或点「取消」（Dialog）把它关上，焦点回到打开它的那个钮。非模态浮层还认「滚动即关」：装着它的页面一滚就关，不跟着锚点滚出屏幕还开着。

## Sub-features

- `popover-open` 点「弹层」或焦点在钮上按 Enter：浮层出现，钮的 `aria-expanded` 变 `true`，焦点进到浮层里。
- `popover-esc` 按 Esc：浮层消失，焦点回到「弹层」钮。
- `popover-outside` 点浮层外的空白：浮层消失。
- `popover-scroll-close` 页面滚动：浮层关掉；页面上别的滚动容器（侧栏）滚不关；滚过以后再开，不会刚开就被上一次滚动关掉。
- `dialog-open` 点「对话框」：模态框「恢复默认布局」出现，焦点落在第一个钮「取消」上。
- `dialog-esc` 按 Esc：模态框关上，焦点回到「对话框」钮。
- `dialog-cancel` 点「取消」：同样关上。

## How to get to it (user POV)

- 文档站左侧目录「浮层」一组：`Popover 弹层`（`#/popover`）、`Dialog 对话框`（`#/dialog`）。
- 「滚动即关」在新闻流的组合过滤条上：`#/news-feed`，过滤条末端的「添加过滤」是一处真的非模态浮层，锚点在长页面里。
- 键盘：Tab 到触发钮，Enter 或空格打开，Esc 关。

## Driving it with kui.mjs

前置：`$KUI doctor` 全 OK。流程从 `#/popover` 开始，中途点目录换到 `#/dialog`、再换到 `#/news-feed`。

- **开弹层。** `section.getByRole('button', { name: '弹层', exact: true }).click()`。`[data-slot="popover-content"]` 可见，标题「取数口径」，钮 `aria-expanded="true"`，焦点在浮层里。
- **Esc 关弹层。** `page.keyboard.press('Escape')`。`popover-content` 数量为 0，钮 `aria-expanded="false"`，焦点在「弹层」钮上。
- **键盘开。** 焦点仍在钮上，按 Enter。浮层又出现。
- **点外面关。** 在触发钮右边 300px 处点一下（`page.mouse.click`，那里是空白）。浮层消失。
- **换到对话框页。** `page.getByRole('navigation', { name: '文档目录' }).locator('a.k-sidenav-link[href="#/dialog"]').click()`，等 `[data-gallery="dialog"]`。
- **开对话框。** 点 `getByRole('button', { name: '对话框', exact: true })`。`getByRole('dialog', { name: '恢复默认布局' })` 可见，页上只有这一个 dialog，焦点在「取消」上。
- **Esc 关对话框。** 按 Escape。dialog 数量为 0，焦点在「对话框」钮上。
- **取消关对话框。** 再开，点框里的「取消」。dialog 数量为 0，焦点回到「对话框」钮。
- **开「滚动即关」的浮层。** 目录换到 `#/news-feed`，等 `[data-gallery="news-feed"]`。用 DOM 点开「添加过滤」（`document.querySelector('[data-slot="news-facet-add"]').click()`，先 `scrollIntoView({ block: 'center' })`）。`[data-slot="popover-content"][data-state="open"]` 可见。
- **压到 1100×800 再滚侧栏。** `page.setViewportSize({ width: 1100, height: 800 })`；`.k-sidenav-scroll` 的 `scrollTop += 200`（实测 9697 → 9897）。浮层还在。
- **滚页面。** 鼠标移到正文右侧的空白处（`page.mouse.move(900, 600)`）再 `page.mouse.wheel(0, 600)`。`window.scrollY` 从 0 到 600，浮层关掉。
- **滚过以后再开。** 再 DOM 点开「添加过滤」：浮层在，等 300ms 还在；按 Esc 收掉。
- **证据。** `$KUI drive overlays`：十一步十一张截图，`popover-open.aria.yml`、`dialog-open.aria.yml` 是打开时浮层与模态框的 ARIA 快照。

## Gotchas

- 浮层和模态框渲染在页面根部的 portal 里，不在 `[data-gallery]` 里面：用 `page.locator(...)` / `page.getByRole('dialog')` 找，不要在 `section` 里找。
- `#/dialog` 页上还有「代码开的对话框」等别的钮，名字要 `exact: true`，否则「对话框」会匹配到好几个。
- 浮层有入场动画（`kc-pop-in`）：断言可见性用会等待的 `expect(...).toBeVisible()`，不要开完立刻量尺寸。
- **开「滚动即关」的浮层一律用 DOM 点击**（`el.click()`）：文档站页头是 sticky 的，Playwright 的 `click` 被挡住时会自己再滚一次页面，那一下滚动本身就会把浮层关掉，结果不算数。
- **滚轮要落在没有自己滚动条的空白处**：移到正文右侧（左边 420 是面板、右边是 `.gal-main` 的底色）再滚；落在新闻列表或侧栏上，滚的是那个容器，页面不动，断言「页面滚了就关」会变成假通过。
- 1100×1500 的默认视口下侧栏（11916px 的内容）与新闻列表都装不满一屏、滚不动；要证明「别的容器滚不关」先把视口压到 1100×800（流程里这么做的），否则那一步是空的。
- **走不到的一支**：文档站上能开的浮层都装不满一屏（新闻流「添加过滤」的浮层实测 76px，`#/select` 只有三个选项），所以「浮层自己里面滚不关」这一支没在文档站上验过；它由 `lib/scroll-dismiss.ts` 里「容器不包含锚点就不算」那句管着，要验得换一个选项很多的真实调用方。
- 侧栏的滚动容器是 `.k-sidenav-scroll`（不是 `.gal-side`），后者 `height: 100vh`、自己不出滚动条。