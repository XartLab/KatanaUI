# FloatingWindow 悬浮窗

点「在悬浮窗中交易」，把一块内容（演示里是个小下单区）放进置顶的小窗：浏览器有 Document Picture-in-Picture（Chrome / Edge 116+）时开真窗口，没有时是页内可拖的浮层。关窗后内容回到原处，输入的字和点过的计数都还在。

## Sub-features

- `float-open` 点「在悬浮窗中交易」：浮层（或真小窗）出现，原位写「下单区已在悬浮窗中。」，钮变成「放回原处」。
- `float-drag` 拖浮层的标题栏：位置跟着动，拖不出视口。
- `float-keys` 焦点在标题栏上按方向键：移动 8px，Shift 加方向键 32px。
- `float-close` Esc、浮层的关闭钮、点「放回原处」：内容回到原处，状态不丢。
- `float-pip` 有 PiP 的浏览器里开真小窗：窗里是同样的皮肤与主题，点击照常，用户关小窗等于关窗。

## How to get to it (user POV)

- 文档站左侧目录「积木」一组：`FloatingWindow 悬浮窗`，地址 `#/floating-window`。
- 演示：一个按钮「在悬浮窗中交易」，下面是小下单区（价格框、「买入」钮、「已下 N 单」）。

## Driving it with kui.mjs

前置：`$KUI doctor` 全 OK。真 PiP 窗要用户在真浏览器里操作、驱动不了：流程走页内浮层，把 `window.documentPictureInPicture` 盖成 `undefined` 再点；真 PiP 路径由 `e2e/floating-window.spec.ts` 用桩验证，验收时在用户的 Chrome 里手点一次（见 Gotchas）。

- **开。** `section.getByRole('button', { name: '在悬浮窗中交易' }).click()`。`page.getByRole('dialog', { name: '下单' })` 可见，里面有「买入」；原位写「下单区已在悬浮窗中。」。
- **状态。** 在浮层里价格框填 `95000`，点「买入」：浮层里「已下 1 单」。
- **拖。** 在标题栏（`getByRole('button', { name: /移动悬浮窗/ })`）按下、移动、松开：浮层的 x、y 随之变；往视口外拖，停在 0、0。
- **方向键。** 焦点在标题栏，`ArrowRight`：x 加 8；`Shift+ArrowDown`：y 加 32。
- **关。** 按 Escape：dialog 数量为 0，价格框仍是 `95000`，页上「已下 1 单」。
- **证据。** `$KUI drive floating-window`：每步一张截图，`floating-window-open.aria.yml` 是浮层打开时的 ARIA 快照。

## Gotchas

- 浮层是 popover（浏览器顶层），不在 `[data-gallery]` 里面：用 `page.getByRole('dialog', …)`，不要在 `section` 里找。
- 在真浏览器里开 PiP 要用户刚点过：用 `drive` 的合成点击可能被拒，那就是退到页内浮层，不算失败。验收真 PiP 时手点按钮，看小窗里是不是 Graphite 的皮肤、关小窗后原处是否恢复。
- `drive` 里要走页内浮层，先 `page.evaluate` 把 PiP 盖掉，否则 Chrome 可能真开一个小窗，截图里看不到。
