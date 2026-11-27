# ComponentCatalog 添加组件（menu 样式）

从面板页签「+」垂下来的紧凑清单：每类一个可折叠的标题，每行名字加右边的「+」；点一行添加。已添加的与不可用的整行置灰，悬停或键盘聚焦时在右侧说明原因。抽屉样式（搜索、类别页签、缩略图卡片）仍是默认，页上两种并排。

## Sub-features

- `catalog-menu-collapse` 点分组标题：该组收起 / 展开，标题按钮的 `aria-expanded` 跟着变。
- `catalog-menu-add` 点能加的行：回调添加，该行变灰并写「已添加此组件」；再点没反应。
- `catalog-menu-reason` 悬停或聚焦灰的行：右侧出提示，已添加写「已添加此组件」，不可用写它自己的原因。
- `catalog-menu-recommend` 最前一组「推荐」：声明了「适合放在图表旁」的组件（订单簿、最新成交），已在用的不推荐。

## How to get to it (user POV)

- 文档站左侧目录「积木」一组：`ComponentCatalog 添加组件`，地址 `#/component-catalog`；第二行预览是 `variant="menu"`（`[data-variant="menu"]`）。
- 演示：三类（市场信息、订单与仓位、交易面板）八个组件，「图表」「交易」已添加，「公司」不可用（组件不适用于当前市场）。

## Driving it with kui.mjs

前置：`$KUI doctor` 全 OK。先收到 `section.locator('[data-variant="menu"]')`。

- **默认。** 第一组是「推荐」（`data-group="recommended"`），里面「订单簿」「最新成交」；「图表」与「交易」是灰的，读屏名「图表 · 已添加此组件」。
- **折叠。** 点「订单与仓位」标题（`getByRole('button', { name: '订单与仓位', expanded: true })`）：`expanded` 变 false，「当前仓位」不可见；再点又出来。
- **添加。** 点「当前仓位」：它的名字变成「当前仓位 · 已添加此组件」，`aria-disabled="true"`；强点（`click({ force: true })`）仍是灰的。
- **悬停原因。** 先把鼠标挪到别处再移到灰行上：`getByRole('tooltip')` 写「已添加此组件」；挪开后消失。
- **聚焦原因。** Tab 到「公司」：提示写「组件不适用于当前市场」，行的不透明度 0.6。
- **证据。** `$KUI drive component-catalog`：每步一张截图，`component-catalog-menu.aria.yml` 是菜单的 ARIA 快照。

## Gotchas

- 灰的行是 `aria-disabled`、不是 `disabled`：Playwright 的普通 `click` 会一直等它变成可点，要证明「点不动」就 `force: true`。
- 刚点过的行，鼠标还在它上面：直接 `hover()` 不会出提示（没有新的 pointermove），先把鼠标挪开。
- 提示渲染在页面根部的 portal 里：用 `page.getByRole('tooltip')`，不要在 `section` 里找。
- 收起的分组列表带 `hidden` 属性：断言「不可见」用 `toBeHidden()`。
