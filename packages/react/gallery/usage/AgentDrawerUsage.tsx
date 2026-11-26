// SPDX-License-Identifier: MIT
import { CircleDollarSign, Clock } from 'lucide-react'
import { useState } from 'react'
import {
  AgentDrawer,
  type AgentActivityDay,
  type AgentDrawerLabels,
  type AgentRecentRun,
  type AgentStatus,
} from '../../src/blocks'
import { Button } from '../../src/index'

// 示例数据：「盘前扫描」Agent，每个交易日 08:30 跑一次，周末不跑。次数是手写公式算的演示值，不是任何真实 Agent 的记录；时钟固定在 NOW（件不读钟）。
const NOW = Date.parse('2026-11-23T09:00:00Z')
const FROM = '2026-09-01'
const TO = '2026-11-23'
const DAYS: readonly AgentActivityDay[] = Array.from({ length: 84 }, (_, index) => {
  const date = new Date(Date.parse(`${FROM}T00:00:00Z`) + index * 86_400_000).toISOString().slice(0, 10)
  const weekday = new Date(`${date}T00:00:00Z`).getUTCDay()
  return { date, count: weekday === 0 || weekday === 6 ? 0 : (index * 7 + (index % 5) * 3) % 13 }
})

const MONTHS = ['1 月', '2 月', '3 月', '4 月', '5 月', '6 月', '7 月', '8 月', '9 月', '10 月', '11 月', '12 月']
const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']

const RUNS: readonly AgentRecentRun[] = [
  { id: 'r5', actor: '交易日 08:30', trigger: 'schedule', result: 'running', startedAt: NOW - 6 * 60_000 },
  {
    id: 'r4',
    actor: '价格突破 600519',
    trigger: 'event',
    result: 'failed',
    startedAt: NOW - 20 * 60_000,
    durationMs: 8_000,
  },
  { id: 'r3', actor: '林静', trigger: 'manual', result: 'ok', startedAt: NOW - 48 * 60_000, durationMs: 41_000 },
  {
    id: 'r2',
    actor: '新研报 · 医药行业周报',
    trigger: 'upload',
    result: 'ok',
    startedAt: NOW - 3_600_000,
    durationMs: 63_000,
  },
  { id: 'r1', actor: '交易日 08:30', trigger: 'schedule', result: 'cancelled', startedAt: NOW - 86_400_000 },
]

const LABELS: AgentDrawerLabels = {
  properties: { status: '状态', tags: '标签', trigger: '触发', owner: '负责人', created: '创建时间' },
  statuses: { running: '在跑', paused: '暂停', disabled: '停用' },
  triggers: { schedule: '定时', event: '事件', upload: '上传', manual: '手动' },
  results: { ok: '成功', failed: '失败', running: '在跑', cancelled: '已取消' },
  tabs: { list: 'Agent 档案', usage: '用量', configure: '配置', history: '历史' },
  activity: '活动',
  activityGrid: '最近 12 周每天跑的次数',
  legend: { less: '少', more: '多' },
  recentRuns: '最近运行',
  noRuns: '还没有运行',
  metrics: '用量指标',
}

const minutes = (at: number) => {
  const diff = Math.max(0, NOW - at)
  return diff < 3_600_000
    ? `${Math.max(1, Math.round(diff / 60_000))} 分钟前`
    : diff < 86_400_000
      ? `${Math.round(diff / 3_600_000)} 小时前`
      : '昨天'
}

export function AgentDrawerUsage({ status = 'running' }: { status?: AgentStatus }) {
  // 点一行最近运行只回调运行 id：这里记下来写在下面一行（接 AgentRunDetail 时在这里打开它）。
  const [opened, setOpened] = useState<string | null>(null)
  return (
    <div style={{ width: 380 }}>
      <div style={{ height: 640, border: '1px solid var(--k-separable-secondary-borderColor)' }}>
        <AgentDrawer
          name="盘前扫描"
          description="每个交易日开盘前扫一遍自选，把隔夜公告、跳空和异常放量写成一页摘要。"
          status={status}
          tags={['行情', '盘前']}
          trigger={{ kind: 'schedule', detail: '交易日 08:30' }}
          owner={{ name: '林静' }}
          created="2026-05-09"
          metrics={[
            {
              id: 'saved',
              label: '节省时间',
              value: '155',
              unit: '小时',
              icon: <Clock />,
              delta: { text: '+8%', tone: 'ok' },
            },
            {
              id: 'cost',
              label: '本月花费',
              value: '¥1,180',
              icon: <CircleDollarSign />,
              delta: { text: '+15%', tone: 'warn' },
            },
          ]}
          activity={{
            days: DAYS,
            from: FROM,
            to: TO,
            monthLabels: MONTHS,
            weekdayLabels: WEEKDAYS,
            describe: ({ date, count }) =>
              count === 0 ? `${date.slice(5)} 没跑` : `${date.slice(5)} 跑了 ${count} 次`,
            idle: '共 12 周，悬停或用方向键看某一天',
          }}
          runs={status === 'running' ? RUNS : RUNS.slice(1)}
          onOpenRun={setOpened}
          formatTime={minutes}
          formatDuration={(ms) => `${Math.round(ms / 1000)} 秒`}
          configure={<p style={{ padding: 16, margin: 0 }}>配置页由调用方给：触发规则、数据源、提示词。</p>}
          history={<p style={{ padding: 16, margin: 0 }}>历史页由调用方给：改动记录。</p>}
          footer={
            <>
              <Button>通知我</Button>
              <Button>{status === 'running' ? '暂停' : '继续'}</Button>
            </>
          }
          labels={LABELS}
        />
      </div>
      <p
        data-testid="agent-drawer-opened"
        style={{ margin: '8px 0 0', font: 'var(--text-caption) var(--font-sans-small)' }}
      >
        {opened === null ? '点一行最近运行，这里写它的运行 id' : `onOpenRun：${opened}`}
      </p>
    </div>
  )
}
