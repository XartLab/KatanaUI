# FlowBuilder

一条自动化（收盘后拉数据 → 条件 → 发提醒 / 交给 Agent）自上而下摆在一块定高、两向滚动、拖空白处平移的画布上，打开时居中。第一步总是触发；每条线上一个「+」，点开是调用方给的模板菜单（流程为空时是「加触发」与触发模板）；条件步分出几条有名字的路并排画、最后汇回主线。步骤可在自己那一列里上下挪（Alt+↑↓）、删（Backspace；删条件步时第一条路的步骤留在原处）、撤销（Ctrl/⌘+Z）；选中一步回调 onSelect，检查器由调用方开。给了 onRun 且至少两步时出「测试运行」，跑的时候换成「停止」；每步的状态与开始、结束时间由调用方的 run 给，在跑的步写它的 note，整条路都跳过的变淡。件不取时间：耗时量到调用方给的 now。底座没用 Whiteboard：这里是有结构的流程（一个触发、分出的路汇回），结构由数据保证，键盘按读的次序走；自由连线的图用 Whiteboard。功能参照 affectUI 的 Flow Builder（affectui.com/components/flow-builder，2026-11-23 读；Pro 件，页上没写许可证：只读说明、实现原创，不装它的 registry）。演示数据是示例。

## Provide

`*` marks a required prop.

### FlowBuilder

steps 受控或 defaultSteps 不受控，每次改动 onStepsChange 回整份新列表。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `name` | `ReactNode` | — | Workflow name in the header. |
| `steps` | `readonly FlowStep[]` | — | Steps, controlled. |
| `defaultSteps` | `readonly FlowStep[]` | — | Steps at first, uncontrolled. |
| `onStepsChange` | `(steps: readonly FlowStep[]) => void` | — | Called with the whole new list after every add, move, remove and undo. |
| `run` | `Readonly<Record<string, FlowRun>>` | — | Test-run state per step id. |
| `now` | `number` | — | Clock in milliseconds for the elapsed time of running steps; the component does not tick on its own. |
| `running` | `boolean` | — | Whether a test run is going; defaults to whether any step is running. |
| `selected` | `string \| null` | — | Selected step id, controlled. |
| `defaultSelected` | `string \| null` | `null` | Selected step id at first, uncontrolled. |
| `onSelect` | `(id: string \| null) => void` | — | Called with the selected step id, or null when cleared; open your inspector here. |
| `onRun` | `() => void` | — | Shows Test run once the flow has two steps. |
| `onStop` | `() => void` | — | Shows Stop while a test run is going. |
| `templates` * | `readonly FlowTemplate[]` | — | Entries of the add menu below the trigger. |
| `triggers` * | `readonly FlowTemplate[]` | — | Entries of the add menu of an empty flow. |
| `height` | `number` | `420` | Canvas height in px. |
| `formatDuration` * | `(ms: number) => string` | — | How a duration in milliseconds is written. |
| `renderIcon` | `(step: FlowStep) => ReactNode` | — | Icon of a step; defaults to one per kind. |
| `labels` * | `FlowBuilderLabels` | — | Texts. |
| `className` | `string` | — | Extra class name on the root. |

### flowOrder

纯函数：读的次序（键盘上下走的次序）。

### insertStep

纯函数：在插入点放一步；最外层插不到触发前面。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `path` * | `string \| null` | — | Path id, or null for the top level. |
| `index` * | `number` | — | Position in that list. |
| `id` * | `string` | — | Stable key. |
| `kind` * | `FlowStepKind` | — | Trigger, action, agent, branch or wait. |
| `title` * | `string` | — | Step name. |
| `detail` | `string` | — | Muted second line, such as the source or the condition. |
| `note` | `string` | — | Line shown while the step runs. |
| `paths` | `readonly FlowPath[]` | — | Paths of a branch step. |

### removeStep

纯函数：删一步，返回新列表与该聚焦的那一步；触发后面还有步骤时返回 null。

### moveStep

纯函数：在自己那一列里上下挪一格，挪不动返回 null。

### flowElapsed

纯函数：一步跑了多久（量到 now）。

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { FlowBuilder, type FlowRun, type FlowStep, type FlowTemplate } from '@katana-ui/react/blocks'

// 示例数据：收盘后检查跳空、超过 3% 交给研究员看公告，否则记一笔，最后发提醒。步骤与模板是手写的演示值；
// 「测试运行」不真的跑，只把一份写好的结果（在跑一步、跳过一条路）交给件，时间是固定的演示时钟。
const STEPS: readonly FlowStep[] = [
  { id: 'close', kind: 'trigger', title: '收盘后', detail: '每个交易日 15:05' },
  { id: 'pull', kind: 'action', title: '拉日线与公告', detail: '本地数据服务' },
  {
    id: 'gap',
    kind: 'branch',
    title: '跳空超过 3%？',
    detail: '自选里的票',
    paths: [
      {
        id: 'gap-yes',
        label: '是',
        steps: [{ id: 'ask', kind: 'agent', title: '研究员看公告', detail: '给出一句结论', note: '正在读 2 份公告' }],
      },
      { id: 'gap-no', label: '否', steps: [{ id: 'log', kind: 'action', title: '记一笔', detail: '写进复盘日志' }] },
    ],
  },
  { id: 'notify', kind: 'action', title: '发提醒', detail: '状态栏与声音' },
]

const TEMPLATES: readonly FlowTemplate[] = [
  { key: 'action', kind: 'action', title: '动作', detail: '拉数据、写日志、发提醒' },
  { key: 'agent', kind: 'agent', title: '交给 Agent', detail: '研究员、风控……', note: '在想' },
  { key: 'branch', kind: 'branch', title: '条件', detail: '分成「是」「否」两条路', paths: ['是', '否'] },
  { key: 'wait', kind: 'wait', title: '等一会', detail: '等到下一根 K 线' },
]
const TRIGGERS: readonly FlowTemplate[] = [
  { key: 'close', kind: 'trigger', title: '收盘后', detail: '每个交易日 15:05' },
  { key: 'alert', kind: 'trigger', title: '价格告警触发' },
]

const NOW = 9_000
const RESULT: Readonly<Record<string, FlowRun>> = {
  close: { status: 'done', started: 0, ended: 200 },
  pull: { status: 'done', started: 200, ended: 3_400 },
  gap: { status: 'done', started: 3_400, ended: 3_500 },
  ask: { status: 'running', started: 3_500 },
  log: { status: 'skipped' },
}

const seconds = (ms: number) => `${(ms / 1000).toFixed(1)} 秒`

export function FlowBuilderUsage() {
  const [run, setRun] = useState<Readonly<Record<string, FlowRun>> | undefined>(undefined)
  return (
    <div className="gal-wide" style={{ maxWidth: 720 }} data-gallery-flow="main">
      <FlowBuilder
        name="跳空提醒（示例）"
        defaultSteps={STEPS}
        templates={TEMPLATES}
        triggers={TRIGGERS}
        run={run}
        now={NOW}
        onRun={() => setRun(RESULT)}
        onStop={() => setRun(undefined)}
        height={440}
        formatDuration={seconds}
        labels={{
          untitled: '未命名流程',
          canvas: '流程画布',
          kind: { trigger: '触发', action: '动作', agent: 'Agent', branch: '条件', wait: '等待' },
          status: { idle: '', running: '在跑', done: '通过', failed: '失败', skipped: '跳过' },
          addAfter: (title) => `在「${title}」后加一步`,
          addInPath: (path) => `在「${path}」这条路开头加一步`,
          addTrigger: '加触发',
          menu: '步骤模板',
          run: '测试运行',
          stop: '停止',
          undo: '撤销',
          hint: '方向键走、Alt+↑↓ 挪、Backspace 删、Ctrl+Z 撤销',
          added: (title) => `已加「${title}」`,
          removed: (title) => `已删「${title}」`,
          moved: (title) => `已挪「${title}」`,
          undone: '已撤销',
          finished: (counts) =>
            `测试运行结束：通过 ${counts.done} 步，失败 ${counts.failed} 步，跳过 ${counts.skipped} 步`,
          defaultPaths: ['是', '否'],
        }}
      />
    </div>
  )
}
```

## States

- 空：只有一个虚线框的「加触发」。
- 选中：卡片焦点色边、选中底色，aria-pressed 为真。
- 在跑：强调色边，第二行换成 note、强调色，右边写耗时。
- 通过：图标 ok 色。失败：danger 边与图标。跳过：整张卡 45%；整条路都跳过时路名与步骤 40%。
- 窄于 480px：卡缩到 168px，两条路仍并排，耗时不写。

## Don't

- 不要拿它画自由连线的图：用 Whiteboard。
- 不要拿它审 Agent 跑之前的计划：用 AiTaskList 或 PlanVsActual。
- 不要拿它回看跑过的：用 TraceWaterfall。

## Composition

```
FlowBuilder
  头（名字 · Button 撤销 · Button 测试运行 / 停止）
  画布 region
    列：步骤 button（图标 · 名字 · detail 或 note · 耗时）· 「+」DropdownMenu（模板项）
    条件步：短竖线 · 并排的路（路名 · 列 · 尾线）
  键位说明（aria-describedby）· 播报
```

## Keyboard

- `Tab`：依次走步骤与「+」
- `↑ ↓ / ← →`：按读的次序到上一步 / 下一步（含路里的）
- `Home / End`：第一步 / 最后一步
- `Enter / Space`：选中或取消这一步；在「+」上打开模板菜单
- `Alt+↑ / Alt+↓`：在自己那一列里上挪 / 下挪
- `Backspace / Delete`：删这一步，焦点去它前面那一步
- `Ctrl+Z / ⌘+Z`：撤销上一次改动
- `Esc`：关菜单；再按清掉选中
