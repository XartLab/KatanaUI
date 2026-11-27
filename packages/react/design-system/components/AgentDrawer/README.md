# AgentDrawer

一个 Agent 本身的档案，侧抽屉（放进 Sheet）或停靠面板都能放：头是名字与一句说明；属性区是状态（在跑 / 暂停 / 停用，图标加词）、标签（多个）、触发（定时 / 事件 / 上传 / 手动，带图标，可附「交易日 08:30」这类细节）、负责人（头像加名字）、创建时间；下面三个页签「用量 / 配置 / 历史」，配置与历史的内容是调用方给的槽（没给的页签不出现）。用量页内置三块：顶上两张指标卡（节省时间、本月花费，数值与环比徽章由调用方写好）、活动热力格（最近 N 周每天跑了几次，带月份与星期标签）、最近运行列表（触发源或人、结果、时长、相对时间，点一行只回调运行 id，可接 AgentRunDetail）。底部 footer 槽放「通知我」「暂停」，件自己不做动作。Agent 列表不新建件：用 DataGrid 的 custom 列加 onOpen，点一行打开抽屉，演示见页上。「在跑」不用强调色（Graphite 下是橙，色弱下与失败红分不出，#211），用中性亮色加转圈图标与状态词。件不取时间，时间与时长由调用方格式化。信息结构与交互借自 Jamie Merrill 公开的 Agent 抽屉与 Agent tracker 截图（2026-11-24 读，只取结构与交互），样子是 KatanaUI 的，热力格是中性灰不是蓝；实现原创。演示数据是示例。

## Provide

`*` marks a required prop.

### AgentDrawer

放进 Sheet 时 renderTitle、renderDescription 接 SheetTitle、SheetDescription，对话框才有名字。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `name` * | `ReactNode` | — | Agent name. |
| `description` | `ReactNode` | — | One line about it. |
| `status` * | `AgentStatus` | — | Whether the agent is running, paused or disabled. |
| `tags` | `readonly string[]` | — | Tags, as text. |
| `trigger` * | `{ kind: AgentTrigger; detail?: string }` | — | How it starts; detail is the schedule or the rule ("weekdays 08:30"). |
| `owner` * | `{ name: string; avatar?: string; initials?: string }` | — | Who is responsible. |
| `created` * | `ReactNode` | — | Creation date, formatted by the caller. |
| `metrics` | `readonly AgentMetric[]` | — | Metric cards at the top of the usage page. |
| `activity` * | `Pick< AgentActivityProps, 'days' \| 'from' \| 'to' \| 'weekStart' \| 'max' \| 'monthLabels' \| 'weekdayLabels' \| 'describe' \| 'idle' >` | — | Activity grid data and sentence writer; see AgentActivity. |
| `runs` * | `readonly AgentRecentRun[]` | — | Recent runs, newest first. |
| `onOpenRun` | `(id: string) => void` | — | Called with the run id when a row is clicked or gets Enter; without it the rows are plain text. |
| `formatTime` * | `(at: number) => string` | — | How a run's start is written ("6m ago"); the component does not read the clock. |
| `formatDuration` * | `(ms: number) => string` | — | How a duration in milliseconds is written. |
| `configure` | `ReactNode` | — | Content of the Configure tab; without it there is no such tab. |
| `history` | `ReactNode` | — | Content of the History tab; without it there is no such tab. |
| `tab` | `AgentDrawerTab` | — | Current tab (controlled). |
| `defaultTab` | `AgentDrawerTab` | `'usage'` | Tab at first (uncontrolled); defaults to usage. |
| `onTabChange` | `(tab: AgentDrawerTab) => void` | — | Called when the tab changes. |
| `footer` | `ReactNode` | — | Actions pinned at the bottom (notify me, pause agent); the component runs none of them. |
| `renderTitle` | `(props: { className: string; children: ReactNode }) => ReactNode` | — | Writes the title element; inside a Sheet pass `(props) => <SheetTitle {...props} />` so the dialog is named by it. |
| `renderDescription` | `(props: { className: string; children: ReactNode }) => ReactNode` | — | Writes the description element; inside a Sheet pass `(props) => <SheetDescription {...props} />`. |
| `labels` * | `AgentDrawerLabels` | — | Texts. |
| `className` | `string` | — | Extra class name on the root. |

### AgentActivity

单独用也行：给每日次数，格子与读数行自己排。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `days` * | `readonly AgentActivityDay[]` | — | Runs per day; days that are missing count as no runs. |
| `from` | `string` | — | First day shown (YYYY-MM-DD); defaults to the earliest day in days. |
| `to` | `string` | — | Last day shown (YYYY-MM-DD); defaults to the latest day in days. |
| `weekStart` | `0 \| 1` | `1` | Which weekday a column starts on (0 Sunday, 1 Monday). |
| `max` | `number` | — | Count that fills the top shade. |
| `monthLabels` | `readonly string[]` | — | Twelve month names, January first; written above the first column of each month. |
| `weekdayLabels` | `readonly string[]` | — | Seven weekday names indexed like JavaScript (0 is Sunday); written for Monday, Wednesday and Friday, and used as each row's accessible name. |
| `label` * | `string` | — | Accessible name of the grid. |
| `describe` * | `(cell: { date: string; count: number }) => string` | — | The whole sentence for one day, read by screen readers and written in the readout line ("11-03 ran 12 times"). |
| `legend` | `{ less: string; more: string }` | — | Legend ends; without it no legend is drawn. |
| `idle` | `ReactNode` | — | What the readout line says when no cell is hovered or focused (a total, say). |
| `className` | `string` | — | Extra class name on the root. |

### activityLevel

纯函数：固定上限的线性档位，0 次是 0 档，跑过的按占 max 的比例分 1 到 5 档。

### activityCuts

纯函数：分位数档位的切点（跑过的日子的 20 / 40 / 60 / 80 分位，升序去重）。

### activityLevelByCuts

纯函数：按切点分档，0 次是 0 档，跑过的是 1 加严格大于的切点个数。

### activityGrid

纯函数：把每日次数排成一列一周、一行一个星期。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `from` | `string` | — | First day (YYYY-MM-DD); defaults to the earliest day in days. |
| `to` | `string` | — | Last day (YYYY-MM-DD); defaults to the latest day in days. |
| `weekStart` | `0 \| 1` | — | Which weekday a column starts on (0 Sunday, 1 Monday). |
| `max` | `number` | — | Count that fills the top shade; defaults to the largest day in range. |

### activityMax

纯函数：单日最大次数。

### activityTotal

纯函数：总次数。

### ACTIVITY_LEVELS

常量：非 0 的档数（5）。

### ACTIVITY_PAGE_WEEKS

常量：PageUp / PageDown 一次跳几周（4）。

### agentStatusTone

纯函数：状态的语气，在跑是 progress，暂停 warn，停用 neutral。

### runResultTone

纯函数：运行结果的语气。

### moveActivity

纯函数：方向键、PageUp / PageDown、Home / End 之后焦点去哪一格，没有格子返回 null。

### recentFrom

纯函数：到某天为止最近 N 周的起点日期。

### initialsOf

纯函数：名字缩写（两个词取首字母，中文名取前两字）。

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { CircleDollarSign, Clock } from 'lucide-react'
import { useState } from 'react'
import {
  AgentDrawer,
  type AgentActivityDay,
  type AgentDrawerLabels,
  type AgentRecentRun,
  type AgentStatus,
} from '@katana-ui/react/blocks'
import { Button } from '@katana-ui/react'

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
```

## States

- 在跑：状态字与图标中性亮色（--k-content-primary-foreground），图标转圈；不用 accent（#211：橙与失败红在色弱下只差 ΔE 0.09）。
- 暂停：warn 色与底，图标是暂停。停用：neutral，图标是斜线圆。
- 运行结果：成功 ok、失败 danger、在跑中性亮色加转圈、已取消 neutral；图标与词一起写，不单靠颜色。
- 热力格：0 次是空格（--k-heat-0），跑过的分 5 档（--k-heat-1…5，越多越亮），中性灰不用蓝；悬停格有亮边，焦点有焦点环。
- 分档默认按跑过的日子的次数分位数（20 / 40 / 60 / 80 分位，同 CalendarHeatmap 的 80 分位做法）：一天重放跑了 300 次不会把其余日子压成同一档，每天都只跑 1 次也不会全是最亮；全是同一个次数时全落 1 档。给了 max（如每日计划上限）才是线性，几个 Agent 的格子才比得了。
- 热力格上方是月份（monthLabels，首月只剩一两列时不画），左边是星期（weekdayLabels，写周一三五，每一行都有读屏名）；格子最小 10px，周数多放不下时整张图横向滚动并停在最新一端。
- 没有运行：最近运行一栏写 noRuns 的虚线框。指标卡没给就不画。
- 窄于 280px：指标卡由两张并排改成一列。

## Don't

- 不要拿它看一次运行的过程：用 AgentRunDetail。
- 不要拿它看几个并行的主 Agent：用 AgentFleet。
- 不要在件里读时钟或写文案：时间、时长、状态词都由调用方给。
- 不要新建 Agent 表格件：用 DataGrid 的 custom 列。

## Composition

```
AgentDrawer（section）
  header（h2 名字 · 一句说明）
  dl 属性区（状态 · 标签 · 触发 · 负责人 · 创建时间）
  Tabs（line）
    TabsContent 用量
      ul 指标卡（Tag 环比）
      AgentActivity（role=grid，一行一个星期）
      ul 最近运行（button 行）
    TabsContent 配置 / 历史（调用方的槽）
  footer（调用方的动作）
```

## Keyboard

- `Tab`：页签、热力格（一个停点）、最近运行各行、底部动作
- `← →`：页签间切换；在热力格里前一周 / 后一周（同一个星期几，残缺的首尾周取最近的一行）
- `↑ ↓`：在热力格里前一天 / 后一天（到头不动）
- `PageUp / PageDown`：热力格里前 4 周 / 后 4 周（夹在区间内）
- `Home / End`：热力格里这一行（星期几）的第一周 / 最后一周
- `Ctrl+Home / Ctrl+End`：热力格的第一天 / 最后一天
- `Enter / Space`：打开最近运行的这一行（回调运行 id）
