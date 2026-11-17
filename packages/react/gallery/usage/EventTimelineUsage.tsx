// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { EventTimeline, type EventTimelineLabels, type SessionMinutes, type TimelineEvent } from '../../src/blocks'

const cst = (day: string, hhmm: string) => Date.parse(`${day}T${hhmm}:00+08:00`)

const SESSION: SessionMinutes = [
  [570, 690],
  [780, 900],
]

const D1 = '2026-11-13'

const TIMELINE_EVENTS: readonly TimelineEvent[] = [
  { id: 'n1', at: cst(D1, '09:25'), kind: 'notice', label: '回购进展公告', symbol: '300750', ref: 'NEWS-8841' },
  { id: 'a1', at: cst(D1, '09:41'), kind: 'anomaly', label: '放量拉升', symbol: '300750', ref: '1m 量比 4.2' },
  {
    id: 'f1',
    at: cst(D1, '09:43'),
    kind: 'fill',
    side: 'buy',
    label: '买入 200 @ 201.30',
    symbol: '300750',
    account: 'A',
    ref: 'FILL-0231',
  },
  {
    id: 'f2',
    at: cst(D1, '09:43'),
    kind: 'fill',
    side: 'buy',
    label: '买入 300 @ 201.35',
    symbol: '300750',
    account: 'A',
    ref: 'FILL-0232',
  },
  {
    id: 'f3',
    at: cst(D1, '09:43'),
    kind: 'fill',
    side: 'buy',
    label: '买入 100 @ 201.40',
    symbol: '300750',
    account: 'B',
    ref: 'FILL-0233',
  },
  { id: 'l1', at: cst(D1, '10:12'), kind: 'alert', label: '上破 202.00', symbol: '300750', ref: 'ALERT-17' },
  { id: 'r1', at: cst(D1, '10:50'), kind: 'run', label: 'RUN 2e52 完成', ref: 'RUN 2e52' },
  { id: 'a2', at: cst(D1, '13:08'), kind: 'anomaly', label: '大单扫货', symbol: '300750', ref: '委托 +1.8%' },
  {
    id: 'f4',
    at: cst(D1, '13:31'),
    kind: 'fill',
    side: 'sell',
    label: '卖出 400 @ 203.10',
    symbol: '300750',
    account: 'A',
    ref: 'FILL-0240',
  },
  { id: 'n2', at: cst(D1, '14:20'), kind: 'notice', label: '董事会决议公告', symbol: '300750', ref: 'NEWS-8863' },
  { id: 'l2', at: cst(D1, '14:42'), kind: 'alert', label: '跌破 202.50', symbol: '300750', ref: 'ALERT-17' },
]

const MULTI_DAY: readonly TimelineEvent[] = [
  ...TIMELINE_EVENTS.slice(0, 6),
  { id: 'm1', at: cst('2026-11-12', '09:48'), kind: 'anomaly', label: '快速回落', symbol: '300750', ref: '1m -1.1%' },
  {
    id: 'm2',
    at: cst('2026-11-12', '10:05'),
    kind: 'fill',
    side: 'sell',
    label: '卖出 500 @ 199.80',
    symbol: '300750',
    account: 'B',
    ref: 'FILL-0221',
  },
  { id: 'm3', at: cst('2026-11-12', '14:10'), kind: 'run', label: 'RUN 1d07 完成', ref: 'RUN 1d07' },
]

const TIMELINE_LABELS: EventTimelineLabels = {
  kinds: { anomaly: '异动', notice: '公告', fill: '成交', alert: '警报', run: 'run' },
  now: '现在',
  count: (n) => `${n} 条`,
  cluster: (n) => `${n} 个事件`,
  buy: '买入',
  sell: '卖出',
  time: '时间',
  kind: '类别',
  content: '内容',
  ref: '关联',
  showTable: '表格',
  showTimeline: '时间线',
  day: (day, count) => `${day.slice(5)} · ${count} 条`,
  empty: '还没有事件',
}

export function EventTimelineUsage() {
  const [picked, setPicked] = useState<string | null>(null)
  const [brushed, setBrushed] = useState<string | null>(null)
  return (
    <>
      <span className="gal-cap" style={{ width: '100%' }}>
        单日 · 现在 · 可点可拖选
      </span>
      <div style={{ width: 640 }}>
        <EventTimeline
          label="事件流"
          events={TIMELINE_EVENTS}
          timeZone="Asia/Shanghai"
          session={SESSION}
          now={cst(D1, '14:30')}
          scope="300750 · 账户 A、B"
          labels={TIMELINE_LABELS}
          onSelect={(event) => setPicked(event.id)}
          onBrush={({ from, to }) =>
            setBrushed(`${new Date(from).toISOString().slice(11, 16)}–${new Date(to).toISOString().slice(11, 16)}`)
          }
        />
      </div>
      {picked && <output data-gallery-timeline>{picked}</output>}
      {brushed && <output data-gallery-brush>{brushed}</output>}

      <span className="gal-cap" style={{ width: '100%' }}>
        跨日 · 一天一行
      </span>
      <div style={{ width: 640 }}>
        <EventTimeline
          label="跨日事件流"
          events={MULTI_DAY}
          timeZone="Asia/Shanghai"
          session={SESSION}
          scope="300750"
          labels={TIMELINE_LABELS}
        />
      </div>

      <span className="gal-cap" style={{ width: '100%' }}>
        空态
      </span>
      <div style={{ width: 640 }}>
        <EventTimeline
          label="空事件流"
          events={[]}
          timeZone="Asia/Shanghai"
          session={SESSION}
          labels={TIMELINE_LABELS}
        />
      </div>
    </>
  )
}
