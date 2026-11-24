// SPDX-License-Identifier: MIT
// 研究资料与日历（#226）的演示数据：日历事件是编的示例（日期按 2026 年的星期排，不是交易所公告），资料与模板是示例文字，不是真实研报或策略。
import type { CalendarDayEvent, CalendarInsight } from '../src/patterns/calendar-events.tsx'
import type { ImportItem } from '../src/patterns/file-import.tsx'
import type { TemplateGroup } from '../src/patterns/template-library.tsx'

export const EXAMPLE_EVENTS: Readonly<Record<string, readonly CalendarDayEvent[]>> = {
  '2026-11-12': [{ label: '美国 CPI', tone: 'warn' }],
  '2026-11-19': [{ label: 'NVDA 财报', tone: 'neutral' }],
  '2026-11-20': [
    { label: '期权到期', tone: 'warn' },
    { label: '600519 除权', tone: 'neutral' },
  ],
  '2026-11-25': [{ label: '000001 除权', tone: 'neutral' }],
  '2026-11-27': [{ label: '美股半日市', tone: 'danger' }],
  '2026-12-09': [
    { label: 'FOMC 利率决议', tone: 'danger' },
    { label: '美国 CPI', tone: 'warn' },
  ],
  '2026-12-18': [{ label: '期权到期', tone: 'warn' }],
}

export const EXAMPLE_INSIGHT: CalendarInsight = { text: '回放区间已避开 11-27 美股半日市（示例）', tone: 'ok' }

export const EXAMPLE_ITEMS: readonly ImportItem[] = [
  { id: 'r1', name: 'Alpha_Factor_Report_2026Q3.pdf', size: 2_411_000, status: 'uploading', progress: 62 },
  { id: 'r2', name: 'factors_2026.csv', size: 18_300_000, status: 'done' },
  { id: 'r3', name: 'backtest_result.parquet', size: 692_000, status: 'failed', error: '网络中断，已上传 0 字节' },
  { id: 'r4', name: 'https://example.com/research/semis-notes', status: 'queued' },
]

const meta = (by: string, at: string) => [
  { label: '创建人', value: `${by} · ${at}` },
  { label: '更新时间', value: at },
]

export const EXAMPLE_TEMPLATES: readonly TemplateGroup[] = [
  {
    id: 'mine',
    title: '我的模板',
    templates: [
      {
        id: 'my-momentum',
        title: '动量策略',
        badge: '使用中',
        meta: meta('我', '2026-11-20 09:10'),
        body: '标的池：沪深 300 成分股。\n信号：过去 12 个月收益剔除最近 1 个月，按截面分位排序。\n调仓：每月第一个交易日，等权持有前 20%。\n风控：单票上限 5%，行业偏离不超过 10%。',
        children: [
          {
            id: 'my-momentum-weekly',
            title: '动量策略 · 周频',
            meta: meta('我', '2026-11-21 18:02'),
            body: '同上，调仓改为每周一，换手上限 30%。',
          },
          {
            id: 'my-momentum-vol',
            title: '动量策略 · 波动率过滤',
            meta: meta('我', '2026-11-22 11:40'),
            body: '同上，高波动日（20 日波动率位于 90 分位以上）不开新仓。',
          },
        ],
      },
      {
        id: 'my-backtest',
        title: '回测配置 · 日线',
        meta: meta('我', '2026-11-18 21:30'),
        body: '区间：2018-01-01 至 2026-11-20。\n手续费：双边万 2.5，印花税千 0.5（卖出）。\n滑点：1 个 tick。\n基准：沪深 300。',
      },
    ],
  },
  {
    id: 'builtin',
    title: '内置模板',
    readOnly: true,
    templates: [
      {
        id: 'bi-reversion',
        title: '均值回归',
        meta: [{ label: '创建人', value: '内置' }],
        body: '标的池：流动性前 500。\n信号：收盘价相对 20 日均线的 z 分数，低于 -2 买入，回到 0 平仓。\n止损：z 分数低于 -3 或持有超过 10 个交易日。',
      },
      {
        id: 'bi-recap',
        title: '提示词 · 财报复盘',
        meta: [{ label: '创建人', value: '内置' }],
        body: '你是一名买方研究员。请依据下面的财报要点，用三段话写复盘：\n1. 收入与利润相对预期的偏差；\n2. 管理层对下季度的指引；\n3. 对我们持仓的影响与需要核对的数据。',
      },
    ],
  },
]
