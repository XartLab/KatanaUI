// SPDX-License-Identifier: MIT
import { CalendarClock, Hand, Upload, Zap } from 'lucide-react'
import { useState } from 'react'
import {
  AgentDrawer,
  DataGrid,
  type AgentActivityDay,
  type AgentDrawerLabels,
  type AgentStatus,
  type AgentTrigger,
  type GridColumn,
  type GridColumnLayout,
} from '../../src/blocks'
import { Button, Sheet, SheetContent, SheetDescription, SheetTitle } from '../../src/index'

// Agent 列表不新建件：DataGrid 的 custom 列画「触发」（图标加字），onOpen 点开一行，isOpened 标出开着的那行，行点开右边抽屉（Sheet 里放 AgentDrawer）。
// 示例数据：四个量化 Agent，次数与时间都是手写的演示值；时钟固定在 NOW。
const NOW = Date.parse('2026-11-23T09:00:00Z')
type Agent = {
  id: string
  name: string
  description: string
  status: AgentStatus
  trigger: AgentTrigger
  detail: string
  owner: string
  lastRun: number
  total: number
}

const AGENTS: readonly Agent[] = [
  {
    id: 'scan',
    name: '盘前扫描',
    description: '开盘前扫自选，写一页摘要。',
    status: 'running',
    trigger: 'schedule',
    detail: '交易日 08:30',
    owner: '林静',
    lastRun: NOW - 6 * 60_000,
    total: 1042,
  },
  {
    id: 'backfill',
    name: '回补日线',
    description: '发现缺口就从备用源补日线。',
    status: 'paused',
    trigger: 'event',
    detail: '数据缺口',
    owner: '周衡',
    lastRun: NOW - 22 * 60_000,
    total: 402,
  },
  {
    id: 'risk',
    name: '风控巡检',
    description: '价格突破阈值时复核敞口。',
    status: 'running',
    trigger: 'event',
    detail: '价格突破',
    owner: '林静',
    lastRun: NOW - 2 * 3_600_000,
    total: 283,
  },
  {
    id: 'news',
    name: '新闻摘要',
    description: '新研报上传后写三句摘要。',
    status: 'disabled',
    trigger: 'upload',
    detail: '新研报',
    owner: '陈默',
    lastRun: NOW - 86_400_000,
    total: 12,
  },
]

const TRIGGER_ICON = { schedule: CalendarClock, event: Zap, upload: Upload, manual: Hand }
const TRIGGER_TEXT: Record<AgentTrigger, string> = { schedule: '定时', event: '事件', upload: '上传', manual: '手动' }
const ago = (at: number) => {
  const diff = NOW - at
  return diff < 3_600_000
    ? `${Math.round(diff / 60_000)} 分钟前`
    : diff < 86_400_000
      ? `${Math.round(diff / 3_600_000)} 小时前`
      : '昨天'
}

const COLUMNS: readonly GridColumn<Agent>[] = [
  { id: 'name', type: 'text', value: (row) => row.name, rowHeader: true },
  {
    id: 'trigger',
    type: 'custom',
    text: (row) => TRIGGER_TEXT[row.trigger],
    sort: (row) => TRIGGER_TEXT[row.trigger],
    cell: (row) => {
      const Icon = TRIGGER_ICON[row.trigger]
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Icon aria-hidden="true" width={13} height={13} />
          {TRIGGER_TEXT[row.trigger]}
        </span>
      )
    },
  },
  { id: 'lastRun', type: 'text', text: (row) => ago(row.lastRun), sort: (row) => row.lastRun },
  { id: 'total', type: 'number', value: (row) => row.total },
]
const LAYOUT: readonly GridColumnLayout[] = [
  { id: 'name', label: '名字', width: 160, visible: true },
  { id: 'trigger', label: '触发', width: 120, visible: true },
  { id: 'lastRun', label: '上次运行', width: 120, visible: true },
  { id: 'total', label: '总次数', width: 100, visible: true },
]

// 30 周：抽屉里放不下（格子最小 10px），热力格整张横向滚动并停在最新一端。
const DAYS: readonly AgentActivityDay[] = Array.from({ length: 210 }, (_, index) => ({
  date: new Date(Date.parse('2026-05-04T00:00:00Z') + index * 86_400_000).toISOString().slice(0, 10),
  count: (index * 5) % 9,
}))
const MONTHS = ['1 月', '2 月', '3 月', '4 月', '5 月', '6 月', '7 月', '8 月', '9 月', '10 月', '11 月', '12 月']
const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']

const LABELS: AgentDrawerLabels = {
  properties: { status: '状态', tags: '标签', trigger: '触发', owner: '负责人', created: '创建时间' },
  statuses: { running: '在跑', paused: '暂停', disabled: '停用' },
  triggers: TRIGGER_TEXT,
  results: { ok: '成功', failed: '失败', running: '在跑', cancelled: '已取消' },
  tabs: { list: 'Agent 档案', usage: '用量', configure: '配置', history: '历史' },
  activity: '活动',
  activityGrid: '最近 30 周每天跑的次数',
  legend: { less: '少', more: '多' },
  recentRuns: '最近运行',
  noRuns: '还没有运行',
  metrics: '用量指标',
}

export function AgentTableUsage() {
  const [openId, setOpenId] = useState<string | null>(null)
  const agent = AGENTS.find((item) => item.id === openId)
  return (
    <>
      <div style={{ height: 220 }}>
        <DataGrid
          columns={COLUMNS}
          layout={LAYOUT}
          rows={AGENTS}
          rowId={(row) => row.id}
          label="Agent"
          density="comfortable"
          onOpen={(row) => setOpenId(row.id)}
          isOpened={(row) => row.id === openId}
        />
      </div>
      <Sheet open={agent !== undefined} onOpenChange={(open) => !open && setOpenId(null)}>
        <SheetContent side="right" closeLabel="关闭" style={{ width: 'min(400px, calc(100vw - 24px))' }}>
          {agent ? (
            <AgentDrawer
              name={agent.name}
              description={agent.description}
              status={agent.status}
              trigger={{ kind: agent.trigger, detail: agent.detail }}
              owner={{ name: agent.owner }}
              created="2026-05-09"
              activity={{
                days: DAYS,
                monthLabels: MONTHS,
                weekdayLabels: WEEKDAYS,
                describe: ({ date, count }) => `${date.slice(5)} 跑了 ${count} 次`,
              }}
              runs={[
                {
                  id: `${agent.id}-1`,
                  actor: agent.detail,
                  trigger: agent.trigger,
                  result: 'ok',
                  startedAt: agent.lastRun,
                  durationMs: 41_000,
                },
              ]}
              formatTime={ago}
              formatDuration={(ms) => `${Math.round(ms / 1000)} 秒`}
              footer={<Button>通知我</Button>}
              labels={LABELS}
              renderTitle={(props) => <SheetTitle {...props} />}
              renderDescription={(props) => <SheetDescription {...props} />}
            />
          ) : null}
        </SheetContent>
      </Sheet>
    </>
  )
}
