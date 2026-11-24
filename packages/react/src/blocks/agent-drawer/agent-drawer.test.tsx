// SPDX-License-Identifier: MIT
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vite-plus/test'
import { AgentActivity } from './agent-activity.tsx'
import { AgentDrawer, initialsOf, type AgentDrawerLabels } from './agent-drawer.tsx'

const labels: AgentDrawerLabels = {
  properties: { status: '状态', tags: '标签', trigger: '触发', owner: '负责人', created: '创建时间' },
  statuses: { running: '在跑', paused: '暂停', disabled: '停用' },
  triggers: { schedule: '定时', event: '事件', upload: '上传', manual: '手动' },
  results: { ok: '成功', failed: '失败', running: '运行中', cancelled: '已取消' },
  tabs: { list: '档案', usage: '用量', configure: '配置', history: '历史' },
  activity: '活动',
  activityGrid: '最近 2 周',
  legend: { less: '少', more: '多' },
  recentRuns: '最近运行',
  noRuns: '还没有运行',
  metrics: '指标',
}

const days = [
  { date: '2026-11-02', count: 0 },
  { date: '2026-11-03', count: 12 },
  { date: '2026-11-04', count: 3 },
]
const describe_ = ({ date, count }: { date: string; count: number }) => `${date.slice(5)} 跑了 ${count} 次`

const base = {
  name: '盘前扫描',
  description: '开盘前扫自选',
  status: 'running' as const,
  tags: ['行情', '盘前'],
  trigger: { kind: 'schedule' as const, detail: '交易日 08:30' },
  owner: { name: '林静' },
  created: '2026-05-09',
  metrics: [
    { id: 'saved', label: '节省时间', value: '155', unit: '小时', delta: { text: '+8%', tone: 'ok' as const } },
    { id: 'cost', label: '本月花费', value: '¥1,180', delta: { text: '+15%', tone: 'warn' as const } },
  ],
  activity: { days, describe: describe_ },
  runs: [
    { id: 'a', actor: '交易日 08:30', trigger: 'schedule' as const, result: 'running' as const, startedAt: 1 },
    { id: 'b', actor: '林静', trigger: 'manual' as const, result: 'failed' as const, startedAt: 2, durationMs: 8000 },
  ],
  formatTime: (at: number) => `t${at}`,
  formatDuration: (ms: number) => `${ms / 1000}s`,
  labels,
}

describe('initialsOf', () => {
  it('两个词取首字母，一个词（含中文名）取前两个字', () => {
    expect(initialsOf('Sharon Kim')).toBe('SK')
    expect(initialsOf('林静')).toBe('林静')
    expect(initialsOf('  ')).toBe('')
    expect(initialsOf('Madonna')).toBe('Ma')
  })
})

describe('AgentDrawer', () => {
  const html = renderToStaticMarkup(<AgentDrawer {...base} configure={<p>配置槽</p>} footer={<button>暂停</button>} />)
  it('头、属性区、页签、指标卡齐全', () => {
    expect(html).toContain('<h2')
    expect(html).toContain('盘前扫描')
    for (const word of [
      '状态',
      '标签',
      '触发',
      '负责人',
      '创建时间',
      '在跑',
      '定时',
      '交易日 08:30',
      '林静',
      '2026-05-09',
    ]) {
      expect(html).toContain(word)
    }
    expect(html.match(/data-slot="agent-drawer-metric"/g)).toHaveLength(2)
    expect(html).toContain('+8%')
    expect(html).toContain('data-slot="agent-drawer-footer"')
  })
  it('只给了 configure 槽：有用量与配置页签，没有历史', () => {
    expect(html.match(/role="tab"/g)).toHaveLength(2)
    expect(html).toContain('配置')
    expect(html).not.toContain('>历史<')
  })
  it('三种状态各有自己的状态词、语气与图标，在跑不用 accent', () => {
    for (const [status, word, tone] of [
      ['running', '在跑', 'progress'],
      ['paused', '暂停', 'warn'],
      ['disabled', '停用', 'neutral'],
    ] as const) {
      const out = renderToStaticMarkup(<AgentDrawer {...base} status={status} />)
      expect(out).toContain(`data-status="${status}"`)
      expect(out).toMatch(new RegExp(`data-slot="agent-drawer-status"[^>]*data-tone="${tone}"`))
      expect(out).toContain(word)
    }
    expect(renderToStaticMarkup(<AgentDrawer {...base} status="running" />)).toContain('k-ad-spin')
    expect(renderToStaticMarkup(<AgentDrawer {...base} status="paused" runs={[]} />)).not.toContain('k-ad-spin')
  })
  it('最近运行：给了 onOpenRun 是按钮，没给是纯文字；结果是图标加词', () => {
    const withClick = renderToStaticMarkup(<AgentDrawer {...base} onOpenRun={() => {}} />)
    expect(withClick.match(/class="k-ad-run-body is-link"/g)).toHaveLength(2)
    expect(withClick).toContain('运行中')
    expect(withClick).toContain('失败')
    expect(withClick).toContain('8s')
    expect(html).not.toContain('is-link')
  })
  it('没有运行写 noRuns；没有标签与指标就不画那一行', () => {
    const out = renderToStaticMarkup(<AgentDrawer {...base} runs={[]} tags={[]} metrics={[]} />)
    expect(out).toContain('还没有运行')
    expect(out).not.toContain('k-ad-tags')
    expect(out).not.toContain('agent-drawer-metrics')
  })
  it('renderTitle 与 renderDescription 能换掉标题与说明元素', () => {
    const out = renderToStaticMarkup(
      <AgentDrawer
        {...base}
        renderTitle={(p) => <h1 data-x="t" {...p} />}
        renderDescription={(p) => <div data-x="d" {...p} />}
      />,
    )
    expect(out).toContain('<h1 data-x="t"')
    expect(out).toContain('<div data-x="d"')
    expect(out).not.toContain('<h2 id=')
  })
})

describe('AgentActivity', () => {
  const html = renderToStaticMarkup(
    <AgentActivity
      days={days}
      label="最近 2 周"
      describe={describe_}
      legend={{ less: '少', more: '多' }}
      idle="共 15 次"
    />,
  )
  it('role=grid，一行一个星期，一天一个带整句名的 gridcell', () => {
    expect(html).toContain('role="grid"')
    expect(html).toContain('aria-label="最近 2 周"')
    expect(html.match(/role="row"/g)).toHaveLength(7)
    expect(html.match(/role="gridcell"/g)).toHaveLength(3)
    expect(html).toContain('aria-label="11-03 跑了 12 次"')
  })
  it('档位写在 data-level：0 次 0 档，最多的 5 档；色例是 6 个色块（0 加 5 档）', () => {
    expect(html).toMatch(/data-date="2026-11-02"[^>]*data-level="0"/)
    expect(html).toMatch(/data-date="2026-11-03"[^>]*data-level="5"/)
    expect(html).toMatch(/data-date="2026-11-04"[^>]*data-level="2"/)
    expect(html.match(/class="k-ad-swatch"/g)).toHaveLength(6)
  })
  it('只有最新一天在 Tab 序里，读数行默认写 idle', () => {
    expect(html.match(/tabindex="0"/g)).toHaveLength(1)
    expect(html).toMatch(/data-date="2026-11-04"[^>]*tabindex="0"/)
    expect(html.match(/tabindex="-1"/g)).toHaveLength(2)
    expect(html).toContain('共 15 次')
  })
  it('没有数据不画格子', () => {
    const empty = renderToStaticMarkup(<AgentActivity days={[]} label="x" describe={describe_} />)
    expect(empty).not.toContain('role="grid"')
  })
})
