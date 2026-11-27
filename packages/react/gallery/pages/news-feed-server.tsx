// SPDX-License-Identifier: MIT
// NewsFeed 给服务端分页的数据用的三个演示（#270）：外部筛选 + 滚到底加载（假服务端：200 条、一页 40 条、延迟 400ms）、1 万条虚拟滚动、侧栏（bare）加分组小标题。
// 数据都是虚构的；时间固定在 now，所以每次打开都一样。
import { useMemo, useRef, useState } from 'react'
import {
  NewsFeed,
  type NewsEndState,
  type NewsFeedLabels,
  type NewsFilter,
  type NewsGroup,
  type NewsItem,
} from '../../src/blocks/index.ts'
import { Button, Switch } from '../../src/index.ts'

const MIN = 60_000
const TOPICS = ['产能爬坡', '回购方案', '供货协议', '临床进展', '指数调整', '业绩预告', '董事变动', '海外订单']

/** 一条演示新闻：标签、来源数都带上，用来看行高算得对不对。 */
function makeItem(i: number, now: number, titleExtra = ''): NewsItem {
  const topic = TOPICS[i % TOPICS.length]!
  return {
    id: `srv-${i}`,
    time: now - (i + 1) * MIN,
    channel: i % 2 ? 'top' : 'flash',
    source: ['wire', 'desk', 'exch'][i % 3]!,
    title: `第 ${i + 1} 条：${topic}${titleExtra}`,
    symbols: i % 4 === 0 ? [{ code: '600001', name: '星河锂业' }] : undefined,
    tags: [
      { label: ['公告', '政策', '行业'][i % 3]!, tone: 'neutral' },
      { label: ['利好', '利空', '中性', '未标'][i % 4]!, tone: i % 4 === 3 ? 'warn' : 'info' },
    ],
    sourcesCount: i % 5 === 0 ? 2 + (i % 3) : undefined,
    alsoFrom: i % 5 === 0 ? ['演示快讯', '演示财经'].slice(0, 1 + (i % 2)) : undefined,
  }
}

const SERVER_TOTAL = 200
const PAGE = 40
const DELAY_MS = 400

/** 假服务端：按过滤条件取前 n 条（条件由服务端判，件里不再筛）。 */
function query(filter: NewsFilter, now: number, count: number) {
  const phrase = filter.query.trim()
  const matched = Array.from({ length: SERVER_TOTAL }, (_, i) => makeItem(i, now)).filter(
    (item) => (filter.channel === '' || item.channel === filter.channel) && item.title.includes(phrase),
  )
  return { rows: matched.slice(0, count), total: matched.length }
}

/** 外部筛选 + 滚到底加载：过滤条受控，条件一变就「向服务端取」，滚到底再取下一页，出错给重试。 */
export function NewsFeedServerDemo({ labels, now }: { labels: NewsFeedLabels; now: number }) {
  const [filter, setFilter] = useState<NewsFilter>({ channel: '', sources: [], query: '' })
  const [state, setState] = useState(() => ({ rows: query(filter, now, PAGE).rows, end: 'more' as NewsEndState }))
  const [requests, setRequests] = useState(0)
  const token = useRef(0)
  const failNext = useRef(false)

  const fetchPage = (next: NewsFilter, have: number) => {
    const mine = ++token.current
    setRequests((n) => n + 1)
    setState((prev) => ({ ...prev, end: 'loading' }))
    setTimeout(() => {
      if (mine !== token.current) return
      if (failNext.current) {
        failNext.current = false
        setState((prev) => ({
          ...prev,
          end: { error: '这一页没取到（演示）', retry: () => fetchPage(next, have) },
        }))
        return
      }
      const { rows, total } = query(next, now, have + PAGE)
      setState({ rows, end: rows.length >= total ? 'end' : 'more' })
    }, DELAY_MS)
  }

  return (
    <div className="gal-stack" style={{ width: '100%' }}>
      <p className="gal-note">
        外部筛选 + 滚到底加载：件不自己筛，过滤条的值报给「服务端」，条目由它按条件取回（共 {SERVER_TOTAL} 条，一页{' '}
        {PAGE} 条，延迟 {DELAY_MS}ms）。已取 <span data-testid="news-server-count">{state.rows.length}</span> 条，请求{' '}
        <span data-testid="news-server-requests">{requests}</span> 次。
      </p>
      <div>
        <Button
          data-testid="news-server-fail"
          onClick={() => {
            failNext.current = true
          }}
        >
          下一页失败一次
        </Button>
      </div>
      <div style={{ height: 360 }} data-testid="news-server">
        <NewsFeed
          items={state.rows}
          channels={[
            { value: 'flash', label: '快讯' },
            { value: 'top', label: '要闻' },
          ]}
          sources={[]}
          now={now}
          labels={labels}
          filtering="external"
          filter={filter}
          onFilterChange={(next) => {
            setFilter(next)
            fetchPage(next, 0)
          }}
          onEndReached={() => fetchPage(filter, state.rows.length)}
          endState={state.end}
        />
      </div>
    </div>
  )
}

/** 1 万条：件里的筛选照旧（internal），虚拟列表只画看得见的那几十行。 */
const TEN_THOUSAND = 10_000
export function NewsFeedTenThousandDemo({ labels, now }: { labels: NewsFeedLabels; now: number }) {
  const [on, setOn] = useState(false)
  const items = useMemo(
    () =>
      on
        ? Array.from({ length: TEN_THOUSAND }, (_, i) =>
            makeItem(i, now, i % 4 === 3 ? '，演示用的补充说明文字用来拉长标题，让它折成两行'.repeat(2) : ''),
          )
        : [],
    [on, now],
  )
  return (
    <div className="gal-stack" style={{ width: '100%' }}>
      <label className="gal-note" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <Switch aria-label="1 万条" checked={on} onCheckedChange={setOn} data-testid="news-10k" />1
        万条（虚拟滚动，只画看得见的行；条目带标签与来源数）
      </label>
      <div style={{ height: 360 }} data-testid="news-10k-frame">
        <NewsFeed items={items} channels={[]} sources={[]} now={now} labels={labels} chrome="bare" />
      </div>
    </div>
  )
}

/** 侧栏：chrome="bare" 只画列表；groupBy 每 50 条出一个小标题（条数由调用方给）。1000 条，所以虚拟列表里也有小标题。 */
const BLOCK = 50
export function NewsFeedSidebarDemo({ labels, now }: { labels: NewsFeedLabels; now: number }) {
  const [items] = useState(() => Array.from({ length: 1000 }, (_, i) => makeItem(i, now)))
  const groupBy = (item: NewsItem): NewsGroup => {
    const block = Math.floor(Number(item.id.slice(4)) / BLOCK)
    return { key: `block-${block}`, label: `第 ${block * BLOCK + 1}–${(block + 1) * BLOCK} 条`, count: BLOCK }
  }
  return (
    <div style={{ height: 360, width: 480 }} data-testid="news-bare">
      <NewsFeed items={items} channels={[]} sources={[]} now={now} labels={labels} chrome="bare" groupBy={groupBy} />
    </div>
  )
}
