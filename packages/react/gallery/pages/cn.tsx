// SPDX-License-Identifier: MIT
import { DataGrid, type GridColumn, type GridColumnLayout } from '../../src/blocks/index.ts'
import {
  BoardMark,
  LimitStatus,
  LimitUpTimeline,
  MarketPulse,
  SentimentGauge,
  StreakBadge,
  ThemeCards,
  CN_SESSIONS,
  cnAxisPosition,
  cnLabelsZh,
  cnPhaseOf,
  cnTradingMinutesBetween,
  formatClock,
  formatCnAmount,
  parseClock,
  type BoardKind,
  type LimitStatusValue,
  type StreakValue,
  type ThemeCardData,
  type TimelineItem,
} from '../../src/cn/index.ts'
import { Cell, Row } from './parts.tsx'

// A 股件包（#110）的文档页演示。所有数据都是示例（页上写明），不是行情。

export function CnBasicsDemo() {
  const times = ['09:20', '09:25', '09:30', '11:30', '13:00', '14:49', '15:00']
  return (
    <>
      <p className="gal-note">示例数字与时刻：纯函数的输出，调用方自己传值。</p>
      <Row name="formatCnAmount">
        {[3_860, 12_500, 678_900, 123_456_789, 98_765_432_100, -5.4e7, null].map((value, index) => (
          <Cell key={index} name={String(value)}>
            <span data-testid={`cn-amount-${index}`}>{formatCnAmount(value)}</span>
          </Cell>
        ))}
      </Row>
      <Row name="时间轴位置（午休与 09:25–09:30 不占宽度）">
        {times.map((time) => (
          <Cell key={time} name={time}>
            <span data-testid={`cn-axis-${time}`}>{cnAxisPosition(parseClock(time))?.toFixed(3) ?? '—'}</span>
          </Cell>
        ))}
      </Row>
      <Row name="时段">
        {times.map((time) => (
          <Cell key={time} name={time}>
            <span>{cnPhaseOf(parseClock(time)) ?? '—'}</span>
          </Cell>
        ))}
      </Row>
      <Row name="交易分钟数">
        <Cell name="11:00 → 13:30">
          <span data-testid="cn-minutes">{cnTradingMinutesBetween(parseClock('11:00'), parseClock('13:30'))}</span>
        </Cell>
        <Cell name="时段表">
          <span>{CN_SESSIONS.map((s) => `${formatClock(s.from)}–${formatClock(s.to)}`).join(' · ')}</span>
        </Cell>
        <Cell name="默认文案（节选）">
          <span>{cnLabelsZh.streak.first}</span>
        </Cell>
      </Row>
    </>
  )
}

const STREAKS: readonly (readonly [string, number | StreakValue | null, 'boards' | 'promotion'])[] = [
  ['首板', 1, 'boards'],
  ['2 板', 2, 'boards'],
  ['3 板', 3, 'boards'],
  ['5 天 3 板', { boards: 3, days: 5 }, 'boards'],
  ['4 板', 4, 'boards'],
  ['7 板', 7, 'boards'],
  ['一进二', { boards: 2, promotedFrom: 1 }, 'promotion'],
  ['二进三', { boards: 3, promotedFrom: 2 }, 'promotion'],
  ['取不到', { boards: null, reason: '示例：行情源没给连板数' }, 'boards'],
]

type CnGridRow = { id: string; name: string; streak: number | StreakValue; status: LimitStatusValue }
const CN_ROWS: readonly CnGridRow[] = [
  { id: 'r1', name: '示例甲', streak: { boards: 5, days: 6 }, status: { status: 'sealed', sealAmount: 3.2e8 } },
  { id: 'r2', name: '示例乙', streak: 2, status: 'resealed' },
  { id: 'r3', name: '示例丙', streak: 1, status: 'broken' },
  { id: 'r4', name: '示例丁', streak: 3, status: 'oneWord' },
  { id: 'r5', name: '示例戊', streak: 1, status: 'limitDown' },
  { id: 'r6', name: '示例己', streak: 1, status: { status: 'auctionLimit', sealAmount: 5.6e7 } },
]
const CN_COLUMNS: readonly GridColumn<CnGridRow>[] = [
  { id: 'name', type: 'text', value: (row) => row.name },
  { id: 'streak', type: 'streak', value: (row) => row.streak },
  { id: 'status', type: 'limitStatus', value: (row) => row.status },
]
const CN_LAYOUT: readonly GridColumnLayout[] = [
  { id: 'name', label: '名称', width: 110, visible: true },
  { id: 'streak', label: '连板', width: 110, visible: true },
  { id: 'status', label: '状态', width: 150, visible: true },
]

function CnGrid({ testId }: { testId: string }) {
  return (
    <div data-testid={testId} style={{ display: 'flex', width: '100%', maxWidth: 420, height: 170 }}>
      <DataGrid
        columns={CN_COLUMNS}
        layout={CN_LAYOUT}
        rows={CN_ROWS}
        rowId={(row) => row.id}
        label="Example limit-up table"
        sort={null}
        onSortChange={() => {}}
        interactive={false}
        fit
      />
    </div>
  )
}

export function StreakBadgeDemo() {
  return (
    <>
      <p className="gal-note">示例数据。高度越高越醒目：只靠语义色调升档，涨色跟 data-updown。</p>
      <Row>
        {STREAKS.map(([name, streak, form]) => (
          <Cell key={name} name={name}>
            <StreakBadge streak={streak} form={form} />
          </Cell>
        ))}
      </Row>
      <p className="gal-note">DataGrid 的列类型 streak（可按板数排序）：</p>
      <CnGrid testId="cn-grid-streak" />
    </>
  )
}

const STATUSES: readonly (readonly [string, LimitStatusValue | null])[] = [
  ['封板', 'sealed'],
  ['封板 + 封单额', { status: 'sealed', sealAmount: 3.2e8 }],
  ['回封', 'resealed'],
  ['炸板', 'broken'],
  ['一字', 'oneWord'],
  ['竞价涨停', { status: 'auctionLimit', sealAmount: 5.6e7 }],
  ['跌停', 'limitDown'],
  ['取不到', { status: null, reason: '示例：盘后快照缺这只' }],
]

export function LimitStatusDemo() {
  return (
    <>
      <p className="gal-note">示例数据。封单额由件按万 / 亿写，悬停看「封单 x」。</p>
      <Row>
        {STATUSES.map(([name, status]) => (
          <Cell key={name} name={name}>
            <LimitStatus status={status} />
          </Cell>
        ))}
      </Row>
      <p className="gal-note">DataGrid 的列类型 limitStatus（可按状态排序）：</p>
      <CnGrid testId="cn-grid-status" />
    </>
  )
}

const BOARDS: readonly (readonly [string, BoardKind | null])[] = [
  ['主板（cm 模式不画）', 'main'],
  ['创业板', 'gem'],
  ['科创板', 'star'],
  ['北交所', 'bj'],
  ['ST', 'st'],
  ['取不到', null],
]

export function BoardMarkDemo() {
  return (
    <>
      <p className="gal-note">示例：默认写涨跌幅限制（20cm、30cm），主板不画。</p>
      <Row name="display=cm">
        {BOARDS.map(([name, kind]) => (
          <Cell key={name} name={name}>
            <BoardMark kind={kind} />
            {kind === 'main' && <span className="gal-note">（空）</span>}
          </Cell>
        ))}
      </Row>
      <Row name="display=name">
        {BOARDS.map(([name, kind]) => (
          <Cell key={name} name={name}>
            <BoardMark kind={kind} display="name" />
          </Cell>
        ))}
      </Row>
      <Row name="display=both">
        {BOARDS.map(([name, kind]) => (
          <Cell key={name} name={name}>
            <BoardMark kind={kind} display="both" />
          </Cell>
        ))}
      </Row>
    </>
  )
}

// 题材卡（#110）：示例数据，题材、个股、催化都是虚构的，不是行情。
const THEME_DATA: readonly ThemeCardData[] = [
  {
    key: 't1',
    name: '示例题材甲',
    catalyst: { text: '示例催化：某行业协会发布面向全行业的供应链警报，上游价格联动上调', source: '示例来源' },
    members: [
      { code: '000001', name: '示例股一', time: '09:36', streak: 2 },
      { code: '000002', name: '示例股二', time: '09:36', streak: 1 },
      { code: '000003', name: '示例股三', time: '10:00', streak: 1 },
      { code: '000004', name: '示例股四', time: '10:04', streak: 1 },
      { code: '000005', name: '示例股五', time: '11:20', streak: { boards: 3, days: 4 } },
    ],
  },
  {
    key: 't2',
    name: '示例题材乙',
    catalyst: { text: '示例催化：行业新品发布，规划年内量产', source: '示例来源' },
    members: [
      { code: '000011', name: '示例股六', time: '10:14', streak: 1 },
      { code: '000012', name: '示例股七', time: '10:34', streak: 1 },
      { code: '000013', name: '示例股八', time: '11:06', streak: 1 },
    ],
  },
  {
    key: 't3',
    name: '示例题材丙',
    catalyst: null,
    catalystReason: '示例：今日没有可核对的催化',
    members: [
      { code: '000021', name: '示例股九', time: '09:42', streak: 1 },
      { code: '000022', name: '示例股十', time: '14:49', streak: 1 },
    ],
  },
  { key: 't4', name: '示例题材丁', limitUpCount: null, catalyst: null, members: [] },
]

export function ThemeCardDemo() {
  return (
    <>
      <p className="gal-note">示例数据：多张卡横排，排序由调用方排；催化一行省略号，悬停看全文与来源。</p>
      <div className="gal-wide" data-testid="theme-cards" style={{ maxWidth: 960 }}>
        <ThemeCards themes={THEME_DATA} onOpen={() => {}} onSelectMember={() => {}} />
      </div>
    </>
  )
}

// 市场全景条（#110）：示例数据，不是行情。
const PULSE_BINS = [
  { key: 'b0', label: '<-10', count: 119, tone: 'down' },
  { key: 'b1', label: '-10', count: 946, tone: 'down' },
  { key: 'b2', label: '-7', count: 1761, tone: 'down' },
  { key: 'b3', label: '-5', count: 1381, tone: 'down' },
  { key: 'b4', label: '-3', count: 1032, tone: 'down' },
  { key: 'b5', label: '0', count: 31, tone: 'muted' },
  { key: 'b6', label: '0+', count: 211, tone: 'up' },
  { key: 'b7', label: '3', count: 37, tone: 'up' },
  { key: 'b8', label: '5', count: 8, tone: 'up' },
  { key: 'b9', label: '7', count: 28, tone: 'up' },
  { key: 'b10', label: '>10', count: 18, tone: 'up' },
] as const

export function MarketPulseDemo() {
  return (
    <>
      <p className="gal-note">示例数据：占比由三个家数算出；取不到的读数写「—」，悬停看原因。</p>
      <div className="gal-wide" data-testid="market-pulse" style={{ maxWidth: 1180 }}>
        <MarketPulse
          counts={{ rising: 302, falling: 5239, limitUp: 30, limitDown: 62, flat: 31 }}
          readings={{
            nonStLimitUp: 28,
            broken: 10,
            highestBoard: 4,
            limitUpAmount: { value: null, reason: '示例：日内未知' },
            sealEstimate: 2.283e9,
            yesterdayLimitUp: 23,
            yesterdayLimitDown: 68,
            yesterdayBroken: 24,
            turnover: { value: null, reason: '示例：成交额还没给' },
            turnoverForecast: null,
            mainNetInflow: null,
          }}
          basis="示例基准日"
          distribution={{ bins: PULSE_BINS }}
        />
      </div>
    </>
  )
}

// 涨停时间线（#110）：示例数据，股票、题材与时刻都是虚构的，不是行情。
const TL_THEMES = ['示例题材甲', '示例题材乙', '示例题材丙', '示例题材丁']
const TL_TIMES = [
  '09:20',
  '09:31',
  '09:36',
  '09:36',
  '09:42',
  '09:56',
  '10:00',
  '10:04',
  '10:14',
  '10:17',
  '10:30',
  '10:34',
  '10:47',
  '11:06',
  '11:17',
  '11:20',
  '11:20',
  '13:00',
  '13:04',
  '13:11',
  '14:07',
  '14:40',
  '14:45',
  '14:49',
]
const TIMELINE_ITEMS: readonly TimelineItem[] = TL_TIMES.map((time, i) => ({
  code: String(600000 + i * 7),
  name: `示例股${i + 1}`,
  time,
  streak: i % 9 === 3 ? { boards: 4, days: 5 } : i % 5 === 1 ? 2 : 1,
  themes: [TL_THEMES[i % 4]!],
  amount: i % 7 === 6 ? null : (i + 1) * 3.7e7,
  board: i % 6 === 2 ? 'gem' : i % 11 === 5 ? 'star' : undefined,
}))

export function LimitUpTimelineDemo() {
  return (
    <>
      <p className="gal-note">
        示例数据：同一分钟封板的票并成一站，站点等距排（午休不占宽度），按时段着色；点排序、点题材 chip
        试试。没有封板时刻的票不上轴。
      </p>
      <div className="gal-wide" data-testid="limit-up-timeline" style={{ maxWidth: 1000 }}>
        <LimitUpTimeline items={TIMELINE_ITEMS} onSelect={() => {}} />
      </div>
    </>
  )
}

// 情绪温度（#110）：示例数据，评分与口径都是演示，不是行情。
export function SentimentGaugeDemo() {
  return (
    <>
      <p className="gal-note">示例数据：评分与口径由调用方给；取不到写「—」。</p>
      <Row>
        <div className="gal-wide" data-testid="sentiment" style={{ maxWidth: 300 }}>
          <SentimentGauge
            score={62}
            basis="示例口径 · 规则评分 · 未历史校准"
            today={{ limitUp: 30, limitDown: 62, sealRate: 62.5, broken: 10 }}
            yesterday={{
              limitUp: 23,
              limitDown: 68,
              sealRate: 48,
              broken: { value: null, reason: '示例：昨日未记录' },
            }}
          />
        </div>
        <div className="gal-wide" data-testid="sentiment-cold" style={{ maxWidth: 300 }}>
          <SentimentGauge score={12} basis="示例口径" />
        </div>
        <div className="gal-wide" data-testid="sentiment-none" style={{ maxWidth: 300 }}>
          <SentimentGauge score={null} reason="示例：评分数据没到" />
        </div>
      </Row>
    </>
  )
}
