# SymbolNote 品种备注

挂在品种行上的便签。有备注时是一个便签图标：指针停 200ms 出预览看全文，点一下钉住，钉住后点「编辑」改，「保存」或 Ctrl+Enter 把文字交给调用方，存空就是删掉。没有备注时是加号图标，点开直接进编辑。Esc 在编辑时放弃草稿，不在编辑时收起浮层、焦点回到图标。

## Sub-features

- `note-preview` 指针停在便签图标上：200ms 后浮层出全文，图标 `aria-expanded="true"`；指针移开 150ms 后收起。
- `note-pin` 点图标，或焦点在图标上按 Enter：浮层钉住（`data-state="pinned"`），指针移开也不收；点图标不会选中它所在的行。
- `note-edit-save` 钉住后点「编辑」：编辑框拿到焦点、带原文；改完 Ctrl+Enter 或点「保存」，调用方收到去掉首尾空白的新文字，浮层回到全文，焦点在「编辑」上。
- `note-save-empty` 清空编辑框再保存：调用方收到空字符串（备注删掉），浮层关上，图标变成「添加备注」并拿到焦点。
- `note-esc` 不在编辑时按 Esc：浮层收起，焦点回到图标。编辑时按 Esc：草稿丢掉，回到原文（没有备注时直接关上），什么都不存。

## How to get to it (user POV)

- 文档站左侧目录「报价与行情 → SymbolNote 品种备注」，地址 `#/symbol-note`。
- 「自选行」一组四行：`AAPL`、`BTCUSDT` 有备注，`NVDA`、`600519` 没有（加号只在行悬停或行里有焦点时露出来）。页下的说明字回显「选中的行」和「最近一次保存」。
- 键盘：Tab 到图标，Enter 或空格钉住 / 收起，Ctrl / ⌘ + Enter 在编辑框里保存，Esc 见上。

## Driving it with kui.mjs

前置：`$KUI doctor` 全 OK。行是 `section.getByRole('list', { name: '示例自选', exact: true }).getByRole('listitem').filter({ hasText: '<代码>' })`；图标是行里的 `getByRole('button', { name: '备注', exact: true })`（没有备注时名字是 `添加备注`）；浮层是行里的 `[data-slot="symbol-note-popup"]`，开没开读 `el.matches(':popover-open')`。回显是 `getByTestId('symbol-note-selected')` 和 `getByTestId('symbol-note-saved')`。

- **悬停预览。** `icon('AAPL').hover()`。浮层开（`:popover-open`），`[data-slot="symbol-note-text"]` 是两行 `财报 11-28 盘后。` / `守 220 不破就拿着，破了减半。`，根上 `data-state="preview"`。指针移到 `symbol-note-saved` 上：浮层收起，`aria-expanded="false"`。
- **点击钉住。** `icon('BTCUSDT').click()`。浮层开，`data-state="pinned"`，「选中的行」还是 `AAPL`；指针移开等 400ms，浮层仍开着。
- **编辑后保存。** 点浮层里的 `编辑`：编辑框（`getByRole('textbox', { name: '备注' })`）有焦点、值是 `等回踩 95k 再看，别追。`；打 ` 跌破 90k 止损。`，按 `Control+Enter`。「最近一次保存」是 `BTCUSDT：等回踩 95k 再看，别追。 跌破 90k 止损。`，全文换成新的，焦点在 `编辑` 上，「选中的行」仍是 `AAPL`。
- **Esc 收起。** 按 `Escape`。浮层关，焦点在 BTCUSDT 的图标上。
- **键盘钉住、编辑时 Esc。** 焦点在图标上按 `Enter`：浮层钉住。点 `编辑`，打 `不要存这句`，按 `Escape`：浮层还开着，全文没变，焦点回 `编辑`，「最近一次保存」没变。
- **存空就是删除。** 再点 `编辑`，`Control+A`、`Backspace` 清空，点 `保存`。「最近一次保存」是 `BTCUSDT：（已删除）`，浮层关，焦点在名字变成 `添加备注` 的图标上，行里不再有叫 `备注` 的图标。
- **没有备注时 Esc 放弃。** 点 NVDA 的 `添加备注`：浮层开、直接是编辑框且有焦点；打 `先观望`，按 `Escape`。浮层关，焦点回加号，「最近一次保存」没变。
- **证据。** `$KUI drive symbol-note`：八步八张截图，`symbol-note-preview.aria.yml` 是 AAPL 预览浮层（dialog「备注」）的 ARIA 快照。

## Gotchas

- 浮层是原生 `popover="manual"`，就渲染在行里（不在 portal），关着时 `display: none`，不在无障碍树里：找它用 `data-slot`，`getByRole('dialog')` 只在开着时找得到。判开合读 `:popover-open`，不要用 `toBeVisible`：收起时有 `opacity` 加 `display` 的过渡，过渡里还算 visible。
- 证明「钉住后移开不收」只能等过收起延时（150ms）再看，流程里固定等 400ms；别的地方都用会等待的断言。
- 加号图标在行没悬停、行里没焦点时 `opacity: 0`：Playwright 的 `click` 会先把指针移上去，行一悬停它就露出来，照常能点；截图里看不到它不是坏了。
- 指针移开要移到别的东西上（流程用页下的说明字）：移到另一行的图标上会开那一行的预览。
- 每次 `drive` 是新的浏览器上下文、页面刷新：备注存在演示页的 state 里，刷新就回到初始的两条。
