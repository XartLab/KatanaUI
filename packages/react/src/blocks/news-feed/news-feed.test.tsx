// SPDX-License-Identifier: MIT
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vite-plus/test'
import { NewsFeed, type NewsFeedLabels } from './news-feed.tsx'
import { EmphasisProvider } from '../../layout/emphasis.tsx'
import { filterNews, type NewsItem } from './news-feed-model.ts'

// #109：新闻流的类别筛选。条目带 category，头部加类别芯片（多选，复用 ChipGroup）；不传类别就没有这一行。
const labels: NewsFeedLabels = {
  all: '全部',
  feed: '公告流',
  channels: '频道',
  sources: '来源',
  clearSources: '清除来源',
  categories: '公告类别',
  clearCategories: '清除类别',
  search: '搜索',
  layout: '排法',
  layoutList: '列表',
  layoutCard: '卡片',
  pause: '暂停',
  resume: '继续',
  newItems: (n) => `${n} 条新消息`,
  ago: (s) => `${s}s`,
  absolute: (t) => String(t),
  important: '重要',
  empty: '没有',
}
const items: NewsItem[] = [
  { id: 'a', time: 3, channel: 'c', source: 's', title: '甲 增持', category: 'buy' },
  { id: 'b', time: 2, channel: 'c', source: 's', title: '乙 减持', category: 'sell' },
  { id: 'c', time: 1, channel: 'c', source: 's', title: '丙 年报' },
]
const render = (extra: Record<string, unknown> = {}) =>
  renderToStaticMarkup(
    <NewsFeed
      items={items}
      channels={[{ value: 'c', label: '频道一' }]}
      sources={[{ value: 's', label: '来源一' }]}
      now={10}
      labels={labels}
      {...extra}
    />,
  )

describe('NewsFeed 类别筛选', () => {
  const categories = [
    { value: 'buy', label: '增持' },
    { value: 'sell', label: '减持' },
  ]

  it('传了 categories：来源行下面多一组类别芯片（多选，读屏名取 labels.categories）；不传、或没写读屏名就没有这一行', () => {
    const html = render({ categories })
    expect(html).toContain('class="k-chips k-news-categories"')
    expect(html).toContain('aria-label="公告类别"')
    expect(html).toContain('<span>增持</span>')
    expect(html).toContain('<span>减持</span>')
    expect(render()).not.toContain('k-news-categories')
    expect(render({ categories: [] })).not.toContain('k-news-categories')
    expect(render({ categories, labels: { ...labels, categories: undefined } })).not.toContain('k-news-categories')
  })

  it('类别是「或」的多选：空是全部；选了类别，没带类别的条目被筛掉', () => {
    const base = { channel: '', sources: [], query: '' }
    expect(filterNews(items, base)).toHaveLength(3)
    expect(filterNews(items, { ...base, categories: [] })).toHaveLength(3)
    expect(filterNews(items, { ...base, categories: ['buy'] }).map((i) => i.id)).toEqual(['a'])
    expect(filterNews(items, { ...base, categories: ['buy', 'sell'] }).map((i) => i.id)).toEqual(['a', 'b'])
  })
})

// #270（KATANAview #2189）：服务端分页的新闻流要的五组属性。每组都有一项「去掉就红」的断言。
describe('NewsFeed 外部筛选（filtering）', () => {
  const picked = { channel: 'other', sources: [], categories: [], query: 'zzz-no-match', facets: {} }
  const titlesIn = (html: string) => ['甲 增持', '乙 减持', '丙 年报'].filter((t) => html.includes(t))

  it('external：不自己筛，过滤条的值筛不掉任何一条；internal 同样的值全筛掉', () => {
    expect(titlesIn(render({ filtering: 'external', filter: picked }))).toEqual(['甲 增持', '乙 减持', '丙 年报'])
    expect(titlesIn(render({ filtering: 'internal', filter: picked }))).toEqual([])
  })
  it('受控：filter 的值落到过滤条上（搜索框的字、频道分段的选中项）', () => {
    const html = render({ filtering: 'external', filter: { ...picked, query: '要找的字', channel: 'c' } })
    expect(html).toContain('value="要找的字"')
    // 频道一那颗按钮是按下的（后面的「列表」也是按下的，所以只看到下一个 button 之前）。
    expect(html).toMatch(/aria-pressed="true"(?:(?!<button).)*?频道一/)
  })
  it('默认 internal：不传 filtering 与传 internal 一样，条目照旧被自己的过滤条筛', () => {
    expect(render({ filter: picked })).toBe(render({ filter: picked, filtering: 'internal' }))
    expect(titlesIn(render())).toHaveLength(3)
  })
})

describe('NewsFeed 标题后的标签', () => {
  const tagged: NewsItem[] = [
    { ...items[0]!, tags: [{ label: '公告' }, { label: '利好', tone: 'info' }, { label: '风险', tone: 'warn' }] },
    { ...items[1]!, tags: [] },
    items[2]!,
  ]
  it('按顺序画在标题后面，语气默认 neutral，只有 neutral / info / warn 三档', () => {
    const html = render({ items: tagged })
    const tags = [...html.matchAll(/<span class="k-news-tag" data-tone="(\w+)">([^<]*)<\/span>/g)].map((m) => [
      m[2],
      m[1],
    ])
    expect(tags).toEqual([
      ['公告', 'neutral'],
      ['利好', 'info'],
      ['风险', 'warn'],
    ])
    expect(html.indexOf('甲 增持')).toBeLessThan(html.indexOf('k-news-tag'))
    expect(html).not.toMatch(/data-tone="(up|down|ok|danger)"/)
  })
  it('没有标签的条目没有 extras 容器（行的结构与以前一样）；compact 不画', () => {
    expect(render()).not.toContain('k-news-extras')
    expect(render({ items: [tagged[1]!] })).not.toContain('k-news-extras')
    const compactHtml = renderToStaticMarkup(
      <EmphasisProvider value="compact">
        <NewsFeed items={tagged} channels={[]} sources={[]} now={10} labels={labels} />
      </EmphasisProvider>,
    )
    expect(compactHtml).not.toContain('k-news-tag')
  })
})

describe('NewsFeed 来源数', () => {
  const merged = (extra: Partial<NewsItem>): NewsItem[] => [{ ...items[0]!, ...extra }]
  it('sourcesCount 大于 1 才写，默认英文，labels.sourceCount 可换', () => {
    expect(render({ items: merged({ sourcesCount: 3 }) })).toContain('<span class="k-news-sources">3 sources</span>')
    expect(render({ items: merged({ sourcesCount: 1 }) })).not.toContain('k-news-sources')
    expect(render({ items: merged({}) })).not.toContain('k-news-sources')
    const zh = render({
      items: merged({ sourcesCount: 3 }),
      labels: { ...labels, sourceCount: (n: number) => `${n} 源` },
    })
    expect(zh).toContain('>3 源<')
  })
  it('alsoFrom 给了来源数就是可聚焦的字（悬停与聚焦出说明）；没给就是一段字', () => {
    const html = render({ items: merged({ sourcesCount: 2, alsoFrom: ['路透', '彭博'] }) })
    expect(html).toContain('class="k-news-sources" tabindex="0" data-also=""')
    expect(render({ items: merged({ sourcesCount: 2, alsoFrom: [] }) })).not.toContain('data-also')
  })
})

describe('NewsFeed 滚到底加载（endState）', () => {
  const html = (endState?: unknown, extra: Record<string, unknown> = {}) => render({ endState, ...extra })
  it('没有 onEndReached 与 endState：底部没有这一行', () => {
    expect(render()).not.toContain('k-news-end')
  })
  it('more：看不见的哨兵；只给 onEndReached 也是 more', () => {
    expect(html('more')).toContain('class="k-news-end" data-state="more" aria-hidden="true"')
    expect(render({ onEndReached: () => {} })).toContain('data-state="more"')
  })
  it('loading：读屏 status，默认英文，labels.end 可换', () => {
    expect(html('loading')).toContain('data-state="loading" role="status"')
    expect(html('loading')).toContain('Loading more…')
    expect(html('loading', { labels: { ...labels, end: { loadingMore: '加载中' } } })).toContain('加载中')
  })
  it('end：写「到底了」；列表空着时不写（空态已经说了）', () => {
    expect(html('end')).toContain('No more items')
    expect(html('end', { items: [] })).not.toContain('k-news-end')
    expect(html('more', { items: [] })).toContain('data-state="more"')
  })
  it('error：写原因，给重试按钮（role=alert）', () => {
    const out = html({ error: '网络断了', retry: () => {} }, { labels: { ...labels, end: { retry: '重试' } } })
    expect(out).toContain('data-state="error" role="alert"')
    expect(out).toContain('网络断了')
    expect(out).toMatch(/<button[^>]*>重试<\/button>/)
  })
  it('加载骨架时不画底部那一行', () => {
    expect(html('more', { loading: true })).not.toContain('k-news-end')
  })
})

describe('NewsFeed 分组小标题（groupBy）', () => {
  const groupBy = (item: NewsItem) => ({ key: item.category ?? 'none', label: item.category ?? '未分类', count: 7 })
  it('每一段连续同组的条目前面出一个小标题（heading），带条数；组序是调用方给的顺序，不按时间重排', () => {
    const html = render({ groupBy })
    const labelsInOrder = [...html.matchAll(/role="heading" aria-level="3">([^<]*)</g)].map((m) => m[1])
    expect(labelsInOrder).toEqual(['buy', 'sell', '未分类'])
    expect(html).toContain('<span class="k-news-group-count">7</span>')
  })
  it('分组时保持 items 的顺序（不按时间排）', () => {
    const reversed = [items[2]!, items[1]!, items[0]!]
    const html = render({ items: reversed, groupBy })
    expect(html.indexOf('丙 年报')).toBeLessThan(html.indexOf('乙 减持'))
    expect(html.indexOf('乙 减持')).toBeLessThan(html.indexOf('甲 增持'))
  })
  it('不分组就没有小标题', () => {
    expect(render()).not.toContain('k-news-group')
  })
})

describe('NewsFeed 精简外壳（chrome）', () => {
  const channelsAndSources = { channels: [{ value: 'c', label: '频道一' }], sources: [{ value: 's', label: '来源一' }] }
  it('bare：没有标题行、频道、搜索、排法与过滤区，只有列表；full（默认）都有', () => {
    const full = render({ ...channelsAndSources, labels: { ...labels, collapse: '收起过滤' } })
    expect(full).toContain('k-news-top')
    expect(full).toContain('k-news-head')
    expect(full).toContain('k-chips')
    const bare = render({ ...channelsAndSources, chrome: 'bare', labels: { ...labels, collapse: '收起过滤' } })
    for (const gone of ['k-news-top', 'k-news-head', 'k-chips', 'type="search"']) expect(bare).not.toContain(gone)
    expect(bare).toContain('data-chrome="bare"')
    expect(bare).toContain('k-news-items')
    expect(bare).toContain('甲 增持')
  })
})
