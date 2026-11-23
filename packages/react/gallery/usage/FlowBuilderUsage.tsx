// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { FlowBuilder, type FlowRun, type FlowStep, type FlowTemplate } from '../../src/blocks'

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
