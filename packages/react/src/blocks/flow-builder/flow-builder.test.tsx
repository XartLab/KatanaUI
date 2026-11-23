// SPDX-License-Identifier: MIT
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vite-plus/test'
import { FlowBuilder, type FlowBuilderLabels } from './flow-builder.tsx'
import {
  flowElapsed,
  flowOrder,
  freshId,
  fromTemplate,
  insertStep,
  moveStep,
  pathSkipped,
  removeStep,
  type FlowStep,
} from './flow-model.ts'

const STEPS: FlowStep[] = [
  { id: 'close', kind: 'trigger', title: '收盘后', detail: '15:05' },
  { id: 'pull', kind: 'action', title: '拉日线' },
  {
    id: 'gap',
    kind: 'branch',
    title: '跳空超过 3%',
    paths: [
      { id: 'yes', label: '是', steps: [{ id: 'ask', kind: 'agent', title: '让研究员看', note: '读公告' }] },
      { id: 'no', label: '否', steps: [{ id: 'log', kind: 'action', title: '记一笔' }] },
    ],
  },
  { id: 'notify', kind: 'action', title: '发提醒' },
]

const LABELS: FlowBuilderLabels = {
  untitled: '未命名流程',
  canvas: '流程画布',
  kind: { trigger: '触发', action: '动作', agent: 'Agent', branch: '条件', wait: '等待' },
  status: { idle: '', running: '在跑', done: '通过', failed: '失败', skipped: '跳过' },
  addAfter: (title) => `在「${title}」后加一步`,
  addInPath: (path) => `在「${path}」开头加一步`,
  addTrigger: '加触发',
  menu: '步骤模板',
  run: '测试运行',
  stop: '停止',
  undo: '撤销',
  hint: 'Alt+↑↓ 挪动，Backspace 删除',
  added: (title) => `已加「${title}」`,
  removed: (title) => `已删「${title}」`,
  moved: (title) => `已挪「${title}」`,
  undone: '已撤销',
  finished: (counts) => `跑完：通过 ${counts.done}，失败 ${counts.failed}`,
  defaultPaths: ['是', '否'],
}

describe('流程编排的结构', () => {
  it('读的次序：一步，条件步依次走它每条路，再到下一步', () => {
    expect(flowOrder(STEPS)).toEqual(['close', 'pull', 'gap', 'ask', 'log', 'notify'])
  })

  it('插步：插在路里；最外层插不到触发前面', () => {
    const step: FlowStep = { id: 'n', kind: 'wait', title: '等 5 分钟' }
    expect(flowOrder(insertStep(STEPS, { path: 'no', index: 0 }, step))).toEqual([
      'close',
      'pull',
      'gap',
      'ask',
      'n',
      'log',
      'notify',
    ])
    expect(insertStep(STEPS, { path: null, index: 0 }, step)[1]!.id).toBe('n')
    // 原数组不动。
    expect(STEPS[2]!.paths![1]!.steps).toHaveLength(1)
  })

  it('删条件步：第一条路的步骤留在原处，其余路一起删；焦点去它前面那一步', () => {
    const result = removeStep(STEPS, 'gap')!
    expect(flowOrder(result.steps)).toEqual(['close', 'pull', 'ask', 'notify'])
    expect(result.focus).toBe('pull')
    // 触发后面还有步骤时删不掉。
    expect(removeStep(STEPS, 'close')).toBeNull()
    expect(removeStep([STEPS[0]!], 'close')).toEqual({ steps: [], focus: null })
  })

  it('挪步：只在自己那一列里；触发不动，别的步挪不到触发前面', () => {
    expect(flowOrder(moveStep(STEPS, 'notify', -1)!)).toEqual(['close', 'pull', 'notify', 'gap', 'ask', 'log'])
    expect(moveStep(STEPS, 'pull', -1)).toBeNull()
    expect(moveStep(STEPS, 'close', 1)).toBeNull()
    expect(moveStep(STEPS, 'ask', 1)).toBeNull()
  })

  it('新 id 不撞已有的（含路 id）；条件模板开出空路', () => {
    expect(freshId(STEPS, 'gap')).toBe('gap-1')
    const branch = fromTemplate({ key: 'if', kind: 'branch', title: '条件' }, 'if-1', ['是', '否'])
    expect(branch.paths?.map((path) => [path.id, path.label, path.steps.length])).toEqual([
      ['if-1-p1', '是', 0],
      ['if-1-p2', '否', 0],
    ])
  })

  it('整条路都跳过才算跳过；耗时由调用方的时间算、不出负数', () => {
    const path = STEPS[2]!.paths![1]!
    expect(pathSkipped(path, { log: { status: 'skipped' } })).toBe(true)
    expect(pathSkipped(path, { log: { status: 'done' } })).toBe(false)
    expect(flowElapsed({ status: 'running', started: 1000 }, 4000)).toBe(3000)
    expect(flowElapsed({ status: 'running', started: 1000 })).toBeUndefined()
    expect(flowElapsed({ status: 'done', started: 5000, ended: 4000 })).toBe(0)
  })
})

describe('流程编排的渲染', () => {
  const render = (props: Partial<Parameters<typeof FlowBuilder>[0]> = {}) =>
    renderToStaticMarkup(
      <FlowBuilder
        name="跳空提醒（示例）"
        defaultSteps={STEPS}
        templates={[{ key: 'act', kind: 'action', title: '动作' }]}
        triggers={[{ key: 'cron', kind: 'trigger', title: '定时' }]}
        onRun={() => {}}
        formatDuration={(ms) => `${ms / 1000} 秒`}
        labels={LABELS}
        {...props}
      />,
    )

  it('每步一个切换钮，条件步的路并排、各带名字，每条线上一个「+」', () => {
    const html = render({ defaultSelected: 'pull' })
    expect(html.match(/data-slot="flow-step"/g)).toHaveLength(6)
    expect(html.match(/data-slot="flow-path"/g)).toHaveLength(2)
    expect(html).toContain('>是</span>')
    // 四步主线后各一个，两条路开头与各自一步后各一个：4 + 2 + 2。
    expect(html.match(/data-slot="flow-add"/g)).toHaveLength(8)
    expect(html).toContain('aria-label="在「否」开头加一步"')
    expect(html).toMatch(/data-id="pull"[^>]*aria-pressed="true"/)
    expect(html).toContain('测试运行')
  })

  it('在跑的步写 note 与耗时，读屏名带状态；整条跳过的路变淡；没有步骤时只有「加触发」', () => {
    const html = render({
      run: { close: { status: 'done' }, ask: { status: 'running', started: 0 }, log: { status: 'skipped' } },
      now: 2000,
      onStop: () => {},
    })
    expect(html).toContain('读公告')
    expect(html).toContain('2 秒')
    expect(html).toContain('aria-label="Agent，让研究员看，在跑"')
    expect(html.match(/data-skipped=""/g)).toHaveLength(1)
    expect(html).not.toContain('data-slot="flow-run"')
    expect(html).toContain('data-slot="flow-stop"')
    const empty = render({ defaultSteps: [] })
    expect(empty).toContain('加触发')
    expect(empty).not.toContain('data-slot="flow-step"')
  })
})
