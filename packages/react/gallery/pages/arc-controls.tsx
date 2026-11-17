// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { LiveToggle } from '../LiveToggle.tsx'
import { chance, pick, useLiveTicker, type Rng } from '../live-sim.ts'
import {
  ChipGroup,
  DateRangePicker,
  HoldToConfirm,
  JsonViewer,
  ShortcutRecorder,
  TreeView,
  type ChipItem,
  type DateRange,
  type DateRangeLabels,
  type JsonViewerLabels,
  type ShortcutRecorderLabels,
  type TreeNode,
} from '../../src/index.ts'
import {
  EventTimeline,
  type EventTimelineLabels,
  type SessionMinutes,
  type TimelineEvent,
} from '../../src/blocks/index.ts'
import { Row } from './parts.tsx'

// #1919 的操作与结构件的演示。数据都是演示用的（页上写明），不是行情。

export function HoldToConfirmDemo() {
  const [flattened, setFlattened] = useState(0)
  const [stopped, setStopped] = useState(0)
  return (
    <>
      <Row name="danger · 默认 2 秒">
        <HoldToConfirm
          labels={{ hint: '按住 2 秒，全部平仓', confirmed: '已平仓' }}
          onConfirm={() => setFlattened((n) => n + 1)}
        >
          全部平仓
        </HoldToConfirm>
        <output data-gallery-hold>已触发 {flattened} 次</output>
      </Row>
      <Row name="neutral · 1 秒">
        <HoldToConfirm
          tone="neutral"
          holdMs={1000}
          labels={{ hint: '按住 1 秒，停止策略' }}
          onConfirm={() => setStopped((n) => n + 1)}
        >
          停止策略
        </HoldToConfirm>
        <output data-gallery-hold-fast>已触发 {stopped} 次</output>
      </Row>
      <Row name="禁用">
        <HoldToConfirm disabled labels={{ hint: '按住 2 秒，全部撤单' }} onConfirm={() => {}}>
          全部撤单
        </HoldToConfirm>
      </Row>
      <p className="gal-note">演示：按钮不连任何账户，只计数。单击不会触发；按住不放，或键盘按住空格 / 回车。</p>
    </>
  )
}

const RECORDER_LABELS: ShortcutRecorderLabels = {
  empty: '未设置',
  recording: '按下新的快捷键',
  clear: '清除快捷键',
  conflict: (action) => `已被「${action}」使用`,
  needModifier: '要带 Ctrl、Alt、Shift 或 Meta',
}

// 演示用的占用表：另外两个动作的快捷键。
const TAKEN = { 'Ctrl+Shift+K': '全部撤单', 'Alt+B': '市价买入' }

export function ShortcutRecorderDemo() {
  const [flatten, setFlatten] = useState<string | null>('Ctrl+Shift+F')
  const [bare, setBare] = useState<string | null>(null)
  return (
    <>
      <Row name="平仓 · 有冲突表">
        <ShortcutRecorder
          label="全部平仓快捷键"
          value={flatten}
          onValueChange={setFlatten}
          labels={RECORDER_LABELS}
          conflicts={TAKEN}
        />
        <output data-gallery-recorder>{flatten ?? '未设置'}</output>
      </Row>
      <Row name="要求修饰键">
        <ShortcutRecorder
          label="切换品种快捷键"
          value={bare}
          onValueChange={setBare}
          labels={RECORDER_LABELS}
          requireModifier
        />
        <output data-gallery-recorder-mod>{bare ?? '未设置'}</output>
      </Row>
      <Row name="禁用">
        <ShortcutRecorder label="只读快捷键" value="F5" onValueChange={() => {}} labels={RECORDER_LABELS} disabled />
      </Row>
      <p className="gal-note">
        演示：占用表里是「全部撤单 = Ctrl+Shift+K」「市价买入 = Alt+B」，录到它们会提示冲突、不写入。
      </p>
    </>
  )
}

// 演示用的筛选项与命中数（不是行情）。
const CHIP_ITEMS: readonly ChipItem[] = [
  { value: 'cn', label: 'A 股', count: 38 },
  { value: 'hk', label: '港股', count: 12 },
  { value: 'us', label: '美股', count: 9 },
  { value: 'fut', label: '期货', count: 0, disabled: true },
  { value: 'crypto', label: '加密', count: 21 },
]

export function ChipGroupDemo() {
  const [markets, setMarkets] = useState<string[]>(['cn', 'crypto'])
  const [one, setOne] = useState<string[]>(['hk'])
  return (
    <>
      <Row name="多选 · 带清除">
        <ChipGroup
          label="市场"
          items={CHIP_ITEMS}
          value={markets}
          onValueChange={setMarkets}
          labels={{ clear: '清除筛选' }}
        />
        <output data-gallery-chips>{markets.join(',') || '无'}</output>
      </Row>
      <Row name="单选">
        <ChipGroup
          label="市场（单选）"
          selection="single"
          items={CHIP_ITEMS.slice(0, 3)}
          value={one}
          onValueChange={setOne}
        />
        <output data-gallery-chips-one>{one.join(',') || '无'}</output>
      </Row>
      <p className="gal-note">演示：芯片与命中数是演示用的，不是行情。单选点已选的取消；有选中项时末尾出现清除钮。</p>
    </>
  )
}

const RANGE_LABELS: DateRangeLabels = {
  start: '起点',
  end: '终点',
  pickRange: '选择区间',
  calendar: '区间日历',
  previousMonth: '上个月',
  nextMonth: '下个月',
  presets: '常用区间',
  preset: { today: '今天', week: '本周', month: '本月', ytd: '年初至今' },
  custom: '自定义',
}

// 演示固定「今天」是 2026-11-14（周六），预设与截图才不随真实日期变；应用里由显示时区算出来传进去。
export function DateRangePickerDemo() {
  const [range, setRange] = useState<DateRange | null>({ start: '2026-11-09', end: '2026-11-14' })
  return (
    <>
      <Row name="区间 + 预设">
        <DateRangePicker
          value={range}
          onValueChange={setRange}
          today="2026-11-14"
          labels={RANGE_LABELS}
          locale="zh-CN"
        />
        <output data-gallery-range>{range ? `${range.start} ~ ${range.end}` : '未选'}</output>
      </Row>
      <Row name="未选 · 限定范围">
        <DateRangePicker
          value={null}
          onValueChange={() => {}}
          today="2026-11-14"
          min="2026-01-01"
          max="2026-12-31"
          labels={RANGE_LABELS}
          locale="zh-CN"
        />
      </Row>
      <p className="gal-note">演示：「今天」固定为 2026-11-14（周六）。预设都是截至今天；日历是双月，点两下选起止。</p>
    </>
  )
}

// 演示用的分类树（不是真实的品种库或数据集）。
const TREE_ITEMS: readonly TreeNode[] = [
  {
    id: 'cn',
    label: 'A 股',
    count: 3,
    children: [
      {
        id: 'cn-main',
        label: '主板',
        count: 2,
        children: [
          { id: 'cn-sh', label: '沪市' },
          { id: 'cn-sz', label: '深市' },
        ],
      },
      { id: 'cn-star', label: '科创板' },
    ],
  },
  { id: 'hk', label: '港股', count: 1, children: [{ id: 'hk-main', label: '主板' }] },
  {
    id: 'crypto',
    label: '加密',
    count: 2,
    children: [
      { id: 'crypto-spot', label: '现货' },
      { id: 'crypto-perp', label: '永续', disabled: true },
    ],
  },
  { id: 'misc', label: '未分类' },
]

export function TreeViewDemo() {
  const [selected, setSelected] = useState<string[]>(['cn-sh'])
  const [opened, setOpened] = useState('无')
  return (
    <>
      <Row name="单选 · 默认展开 A 股">
        <div className="gal-tree" style={{ width: 240 }}>
          <TreeView
            label="品种分类"
            items={TREE_ITEMS}
            defaultExpandedKeys={['cn', 'cn-main']}
            selectedKeys={selected}
            onSelectionChange={setSelected}
            onAction={setOpened}
          />
        </div>
        <output data-gallery-tree>{selected.join(',') || '无'}</output>
        <output data-gallery-tree-open>{opened}</output>
      </Row>
      <p className="gal-note">演示：分类与数量是演示用的，不是真实的品种库。→ 展开、← 收起，↑↓ 走，Enter 激活。</p>
    </>
  )
}

const JSON_LABELS: JsonViewerLabels = {
  search: '在 JSON 里查找',
  matches: (count) => (count === 0 ? '没有命中' : `${count} 处命中`),
  more: (count) => `还有 ${count} 项`,
}

// 演示用的消息：照 EventTimeline 卡的场景（300750、账户 A）编的，不是真实的行情或订单。
const JSON_SAMPLE = {
  type: 'order.update',
  symbol: '300750',
  filled: true,
  price: 201.35,
  tags: ['账户 A', '盘中'],
  orders: [
    { id: 'FILL-0231', side: 'buy', price: 201.3, qty: 200 },
    { id: 'FILL-0240', side: 'sell', price: 203.1, qty: 400 },
  ],
  error: null,
  history: Array.from({ length: 5 }, (_, i) => i * 10),
}

export function JsonViewerDemo() {
  return (
    <>
      <Row name="折叠 + 查找">
        <div className="gal-json" style={{ width: 360 }}>
          <JsonViewer label="消息" value={JSON_SAMPLE} labels={JSON_LABELS} />
        </div>
      </Row>
      <Row name="展开两层 · 截断">
        <div className="gal-json" style={{ width: 360 }}>
          <JsonViewer
            label="长数组"
            value={{ rows: Array.from({ length: 12 }, (_, i) => ({ n: i })) }}
            labels={JSON_LABELS}
            defaultExpandDepth={2}
            maxChildren={4}
          />
        </div>
      </Row>
      <p className="gal-note">
        演示：消息是演示用的，不是真实的行情或订单。→ 展开、← 收起；查找会展开命中的祖先并高亮。
      </p>
    </>
  )
}

// 演示事件：照卡里的场景（A 股 300750、账户 A / B、run 2e52），时刻与内容都是编的演示数据，不是真实的公告、告警或成交。
// 显示时区 Asia/Shanghai；A 股交易时段 09:30–11:30、13:00–15:00（午休压成短带）。
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

// 实时模拟（演示）：每拍「现在」走两分钟（封顶 14:58，不出交易时段），约一半的拍来一个新事件；第一拍必来，手动步进有确定结果。
const LIVE_EVENTS: readonly { kind: TimelineEvent['kind']; label: string }[] = [
  { kind: 'anomaly', label: '放量拉升' },
  { kind: 'alert', label: '触及价位提醒' },
  { kind: 'notice', label: '新增公告' },
  { kind: 'run', label: 'RUN 完成' },
]
type LiveTimeline = { now: number; events: readonly TimelineEvent[] }
function timelineStep(state: LiveTimeline, rng: Rng, tick: number): LiveTimeline {
  const now = Math.min(state.now + 2 * 60_000, cst(D1, '14:58'))
  if (tick > 0 && !chance(rng, 0.5)) return { ...state, now }
  const made = pick(rng, LIVE_EVENTS)
  return {
    now,
    events: [...state.events, { id: `live-${tick}`, at: now, kind: made.kind, label: made.label, symbol: '300750' }],
  }
}

export function EventTimelineDemo() {
  const live = useLiveTicker<LiveTimeline>({ now: cst(D1, '14:30'), events: [] }, timelineStep, { intervalMs: 3000 })
  const [picked, setPicked] = useState<string | null>(null)
  const [brushed, setBrushed] = useState<string | null>(null)
  return (
    <>
      <Row>
        <LiveToggle labels={{ group: '数据刷新', live: '实时', paused: '暂停' }} />
      </Row>
      <Row>
        <span className="gal-cap" style={{ width: '100%' }}>
          单日 · 现在 · 可点可拖选
        </span>
        <div style={{ width: 640 }}>
          <EventTimeline
            label="事件流"
            events={[...TIMELINE_EVENTS, ...live.state.events]}
            timeZone="Asia/Shanghai"
            session={SESSION}
            now={live.state.now}
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
      </Row>
      <Row>
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
      </Row>
      <Row>
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
      </Row>
      <p className="gal-note">
        演示数据：A 股代码、账户与 run 编号照设计稿的场景编的，不是真实的公告、告警或成交。形状加颜色区分类别（圆 =
        异动，方 = 公告 / 警报，三角 = 成交，菱形 = run），发光只给异动。
      </p>
    </>
  )
}
