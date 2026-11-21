// SPDX-License-Identifier: MIT
import { readFileSync } from 'node:fs'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vite-plus/test'
import { EmphasisProvider, type Emphasis } from '../../layout/emphasis.tsx'
import { NewsFeed, type NewsFeedLabels } from './news-feed.tsx'
import type { NewsItem } from './news-feed-model.ts'

// NewsFeed 认分量（#115）：compact 一行一条，只有「时间 标题」；standard 是完整的新闻流；hero 标题字上一档。

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
  read: (m) => `${m} 分钟阅读`,
  collapse: '收起过滤',
}
const items: NewsItem[] = [
  {
    id: 'a',
    time: 3,
    channel: 'c',
    source: 's',
    title: '甲 增持',
    summary: '甲的摘要',
    category: 'buy',
    readMinutes: 2,
    symbols: [{ code: '600519', name: '茅台' }],
  },
  { id: 'b', time: 2, channel: 'c', source: 's', title: '乙 减持', important: true },
]
const newsCss = readFileSync(new URL('../../theme/news-feed.css', import.meta.url), 'utf8')

const render = (emphasis: Emphasis | null, extra: Record<string, unknown> = {}) => {
  const feed = (
    <NewsFeed
      items={items}
      channels={[{ value: 'c', label: '频道一' }]}
      sources={[{ value: 's', label: '来源一' }]}
      categories={[{ value: 'buy', label: '增持' }]}
      now={10}
      labels={labels}
      itemActions={() => [{ key: 'x', label: '动作', onSelect: () => {} }]}
      itemActionsLabel="快捷操作"
      {...extra}
    />
  )
  return renderToStaticMarkup(emphasis ? <EmphasisProvider value={emphasis}>{feed}</EmphasisProvider> : feed)
}

describe('NewsFeed 的分量', () => {
  it('standard（默认）：标题行、频道、搜索、来源、类别、品种、阅读时长、快捷操作都在', () => {
    const html = render(null)
    expect(html).toContain('data-emphasis="standard"')
    for (const kept of [
      'k-news-head',
      'k-news-top',
      'k-news-search',
      'k-news-categories',
      'k-news-symbols',
      'k-news-read',
      'data-actions',
    ])
      expect(html).toContain(kept)
    expect(html).toContain('k-news-source')
    expect(html).toContain('频道一')
  })

  it('compact：一行一条，只留时间和标题；频道、搜索、来源、类别、品种、阅读时长、快捷操作都不画', () => {
    const html = render('compact')
    expect(html).toContain('data-emphasis="compact"')
    for (const kept of ['甲 增持', '乙 减持', 'k-news-time', 'k-news-flag']) expect(html).toContain(kept)
    for (const gone of [
      'k-news-head',
      'k-news-top',
      'k-news-search',
      'k-news-categories',
      'k-news-symbols',
      'k-news-read',
      'k-news-source',
      'data-actions',
      '频道一',
      '来源一',
    ])
      expect(html).not.toContain(gone)
    expect(newsCss).toMatch(
      /\.k-news\[data-emphasis='compact'\]\[data-layout='list'\] \.k-news-item \{\s*grid-template-columns: auto minmax\(0, 1fr\);/,
    )
  })

  it('compact 把卡片排法退回列表（卡片才有的摘要不画）', () => {
    expect(render('standard', { defaultLayout: 'card' })).toContain('甲的摘要')
    const html = render('compact', { defaultLayout: 'card' })
    expect(html).toContain('data-layout="list"')
    expect(html).not.toContain('甲的摘要')
  })

  it('hero：内容跟 standard 一样完整，标题字上一档在样式里', () => {
    expect(render('hero')).toContain('data-emphasis="hero"')
    expect(render('hero')).toContain('k-news-top')
    expect(newsCss).toMatch(/\.k-news\[data-emphasis='hero'\] \.k-news-title \{\s*font-size: var\(--text-title-size\);/)
  })
})
