// SPDX-License-Identifier: MIT
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vite-plus/test'
import { NewsFeed, type NewsFeedLabels } from './news-feed.tsx'
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
