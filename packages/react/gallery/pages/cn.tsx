// SPDX-License-Identifier: MIT
import { DataGrid, type GridColumn, type GridColumnLayout } from '../../src/blocks/index.ts'
import {
  BoardMark,
  LimitStatus,
  StreakBadge,
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
