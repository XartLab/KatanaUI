# MarketBrowser 市场浏览器

找品种的入口：一个搜索框、一排分类页签，下面是当前分类的品种列表（星标、徽标、代码与全称、最新价、24h 涨跌）。点价格或涨跌的列头排序；点行选品种；点星标加或去自选，不选品种。

## Sub-features

- `market-sort` 点「最新价」或「24h 涨跌」列头：升序 → 降序 → 回原顺序，th 带 `aria-sort`。
- `market-search` 搜索框按代码、名称、别名在当前分类里筛；没找到写「没有匹配的币对。」；换分类搜索词保留。
- `market-star` 点行首星标：`aria-pressed` 翻转，行进或出「自选」页签；不触发选品种。
- `market-select` 点行或焦点在行上按 Enter：回调 onSelect，页上写「已选：<代码>」；焦点在星标上按 Enter 只切星标。

## How to get to it (user POV)

- 文档站左侧目录「报价与行情」一组：`MarketBrowser 市场浏览器`，地址 `#/market-browser`。
- 页签：`自选`、`全部`（默认）、`主流币`、`Meme`；演示数据五个币对，BTC 与 SOL 默认在自选里。

## Driving it with kui.mjs

前置：`$KUI doctor` 全 OK。行是 `[data-slot="market-row"]`，代码芯片是行里的 `.k-code-chip`。

- **默认。** 打开页。`全部` 选中，五行次序 BTC-USDT、ETH-USDT、SOL-USDT、DOGE-USDT、XRP-USDT。
- **排序。** 点列头「最新价」里的按钮：th `aria-sort="ascending"`，第一行 DOGE-USDT；再点 `descending`，第一行 BTC-USDT；第三下 `aria-sort` 没了，回到原次序。
- **搜索。** 在「搜索币对」里填 `sol`：只剩 SOL-USDT；填 `zzz`：`role=status` 写「没有匹配的币对。」。
- **星标。** 点「自选 ETH-USDT」：`aria-pressed` 变 `true`，页上仍写「点一行选品种」；切到「自选」页签有 ETH-USDT。
- **选品种。** 点第一行，页上写「已选：…」；焦点在行上按 Enter 同样。
- **证据。** `$KUI drive market-browser`：每步一张截图，`market-browser-default.aria.yml` 是默认状态的 ARIA 快照。

## Gotchas

- 星标按钮的名字是「自选 <代码>」，不是「星标」；用 `getByRole('button', { name: '自选 ETH-USDT' })`。
- 价格与涨跌格会闪色（只在数变时）：演示数据是固定的，不会闪；读文字用 `innerText`。
- 页签「自选」和星标按钮名字里都有「自选」：页签用 `getByRole('tab', …)`。
