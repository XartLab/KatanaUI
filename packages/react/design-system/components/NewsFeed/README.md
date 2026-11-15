# NewsFeed

快讯与要闻的流：列表（时间、来源、标题、相关品种胶囊、重要标记）与卡片网格（来源 + 时间、标题、两行摘要、胶囊）两种排法；顶上频道分段、来源多选、关键词搜索、暂停。新到的不打断阅读：在顶部且没暂停时淡入插入，否则出「n 条新消息」，点了才插入。功能参照 TradingView News Flow 帮助页（只读到：新闻集中在一处、可设多种过滤）与 uiarc.dev 的卡片结构（待核对），实现原创。演示数据是虚构的。

## Provide

### NewsFeed

筛选与排法的状态在件内；数据、频道、来源、文字、当前时间都由调用方传，件不认识任何应用。高度由外层给（件撑满外层，列表自己滚）。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `items` | `NewsItem[]` | — | { id, time（毫秒）, channel, source, title, summary?, symbols?: {code, name?}[], important?, href? }。传入顺序不用排，件按时间新的在前；新出现的 id 算「新消息」。 |
| `channels` | `{ value: string; label: string }[]` | — | 频道分段；「全部」由件加在最前，字是 labels.all。 |
| `sources` | `{ value: string; label: string }[]` | — | 来源多选芯片；一个都不选 = 全部来源。 |
| `now` | `number` | — | 当前毫秒时间：相对时间按它算，调用方定时更新（件不在渲染里取时间）。 |
| `labels` | `NewsFeedLabels` | — | 全部文字：all、feed、channels、sources、clearSources、search、layout、layoutList、layoutCard、pause、resume、important、empty，以及 newItems(n)、ago(秒)、absolute(时间)。包里没有语言。 |
| `defaultLayout` | `'list' \| 'card'` | — | 起始排法，默认 list。 |
| `facets` | `NewsFacet[]` | — | 组合过滤（照 TradingView News Flow，主会话 2026-11-15 实测）：{ key, label, options, single?, shown? }；条目用 NewsItem.facets 带取值。每个分面一个胶囊，浮层里复选、可重置、可移除，「+ 添加过滤」再加；取值之间「或」，分面之间「且」。需要 labels.facets 的文字。 |
| `selected` | `string \| null` | — | 阅读窗开着的那条：行底色加深。 |
| `onSymbolPick` | `(symbol, item) => void` | — | 点品种胶囊。 |
| `reader` | `(item, { close }) => ReactNode` | — | 给了就是左列表右阅读窗的并排排法（照 TradingView News Flow，主会话 2026-11-15 实测）：点标题打开这一条，返回的节点（一般是 NewsReader）画在右边，选中行底色加深；件的宽度不到 900px 时阅读窗改成盖在列表上的浮层。 |
| `views / view / onViewChange / onSaveView` | `ViewOption[] / string / (key) => void / () => void` | — | 标题行的已保存过滤视图下拉（Full feed 那样）；需要 labels.views。切换与另存由调用方处理，一般换 key 让件里的过滤状态重置。 |
| `symbolStyle` | `'stack' \| 'chips'` | `'stack'` | 相关品种：stack = 重叠的一排徽标（悬停出代码与名称），chips = 带代码的胶囊。 |
| `NewsItem.readMinutes / labels.read / labels.collapse` | `number / (n) => string / string` | — | 条目写「n 分钟阅读」（labels.read 与 readMinutes 都有才写）；labels.collapse 给了，标题行右边有收起 / 展开过滤区的按钮。 |
| `itemActions` | `(item) => RowAction[]` | — | 每条的快捷操作：悬停出前几颗图标按钮，右键出同一份菜单；配 itemActionsLabel（读屏名）。 |
| `onOpen` | `(item) => void` | — | 给了，标题是按钮；没给而条目有 href，标题是新窗口链接。 |
| `onChannelChange / onSourcesChange / onPausedChange` | `callback` | — | 筛选或暂停变了通知调用方（可选）。 |

## States

- 在顶部、没暂停：新条目直接淡入插入。
- 滚离顶部或已暂停：顶上出「n 条新消息」（只数符合当前筛选的），点了才插入并回到顶部。
- 时间是相对的（3 分钟前），悬停出绝对时间；重要条目有琥珀小方块，读屏名「重要」。
- 筛选没有命中：写 labels.empty。

## Don't

- 不要在件里取当前时间：传 now。
- 不要用橙色标重要：橙色留给数据，重要标记是琥珀。
- 不要一次传几万条：不做虚拟滚动，分段加载由调用方管。

## Composition

```
NewsFeed
  顶行：频道 ToggleGroup、搜索 Input、排法 ToggleGroup、暂停按钮
  来源 ChipGroup
  「n 条新消息」按钮
  ol
    li × 条目：来源、time、重要标记、标题、摘要（卡片）、品种胶囊（SymbolMark）
```

## Keyboard

- `Tab`：在频道、搜索、排法、暂停、来源芯片、新消息按钮、标题、胶囊间移动
- `Enter / Space`：触发当前按钮
