// SPDX-License-Identifier: MIT
import { useState } from 'react'
import {
  NewsFeed,
  PanelFrame,
  PanelFrameBody,
  PanelFrameHeader,
  type NewsFeedLabels,
  type NewsItem,
} from '../../src/blocks'
import { Button, symbolMenu } from '../../src/index'

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
                onSymbolPick={(s) => setPicked(s.code)}
                itemActionsLabel="新闻操作"
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
