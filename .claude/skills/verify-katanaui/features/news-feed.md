# NewsFeed 新闻流（外部筛选、标签、来源数、滚到底加载、分组、bare）

新闻列表：一行一条（时间、来源、标题、标题后的标签与来源数、品种胶囊）。给服务端分页的数据用时，过滤条只报选择、由调用方取数（external）；滚到底自动取下一页，底部一行依次是加载中、出错可重试、到底了；`chrome="bare"` 只画列表（侧栏），`groupBy` 加分组小标题；超过 50 条自动虚拟滚动。

## Sub-features

- `news-tags` 标题后的标签：纯文字，语气只有 neutral / info / warn，颜色不是涨跌色。
- `news-sources` `sourcesCount` 大于 1 才写「n 源」；有 `alsoFrom` 时可聚焦，悬停或聚焦出「另见：…」。
- `news-external` 外部筛选：搜索框打字，件不自己筛，条目由「服务端」换回，换完回到顶部，不冒「n 条新消息」。
- `news-end` 滚到底加载：底部依次 `loading` → 取到后条数增加；失败时 `error` 行写原因与「重试」，不点不再请求；取完写 `end`「没有更多了」。
- `news-group` 分组小标题（role=heading，aria-level 3，24px，带条数），不占 `aria-posinset`。
- `news-bare` `chrome="bare"`：没有标题行、频道、搜索、排法、过滤区。
- `news-10k` 1 万条：DOM 里只有几十行，滚到底最后一条可见；带标签与来源数的行高算得对。

## How to get to it (user POV)

- 文档站「积木」一组：`NewsFeed 新闻流`，地址 `#/news-feed`。页上自上而下：主演示（`news-frame`）、并排阅读窗（`news-split`）、服务端分页演示（`news-server`，200 条、一页 40 条、延迟 400ms）、1 万条开关（`news-10k` / `news-10k-frame`）、侧栏（`news-bare`，1000 条、每 50 条一组）、卡片（`news-cards`）、类别筛选（`news-categories`）。
- 设计规则页：`#/chart-event-marks`（图上事件标记）。

## Driving it with kui.mjs

还没有流程脚本，下面是手走的写法；同样的断言已在 `e2e/ui-gallery.spec.ts`（名字含「新闻流」）里跑过。前置：`$KUI doctor` 全 OK，打开 `#/news-feed` 等 `[data-gallery="news-feed"]`。

- **标签与来源数。** 在 `news-server` 里看第一行：`.k-news-tag` 两枚（公告 / 利好），在标题右边；`.k-news-sources` 写「n 源」；第二行没有来源数。悬停第一行的 `.k-news-sources[data-also]`，出 `role=tooltip`「另见：演示快讯」；Esc 收起，Tab 聚焦也出。
- **滚到底加载。** `news-server` 里 `.k-news-scroll` 滚到底：`.k-news-end` 变 `data-state="loading"` 写「加载中…」，`news-server-count` 从 40 到 80。点 `news-server-fail` 再滚到底：`data-state="error"` 写「这一页没取到（演示）」；等 400ms，`news-server-requests` 不变；点「重试」到 120。再滚两次到 200，`data-state="end"` 写「没有更多了」。
- **外部筛选。** 搜索框 `搜索关键词` 填「第 7」：`news-server-count` 变 11，列出的标题都含「第 7」，`scrollTop` 为 0，`news-new` 不存在。
- **侧栏与分组。** `news-bare` 里没有 `.k-news-top` 与 `.k-news-head`；第一个 `.k-news-group` 写「第 1–50 条」、高 24、带 `50`；滚到底最后一行 `aria-posinset="1000"`。
- **1 万条。** 打开开关 `1 万条` 后 `news-10k-frame` 里 `.k-news-item` 一直在几十行内，`aria-setsize` 为 10000；滚到底 `aria-posinset="10000"` 可见。
- **证据。** 每步截图加动作后的状态；1 万条那一步附滚动帧时间（e2e 输出 `news-feed 10000 rows scroll …`）。

## Gotchas

- 提示（Tooltip）有 500ms 悬停延迟，先 `hover` 再等 `role=tooltip`；页面上同时可能有别的提示，用 `.first()`。
- 假服务端的搜索是整句匹配（「第 7」命中第 7、70–79 条，共 11 条）；旧列表尾部的「第 79 条」也含「第 7」，不能拿「第一行含第 7」当换完的信号，要等 `news-server-count`。
- 底部「more」是 1px 的哨兵，离底 400px 内就会触发，演示一页给到 40 条才看得到「加载中」。
- 1 万条与 1000 条两个开关互不关联；打开 1 万条会创建 1 万个对象，等 `.k-news-items[data-virtual]` 出来再动。
- 行窄于约 480px 时，来源列固定 148px，标题会折成多行、标签可能被裁（最多占一半宽）：侧栏要给足宽度。
