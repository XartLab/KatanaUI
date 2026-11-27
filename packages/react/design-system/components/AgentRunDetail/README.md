# AgentRunDetail

一次 Agent 运行的详情页或抽屉：头（返回钮、运行名、右上一颗随状态变的动作钮）→ 大号百分比加分段刻度进度条加一行时间 → 阻塞时的问题卡 → 完成时的「接着跑」→ 可收起的「详情」键值对与「步骤」。状态五种：在跑、阻塞、完成、暂停、失败。时间（已用、约剩、阻塞多久、总用时、预估）都是毫秒、由调用方给，件不读钟；包里不带语言。交互与信息结构借自 Jamie Merrill 的 Agent workflow（in progress / blocked / complete）与 Agent drawer（x.com/jamiemerrill，2026-11-24 看截图）：只借信息结构与交互，样子是我们的 Graphite 风格，没有他的蓝橙绿原色，没抄任何素材。列表侧见 AgentRunList。演示数据是示例。

## Provide

`*` marks a required prop.

### AgentRunDetail

状态、进度、各段时间、问题卡、建议动作、详情、步骤都由调用方给；返回、动作钮、确认、建议动作都是给了回调才出现或才起作用；折叠的分组用 defaultCollapsed。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `name` * | `ReactNode` | — | Run name (the title). |
| `status` * | `RunDetailStatus` | — | State of the run. |
| `progress` * | `number` | — | Progress, 0 to 1. |
| `elapsed` | `number` | — | Time used so far, in milliseconds (running, paused, failed). |
| `remaining` | `number` | — | Time left, in milliseconds (running). |
| `blockedFor` | `number` | — | How long it has been blocked, in milliseconds (blocked). |
| `took` | `number` | — | Total time it took, in milliseconds (done). |
| `formatDuration` * | `(ms: number) => string` | — | How a duration in milliseconds is written (「6m 12s」). |
| `ticks` | `number` | `40` | Number of ticks in the bar, rounded down and kept between 1 and 120; not a finite number is 40. |
| `question` | `RunQuestion` | — | The question card of a blocked run. |
| `onConfirm` | `() => void` | — | Called by the confirm button on the question card. |
| `next` | `readonly RunNextAction[]` | — | Suggested next actions of a finished run. |
| `onNext` | `(id: string) => void` | — | Called with the id of the chosen suggestion. |
| `details` | `readonly RunDetailRow[]` | — | Key-value rows of the details. |
| `steps` | `readonly RunDetailStep[]` | — | Steps, in order. |
| `onBack` | `() => void` | — | Shows the back button. |
| `onAction` | `(action: RunDetailAction) => void` | — | Shows the header action (pause, resume, cancel or run again by state); called with which one. |
| `defaultCollapsed` | `readonly RunDetailSection[]` | `[]` | Sections folded when first drawn. |
| `onSectionToggle` | `(section: RunDetailSection, open: boolean) => void` | — | Called when a section is folded or unfolded. |
| `headingLevel` | `RunHeadingLevel` | — | Heading level of the run name, 2 to 6 (default 2); the section titles and the question title are one level below. |
| `labels` * | `AgentRunDetailLabels` | — | Texts. |
| `className` | `string` | — | Extra class name on the root. |

### runTone

纯函数：状态的语气（在跑 accent、阻塞 warn、完成 ok、暂停 neutral、失败 danger）。

### runStepTone

纯函数：步骤状态的语气（等待是 off）。

### runHeaderAction

纯函数：右上动作钮是哪一个。

### runSegments

纯函数：几根刻度亮、当前刻度是哪根。

### runTimeLine

纯函数：这个状态的时间行写什么。

### runHeadingLevel

纯函数：标题层级取 2 到 6，其余当 2。

### runSubHeadingLevel

纯函数：下一级标题（分组标题、问题标题），到 6 为止。

### runPercent

纯函数：进度写成整数百分数。

### clampRunProgress

纯函数：进度夹在 0 到 1，坏值当 0。

### currentRunStep

纯函数：第一个在跑或阻塞的步骤。

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { CalendarIcon, ClockIcon, MapPinIcon, UsersIcon } from 'lucide-react'
import { useState } from 'react'
import {
  AgentRunDetail,
  type AgentRunDetailLabels,
  type RunDetailStatus,
  type RunDetailStepStatus,
} from '@katana-ui/react/blocks'

// 示例数据：一次回补任务，数是手写的演示值，不是任何数据源的真实记录。时间一律是毫秒，由调用方给：件自己不读钟。
const sec = 1000
const min = 60 * sec

// 毫秒写成字：调用方管语言与单复数。
const formatDuration = (ms: number) => {
  const s = Math.round(ms / sec)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  if (h > 0) return `${h} 小时`
  if (m > 0) return s % 60 > 0 ? `${m} 分 ${s % 60} 秒` : `${m} 分钟`
  return `${s} 秒`
}

const LABELS: AgentRunDetailLabels = {
  back: '返回',
  status: { running: '在跑', blocked: '要你确认', done: '完成', paused: '已暂停', failed: '失败' },
  actions: { pause: '暂停', resume: '继续', cancel: '取消', rerun: '再跑一次' },
  progress: '运行进度',
  progressValue: (percent, status) => `${percent}%，${status}`,
  elapsed: (time) => `已用 ${time}`,
  remaining: (time) => `约剩 ${time}`,
  blocked: (time) => `阻塞于 ${time}前`,
  completed: (time) => `用时 ${time}`,
  confirm: '确认',
  next: '接着跑',
  details: '详情',
  steps: '步骤',
  estimate: (time) => `约 ${time}`,
  step: { done: '完成', running: '在跑', pending: '等待', blocked: '阻塞', failed: '失败' },
}

// 校验密钥这一步跟着运行的状态走：暂停时还没开始（等待）。
const KEY_STEP: Record<RunDetailStatus, RunDetailStepStatus> = {
  blocked: 'blocked',
  failed: 'failed',
  paused: 'pending',
  running: 'running',
  done: 'done',
}

export function AgentRunDetailUsage() {
  const [status, setStatus] = useState<RunDetailStatus>('blocked')
  return (
    <div style={{ width: 440, maxWidth: '100%' }} data-gallery-ard="main">
      <AgentRunDetail
        name="接入新数据源"
        status={status}
        progress={status === 'blocked' ? 0.76 : 0.8}
        elapsed={14 * min}
        remaining={3 * min}
        blockedFor={58 * min}
        formatDuration={formatDuration}
        question={{
          title: '示例源 B 缺少访问密钥',
          description: '要继续，需要我用保险库里的备用密钥吗？',
        }}
        onConfirm={() => setStatus('running')}
        onAction={(action) => {
          // 暂停与继续在跑与暂停间切；取消把运行标成失败；再跑一次回到在跑。
          if (action === 'pause') setStatus('paused')
          else if (action === 'cancel') setStatus('failed')
          else setStatus('running')
        }}
        details={[
          { id: 'source', label: '数据源', icon: <MapPinIcon />, value: '示例源 B' },
          { id: 'scope', label: '范围', icon: <UsersIcon />, value: '沪深 A 股 5,120 只' },
          { id: 'cycle', label: '周期', icon: <CalendarIcon />, value: '日线 · 近 10 年' },
          { id: 'started', label: '开始', icon: <ClockIcon />, value: '14:32 · 2026-11-24' },
        ]}
        steps={[
          { id: 'connect', name: '连接数据源', status: 'done', duration: 22 * sec },
          { id: 'calendar', name: '拉取交易日历', status: 'done', duration: 38 * sec },
          { id: 'check', name: '核对权限范围', status: 'done', duration: 62 * sec },
          {
            id: 'key',
            name: '校验访问密钥',
            status: KEY_STEP[status],
          },
          { id: 'write', name: '写入日线', status: 'pending' },
        ]}
        labels={LABELS}
      />
    </div>
  )
}
```

## States

- 进度条：默认 40 根竖短刻度（ticks 可调，取整后夹在 1 到 120，不是有限数取 40），亮的是走过的整根（向下取整）、着状态色，暗的是同色 16%；刻度全部对读屏隐藏，条本身是 progressbar。
- 百分比同样向下取整、跟刻度一致：没跑完（在跑、阻塞）最多显示 99%，只有 done 才是 100%。
- 在跑：强调色刻度，第一根暗刻度是「当前刻度」，亮正文主色加一圈同色外框；时间行左写已用、右写约剩；右上「暂停」。
- 阻塞：warn 色刻度、没有当前刻度；时间行只写阻塞了多久；进度条下出一张 warn 语气的问题卡（标题、一句说明、一颗「确认」），阻塞的那步名字 warn 色；右上「取消」是 danger 样式（离问题卡的「确认」很近，要分得开）；要不要二次确认由调用方在 onAction 收到 cancel 时定，件不加。
- 完成：100%、刻度全亮 ok 色，写总用时；出「接着跑」，每个建议是一颗钮分两段（图标加名字 | 预估时长）；右上「再跑一次」。
- 暂停：中性灰刻度、不画当前刻度；右上「继续」。失败：danger 色刻度；右上「再跑一次」。
- 状态永不单靠颜色：百分比右边一盏灯加状态词（role=status）；步骤图标形状各不同（勾、转圈、空圈、警示、叉），右边写耗时或状态字。
- 分组标题（接着跑、详情、步骤）是按钮，箭头朝上是展开、朝下是收起；收起的内容用 hidden="until-found"，浏览器内查找命中会自动展开。
- 没有给 onBack、onAction、onConfirm 的钮就不画；没有 details、steps、next 的分组就不画。
- 标题层级：运行名是 headingLevel（2 到 6，默认 2），分组标题与问题标题低一级（到 6 为止）；按所在页面的大纲传，免得 axe 报标题跳级。

## Don't

- 不要拿它看很多个运行的总览：用 AgentRunList（一行一个）、AgentFleet、AgentQueue。
- 不要拿它看一次编排的子 Agent 树：用 AgentTree。
- 不要把它的状态跟 AgentTree 的混着传：这件的 RunDetailStatus 是 running / blocked / done / paused / failed，AgentTree 的 AgentRunStatus 是 queued / running / waiting / done / failed / stopped；同样是「要你回答」，这边叫 blocked、那边叫 waiting（一一对应）；queued 在这边没有对应（不传，或当 paused）；stopped 对应 paused 还是 failed，待用户定，统一叫法另开票。RunDetailStep 也不是 AgentTree 的 AgentRunStep（多了 blocked，少了 tool），别拿错。
- 不要让件自己走钟：已用时、约剩、阻塞多久都由调用方按自己的节奏给。
- 不要把状态色换成别的：在跑强调色、阻塞 warn、完成 ok、失败 danger 是全库统一的语气。

## Composition

```
AgentRunDetail（article）
  头（Button 返回 · 运行名 h3 · Button 动作）
  进度（百分比 · 状态灯与词 · progressbar（40 根 i，aria-hidden）· 时间行）
  问题卡（阻塞时：标题 h4 · 说明 · Button 确认）
  接着跑（完成时：标题按钮 · ul · 每个建议一个 button）
  详情（标题按钮 · dl）
  步骤（标题按钮 · ol（图标 · 名字 · 耗时或状态字））
```

## Keyboard

- `Tab`：依次到返回、动作钮、确认钮、各分组标题、建议动作
- `Enter / Space`：按下聚焦的钮；在分组标题上是收起或展开
