# EventTimeline

发现区的统一事件流（公告、告警、成交、数据源事件）：按显示时区的自然日分组，新的在前，每条一个钟点、一个按类型上色的圆点、标题加来源标签与说明。对设计稿的 EventTimeline 卡。功能参照 Arc，实现原创。

## Provide

`*` marks a required prop.

### EventTimeline

件只管分组与排版：事件从哪来、怎么翻页由应用定。region 角色；每天一段 section，日标题是 h3，事件是有序列表里的 li，钟点是 time。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `events` | `{ id: string; at: number; title: string; detail?: string; source?: string; tone?: TimelineTone }[]` | — | 事件。at 是毫秒时间戳；tone 是圆点颜色：neutral（默认）、up、down、warn、info。传进来的顺序不用排，件自己排；同一刻保持传入的先后。 |
| `timeZone` | `string` | — | 显示时区（IANA 名）：决定事件落在哪一天、钟点写几点。必填：件不读系统时区。 |
| `label` | `string` | — | 整条时间线的读屏名。 |
| `dayLabel` | `(day: string, count: number) => ReactNode` | — | 一天的标题：day 是 YYYY-MM-DD，count 是这天的事件数；今天 / 昨天怎么写由调用方定。 |
| `emptyText` | `ReactNode` | — | 没有事件时写的字。 |
| `onSelect` | `(event: TimelineEvent) => void` | — | 给了，每条事件变成按钮；不给就是纯展示。 |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { EventTimeline, type EventTimelineLabels, type SessionMinutes, type TimelineEvent } from '@katana-ui/react/blocks'

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
          onPick={(event) => setPicked(event.id)}
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
```

## States

- 有事件：每天一段，日标题粘在滚动容器顶上；竖线穿过当天的圆点。
- 圆点颜色：up / down 跟红涨绿跌设置走，warn 琥珀，info 蓝，neutral 灰。
- 可点（给了 onSelect）：悬停有底色，键盘焦点有环。
- 空：只写 emptyText。

## Don't

- 不要在件里取今天、昨天：日标题的字由 dayLabel 给，「今天」是应用知道的。
- 不要一次传几万条：它不做虚拟滚动，翻页或分段加载由应用管。
- 不要拿它画行情或逐笔成交：那些用 DataGrid。

## Composition

```
EventTimeline
  section × 天
    h3 日标题
    ol
      li × 事件：time、圆点、正文（标题 + 来源标签、说明；可点时是 button）
```

## Keyboard

- `Tab（可点时）`：在事件间走；Enter / 空格选中
