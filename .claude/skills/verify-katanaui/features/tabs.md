# Tabs 页签

一排页签切换同一块区域的内容：点哪个页签，就显示哪个页签的内容，选中底块滑到它下面；焦点在页签上时左右方向键切换；禁用的页签点不动。

## Sub-features

- `tabs-click` 点页签：它变成选中，内容换成它的，选中底块滑到它下面。
- `tabs-keyboard` 焦点在页签上按 ← / →：焦点和选中一起移到相邻页签，内容跟着换。
- `tabs-disabled` 禁用的页签：点了没反应，选中不变。

## How to get to it (user POV)

- 文档站左侧目录「布局与导航 → Tabs 页签」，地址 `#/tabs`。
- 第一组页签：`涨幅榜`、`成交额榜`、`换手榜`、`已禁用`，默认选中 `涨幅榜`。

## Driving it with kui.mjs

前置：`$KUI doctor` 全 OK。只看第一组页签 `section.getByRole('tablist').first()`，底块是组里的 `[data-slot="tabs-pill"]`。

- **默认。** 打开页。`涨幅榜` 的 `aria-selected="true"`，底块的 x 与 `涨幅榜` 页签的 x 相同（2026-11-23 实测都是 347）。
- **点选。** `getByRole('tab', { name: '换手榜', exact: true }).click()`。`换手榜` 选中，「换手榜的内容」可见，「涨幅榜的内容」不在页上；底块 x 移到 `换手榜` 的 x（实测 467）。
- **键盘。** 焦点留在 `换手榜` 上，按 `ArrowLeft`。焦点和选中都到了 `成交额榜`，「换手榜的内容」不在页上。
- **禁用。** `已禁用` 页签是 disabled；强点一下（`click({ force: true })`），选中仍是 `成交额榜`。
- **证据。** `$KUI drive tabs`：四步四张截图，`tabs-default.aria.yml` 是第一组页签的 ARIA 快照。

## Gotchas

- 页上有两组页签（还有一组 `日线 / 周线 …`），`getByRole('tab', { selected: true })` 不收到第一组会读出两个。
- 方向键是自动激活：焦点一到，选中和内容就换，不需要再按 Enter。
- 底块滑动有过渡（`transition-property: translate, width`）：读它的位置用 `expect.poll` 等它停下，不要点完立刻读。
- 禁用的页签不能用普通 `click`：Playwright 会一直等它变成可点直到超时；要证明「点不动」就 `force: true`，再断言选中没变。
