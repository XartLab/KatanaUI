# NewsFeed

快讯与要闻的流：列表（时间、来源、标题、相关品种胶囊、重要标记）与卡片网格（来源 + 时间、标题、两行摘要、胶囊）两种排法；顶上频道分段、来源多选、关键词搜索、暂停。新到的不打断阅读：在顶部且没暂停时淡入插入，否则出「n 条新消息」，点了才插入。功能参照 TradingView News Flow 帮助页（只读到：新闻集中在一处、可设多种过滤）与 uiarc.dev 的卡片结构（待核对），实现原创。演示数据是虚构的。

## Provide

`*` marks a required prop.

### NewsFeed

筛选与排法的状态在件内；数据、频道、来源、文字、当前时间都由调用方传，件不认识任何应用。高度由外层给（件撑满外层，列表自己滚）。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `items` | `NewsItem[]` | — | { id, time（毫秒）, channel, source, title, summary?, symbols?: {code, name?}[], important?, href?, tags?: { label, tone? }[], sourcesCount?, alsoFrom?: string[] }。传入顺序不用排，件按时间新的在前（给了 groupBy 就保持传入的顺序）；新出现的 id 算「新消息」（分页时比已显示最新一条还旧的是翻页来的，直接接在底部）。 |
| `channels` | `{ value: string; label: string }[]` | — | 频道分段；「全部」由件加在最前，字是 labels.all。 |
| `sources` | `{ value: string; label: string }[]` | — | 来源多选芯片；一个都不选 = 全部来源。 |
| `now` | `number` | — | 当前毫秒时间：相对时间按它算，调用方定时更新（件不在渲染里取时间）。 |
| `labels` | `NewsFeedLabels` | — | 全部文字：all、feed、channels、sources、clearSources、search、layout、layoutList、layoutCard、pause、resume、important、empty，以及 newItems(n)、ago(秒)、absolute(时间)。包里没有语言。 |
| `defaultLayout` | `'list' \| 'card'` | — | 起始排法，默认 list。 |
| `facets` | `NewsFacet[]` | — | 组合过滤（照 TradingView News Flow，主会话 2026-11-15 实测）：{ key, label, options, single?, shown? }；条目用 NewsItem.facets 带取值。每个分面一个胶囊，浮层里复选、可重置、可移除，「+ 添加过滤」再加；取值之间「或」，分面之间「且」。需要 labels.facets 的文字。 |
| `categories / onCategoriesChange / NewsItem.category / labels.categories` | `{ value, label }[] / (values) => void / string / string` | — | 类别筛选：条目带 category，来源行下面多一行类别芯片（多选，复用 ChipGroup，不选是全部，选了之后没带类别的条目被筛掉）；不传 categories 或没写 labels.categories（读屏名，labels.clearCategories 是清除钮）就没有这一行。 |
| `selected` | `string \| null` | — | 阅读窗开着的那条：行底色加深。 |
| `onSymbolSelect` | `(symbol, item) => void` | — | 点品种胶囊（旧名 onSymbolPick 留一个版本）。 |
| `reader` | `(item, { close }) => ReactNode` | — | 给了就是左列表右阅读窗的并排排法（照 TradingView News Flow，主会话 2026-11-15 实测）：点标题打开这一条，返回的节点（一般是 NewsReader）画在右边，选中行底色加深；件的宽度不到 900px 时阅读窗改成盖在列表上的浮层。 |
| `views / view / onViewChange / onSaveView` | `ViewOption[] / string / (key) => void / () => void` | — | 标题行的已保存过滤视图下拉（Full feed 那样）；需要 labels.views。切换与另存由调用方处理，一般换 key 让件里的过滤状态重置。 |
| `symbolStyle` | `'stack' \| 'chips'` | `'stack'` | 相关品种：stack = 重叠的一排徽标（悬停出代码与名称），chips = 带代码的胶囊。 |
| `NewsItem.readMinutes / labels.read / labels.collapse` | `number / (n) => string / string` | — | 条目写「n 分钟阅读」（labels.read 与 readMinutes 都有才写）；labels.collapse 给了，标题行右边有收起 / 展开过滤区的按钮。 |
| `itemActions` | `(item) => RowAction[]` | — | 每条的快捷操作：悬停出前几颗图标按钮，右键出同一份菜单；读屏名在 labels.itemActions（旧名 itemActionsLabel）。 |
| `onSelect` | `(item) => void` | — | 选中一条：给了，标题是按钮；没给而条目有 href，标题是新窗口链接（旧名 onOpen 留一个版本）。 |
| `onChannelChange / onSourcesChange / onPausedChange` | `callback` | — | 筛选或暂停变了通知调用方（可选）。 |
| `filtering` | `'internal' \| 'external'` | `'internal'` | internal：件用自己的过滤条筛 items（老行为，一点没变）。external：件不筛，只画传进来的 items，过滤条只把用户的选择报给 onFilterChange，由调用方（服务端分页）按条件取回条目；新条目整批换进来时回到顶部，不算「新消息」。 |
| `filter / onFilterChange` | `NewsFilter / (filter: NewsFilter) => void` | — | 过滤条的值 { channel, sources, query, categories?, facets? }：给了就是受控（两种 filtering 都一样），不给件自己存。onFilterChange 总是回整份、字段给全；external 时搜索框每敲一个字都回调，防抖由调用方做。 |
| `NewsItem.tags` | `{ label: string; tone?: "neutral" \| "info" \| "warn" }[]` | — | 画在标题后面的标签，纯文本，默认 neutral。只有三档语气，没有 up / down：涨跌色给新闻标签用，读起来就是价格判断（方向只写字：利好 / 利空 / 中性 / 未标）。虚拟列表的行高把标签的宽算进去。 |
| `NewsItem.sourcesCount / NewsItem.alsoFrom / labels.sourceCount / labels.alsoFrom` | `number / string[] / (n) => string / (names) => string` | — | sourcesCount 大于 1 才在标题后写 labels.sourceCount(n)（默认英文「n sources」）；alsoFrom 给了，这段字可聚焦，悬停或聚焦出提示 labels.alsoFrom(names)（默认「Also from A, B」）。注意 labels.sources 是来源芯片组的读屏名，不是来源数。 |
| `onEndReached / endState / labels.end` | `() => void / 'more' \| 'loading' \| 'end' \| { error: ReactNode; retry: () => void } / { loadingMore?, endReached?, retry? }` | — | 滚到底加载：底部那一行进了视野（离底 400px 内，待定）且 endState 是 more（或没给）就调 onEndReached；调用方取页时把 endState 设成 loading，取到了设回 more 或 end，失败设成 { error, retry }。loading 写转圈与 labels.end.loadingMore，end 写 endReached，error 写原因与重试钮；文字默认英文。都不给就没有这一行。用 IntersectionObserver 盯底部的哨兵，不挂 scroll 监听。 |
| `groupBy` | `(item) => { key: string; label: ReactNode; count?: number }` | — | 连续同组键的一段前面出一个小标题（role=heading，aria-level 3，高 24px），count 写在旁边，由调用方给（件里可能只有这组的一部分）。组序由调用方排好，所以给了 groupBy 件不按时间排序；组键隔开又回来就再出一个小标题。小标题不占 aria-posinset。 |
| `chrome` | `'full' \| 'bare'` | `'full'` | bare 只画列表（加「n 条新消息」与读屏播报）：没有标题行、频道、搜索、排法、暂停与过滤区，给侧栏用；行本身照旧（来源、标签、品种都在）。 |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { useState } from 'react'
import {
  NewsFeed,
  PanelFrame,
  PanelFrameBody,
  PanelFrameHeader,
  type NewsFeedLabels,
  type NewsItem,
} from '@katana-ui/react/blocks'
import { Button, symbolMenu } from '@katana-ui/react'

const NEWS_NOW = Date.UTC(2026, 10, 15, 9, 30, 0)

const MIN = 60_000

const NEWS_SOURCES = [
  { value: 'wire', label: '演示通讯社' },
  { value: 'desk', label: '演示研究台' },
  { value: 'exch', label: '演示交易所公告' },
]

const NEWS_CHANNELS = [
  { value: 'flash', label: '快讯' },
  { value: 'top', label: '要闻' },
]

const NEWS_ITEMS: NewsItem[] = [
  {
    id: 'n1',
    time: NEWS_NOW - 3 * MIN,
    channel: 'flash',
    source: 'wire',
    title: '星河锂业披露一季度产能爬坡进度，超出此前指引',
    summary: '公司称新产线良率已升至 92%，二季度有望满产；管理层同时提示原料价格波动风险。',
    symbols: [{ code: '600001', name: '星河锂业' }],
    important: true,
  },
  {
    id: 'n2',
    time: NEWS_NOW - 12 * MIN,
    channel: 'top',
    source: 'desk',
    title: '北辰半导体与海岚电子签署三年期供货框架协议',
    summary: '协议涵盖车规级芯片，首年预计供货量约 400 万颗，具体价格以季度谈判为准。',
    symbols: [
      { code: '600002', name: '北辰半导体' },
      { code: '000003', name: '海岚电子' },
    ],
  },
  {
    id: 'n3',
    time: NEWS_NOW - 26 * MIN,
    channel: 'flash',
    source: 'exch',
    title: '演示交易所：下周起调整两只指数成分股，名单见公告',
    summary: '本次调整涉及 6 只成分股，生效日为下周一收盘后。',
    symbols: [{ code: 'DEMOIDX' }],
  },
  {
    id: 'n4',
    time: NEWS_NOW - 58 * MIN,
    channel: 'top',
    source: 'wire',
    title: '云岭能源董事会通过回购方案，金额上限 8 亿元',
    summary: '回购股份拟用于员工持股计划，实施期限十二个月。',
    symbols: [{ code: '600004', name: '云岭能源' }],
    important: true,
  },
  {
    id: 'n5',
    time: NEWS_NOW - 3 * 60 * MIN,
    channel: 'flash',
    source: 'desk',
    title: '研究台：三季度出口链景气度环比改善，细分行业分化加大',
    symbols: [],
  },
  {
    id: 'n6',
    time: NEWS_NOW - 5 * 60 * MIN,
    channel: 'top',
    source: 'exch',
    title: '演示交易所发布新版交易日历，节假日安排有微调',
    summary: '新版日历自下月起适用，不影响已挂出的合约。',
  },
]

const NEWS_LABELS: NewsFeedLabels = {
  itemActions: '新闻操作',
  all: '全部',
  feed: '新闻流',
  channels: '频道',
  sources: '来源',
  clearSources: '清除来源筛选',
  search: '搜索关键词',
  layout: '排法',
  layoutList: '列表',
  layoutCard: '卡片',
  pause: '暂停',
  resume: '继续',
  newItems: (n) => `${n} 条新消息`,
  ago: (s) => (s < 60 ? `${s} 秒前` : s < 3600 ? `${Math.floor(s / 60)} 分钟前` : `${Math.floor(s / 3600)} 小时前`),
  absolute: (t) => new Date(t).toISOString().replace('T', ' ').slice(0, 16) + ' UTC',
  important: '重要',
  empty: '没有符合筛选的新闻',
}

export function NewsFeedUsage() {
  const [items, setItems] = useState(NEWS_ITEMS)
  const [, setPicked] = useState('—')
  const push = () =>
    setItems((prev) => [
      {
        id: `n${prev.length + 1}`,
        time: NEWS_NOW + prev.length * 1000,
        channel: 'flash',
        source: 'wire',
        title: `演示快讯 ${prev.length + 1}：虚构公司发布示例公告`,
        symbols: [{ code: '600001', name: '星河锂业' }],
      },
      ...prev,
    ])
  return (
    <div className="gal-stack" style={{ width: '100%' }}>
      <Button data-testid="news-push" onClick={push}>
        模拟新消息
      </Button>
      <div style={{ height: 420 }} data-testid="news-frame">
        <PanelFrame aria-label="News panel">
          <PanelFrameHeader heading="News" object="· 演示数据" />
          <PanelFrameBody>
            <div style={{ height: '100%', padding: 8 }}>
              <NewsFeed
                items={items}
                channels={NEWS_CHANNELS}
                sources={NEWS_SOURCES}
                now={NEWS_NOW}
                labels={NEWS_LABELS}
                onSymbolSelect={(s) => setPicked(s.code)}
                itemActions={(item) =>
                  item.symbols?.length
                    ? symbolMenu({
                        openChart: { label: '打开图表', onSelect: () => setPicked(`图表 ${item.symbols![0]!.code}`) },
                        copyCode: { label: '复制代码', onSelect: () => setPicked(`复制 ${item.symbols![0]!.code}`) },
                      })
                    : []
                }
              />
            </div>
          </PanelFrameBody>
        </PanelFrame>
      </div>
      <div style={{ height: 300 }} data-testid="news-tagged">
        <NewsFeed
          items={NEWS_ITEMS.slice(0, 4).map((item, index) => ({
            ...item,
            tags: [
              { label: index % 2 ? '政策' : '公告' },
              { label: ['利好', '中性', '利空', '未标'][index]!, tone: index === 3 ? 'warn' : 'info' },
            ],
            sourcesCount: index === 0 ? 3 : undefined,
            alsoFrom: index === 0 ? ['演示快讯', '演示财经'] : undefined,
          }))}
          channels={[]}
          sources={NEWS_SOURCES}
          now={NEWS_NOW}
          labels={{
            ...NEWS_LABELS,
            sourceCount: (n) => `${n} 源`,
            alsoFrom: (names) => `另见：${names.join('、')}`,
            end: { endReached: '没有更多了' },
          }}
          chrome="bare"
          groupBy={(item) => ({ key: item.channel, label: item.channel === 'flash' ? '快讯' : '要闻' })}
          endState="end"
        />
      </div>
      <div style={{ height: 420 }} data-testid="news-cards">
        <NewsFeed
          items={NEWS_ITEMS}
          channels={NEWS_CHANNELS}
          sources={NEWS_SOURCES}
          now={NEWS_NOW}
          labels={NEWS_LABELS}
          defaultLayout="card"
        />
      </div>
    </div>
  )
}

// 建议队列的演示数据是虚构的（品种、策略、来源都不是真实的），时间固定在 DQ_NOW，靠「快进」按钮推进。
```

## States

- 在顶部、没暂停：新条目直接淡入插入。
- 滚离顶部或已暂停：顶上出「n 条新消息」（只数符合当前筛选的），点了才插入并回到顶部。
- 时间是相对的（3 分钟前），悬停出绝对时间；重要条目有琥珀小方块，读屏名「重要」。
- 筛选没有命中：写 labels.empty。
- 底部（endState）：more 是看不见的哨兵，loading 转圈，end 写「到底了」（列表空着时不写），error 写原因和重试。

## Don't

- 不要在件里取当前时间：传 now。
- 不要用橙色标重要：橙色留给数据，重要标记是琥珀。
- 不要拿涨跌色画标签：tone 只有 neutral / info / warn。
- 不要在 external 时再自己筛一遍：条件交给服务端，件里不再筛。
- 取页期间不要把 endState 留在 more：同一页会被要两次，要设成 loading。

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
