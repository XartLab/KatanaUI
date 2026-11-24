// SPDX-License-Identifier: MIT
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vite-plus/test'
import { AgentRunDetail, type AgentRunDetailLabels, type AgentRunDetailProps } from './agent-run-detail.tsx'
import { AgentRunList, type AgentRunListLabels } from '../agent-run-list/agent-run-list.tsx'
import {
  clampRunProgress,
  currentRunStep,
  runHeaderAction,
  runHeadingLevel,
  runSubHeadingLevel,
  runPercent,
  runSegments,
  runStepTone,
  runTimeLine,
  runTickCount,
  runTone,
  type RunDetailStatus,
} from './run-model.ts'

const LABELS: AgentRunDetailLabels = {
  back: 'Back',
  status: { running: 'Running', blocked: 'Blocked', done: 'Done', paused: 'Paused', failed: 'Failed' },
  actions: { pause: 'Pause', resume: 'Resume', cancel: 'Cancel', rerun: 'Run again' },
  progress: 'Run progress',
  progressValue: (percent, status) => `${percent}%, ${status}`,
  elapsed: (time) => `Elapsed ${time}`,
  remaining: (time) => `~${time} left`,
  blocked: (time) => `Blocked ${time} ago`,
  completed: (time) => `Completed in ${time}`,
  confirm: 'Confirm',
  next: 'Run next',
  details: 'Details',
  steps: 'Steps',
  estimate: (time) => `~${time}`,
  step: { done: 'Done', running: 'Running', pending: 'Waiting', blocked: 'Blocked', failed: 'Failed' },
}

const sec = (n: number) => n * 1000
const formatDuration = (ms: number) => `${Math.round(ms / 1000)}s`

const STEPS = [
  { id: 's1', name: 'Fetch cycle', status: 'done', duration: sec(46) },
  { id: 's2', name: 'Process records', status: 'running' },
  { id: 's3', name: 'Generate payment', status: 'pending' },
] as const

const render = (props: Partial<AgentRunDetailProps> = {}) =>
  renderToStaticMarkup(
    <AgentRunDetail
      name="Run payroll"
      status="running"
      progress={0.62}
      elapsed={sec(372)}
      remaining={sec(240)}
      formatDuration={formatDuration}
      steps={STEPS}
      details={[{ id: 'k', label: 'Worker', value: '48 contractors' }]}
      labels={LABELS}
      {...props}
    />,
  )

describe('运行详情的纯逻辑', () => {
  it('五种状态各有一个语气，步骤也有', () => {
    expect(runTone('running')).toBe('accent')
    expect(runTone('blocked')).toBe('warn')
    expect(runTone('done')).toBe('ok')
    expect(runTone('paused')).toBe('neutral')
    expect(runTone('failed')).toBe('danger')
    expect(runStepTone('pending')).toBe('off')
    expect(runStepTone('blocked')).toBe('warn')
  })

  it('右上动作钮随状态变：在跑暂停、暂停继续、阻塞取消、完成与失败再跑', () => {
    const want: Record<RunDetailStatus, string> = {
      running: 'pause',
      paused: 'resume',
      blocked: 'cancel',
      done: 'rerun',
      failed: 'rerun',
    }
    for (const [status, action] of Object.entries(want)) expect(runHeaderAction(status as RunDetailStatus)).toBe(action)
  })

  it('进度夹在 0 到 1 之间，坏值当 0', () => {
    expect(clampRunProgress(-1)).toBe(0)
    expect(clampRunProgress(2)).toBe(1)
    expect(clampRunProgress(Number.NaN)).toBe(0)
    expect(runPercent(0.625)).toBe(62)
  })

  it('百分比向下取整，跟刻度一致：没跑完不显示 100%', () => {
    expect(runPercent(0.996)).toBe(99)
    expect(runPercent(0.999)).toBe(99)
    expect(runPercent(0.995)).toBe(99)
    expect(runPercent(1)).toBe(100)
    // 浮点乘法差一点的值不被吞掉一个百分点。
    expect(runPercent(0.29)).toBe(29)
    expect(runPercent(0.58)).toBe(58)
    expect(runSegments(0.575, 40, 'running').filled).toBe(23)
  })

  it('刻度数：夹在 1 到 120，不是有限数取 40', () => {
    expect(runTickCount(undefined)).toBe(40)
    expect(runTickCount(Number.NaN)).toBe(40)
    expect(runTickCount(Infinity)).toBe(40)
    expect(runTickCount(-Infinity)).toBe(40)
    expect(runTickCount(0)).toBe(1)
    expect(runTickCount(-5)).toBe(1)
    expect(runTickCount(20.9)).toBe(20)
    expect(runTickCount(500)).toBe(120)
    expect(runSegments(0.5, Number.NaN, 'running')).toEqual({ filled: 20, current: 20 })
    expect(runSegments(0.5, 0, 'running')).toEqual({ filled: 0, current: 0 })
  })

  it('刻度：亮的是走过的整根，当前刻度是第一根暗的，只在跑时有；完成全亮', () => {
    expect(runSegments(0.62, 40, 'running')).toEqual({ filled: 24, current: 24 })
    expect(runSegments(0.76, 40, 'blocked')).toEqual({ filled: 30, current: -1 })
    expect(runSegments(0.3, 40, 'paused')).toEqual({ filled: 12, current: -1 })
    expect(runSegments(0.5, 40, 'done')).toEqual({ filled: 40, current: -1 })
    expect(runSegments(1, 40, 'running')).toEqual({ filled: 40, current: -1 })
    expect(runSegments(0, 40, 'running')).toEqual({ filled: 0, current: 0 })
  })

  it('时间行：在跑写已用与约剩，阻塞写阻塞多久，完成写总用时', () => {
    expect(runTimeLine('running')).toEqual({ left: 'elapsed', remaining: true })
    expect(runTimeLine('blocked')).toEqual({ left: 'blocked', remaining: false })
    expect(runTimeLine('done')).toEqual({ left: 'completed', remaining: false })
  })

  it('标题层级：2 到 6，其余取 2；下一级最多到 6', () => {
    expect([2, 3, 4, 5, 6].map(runHeadingLevel)).toEqual([2, 3, 4, 5, 6])
    for (const bad of [undefined, 1, 7, 0, 2.5, Number.NaN, Infinity]) expect(runHeadingLevel(bad)).toBe(2)
    expect([2, 5, 6, undefined, 9].map(runSubHeadingLevel)).toEqual([3, 6, 6, 3, 3])
  })

  it('当前步是第一个在跑或阻塞的', () => {
    expect(currentRunStep(STEPS)?.id).toBe('s2')
    expect(currentRunStep([{ id: 'a', name: 'a', status: 'done' }])).toBeUndefined()
  })
})

describe('AgentRunDetail', () => {
  it('进度条是 progressbar，带名字与 aria-valuenow，刻度全是装饰', () => {
    const html = render()
    expect(html).toMatch(/role="progressbar"[^>]*aria-label="Run progress"/)
    expect(html).toContain('aria-valuenow="62"')
    expect(html).toContain('aria-valuemin="0"')
    expect(html).toContain('aria-valuemax="100"')
    const ticks = html.match(/<i aria-hidden="true" data-tick="[a-z]+"/g) ?? []
    expect(ticks).toHaveLength(40)
    expect(html.match(/data-tick="lit"/g)).toHaveLength(24)
    expect(html.match(/data-tick="current"/g)).toHaveLength(1)
  })

  it('刻度根数可调；不是有限数取 40，夹在 1 到 120，不抛错', () => {
    expect(render({ ticks: 20 }).match(/data-tick=/g)).toHaveLength(20)
    for (const ticks of [Number.NaN, Infinity, -Infinity]) {
      const html = render({ ticks })
      expect(html.match(/data-tick=/g)).toHaveLength(40)
      expect(html).toContain('--ard-ticks:40')
    }
    expect(render({ ticks: 0 }).match(/data-tick=/g)).toHaveLength(1)
    expect(render({ ticks: 9999 }).match(/data-tick=/g)).toHaveLength(120)
  })

  it('快到 100% 时没跑完不显示 100%：在跑 0.996、阻塞 0.995 都是 99%，刻度没满', () => {
    const running = render({ progress: 0.996 })
    expect(running).toContain('>99%<')
    expect(running).toContain('aria-valuenow="99"')
    expect(running.match(/data-tick="lit"/g)).toHaveLength(39)
    expect(running.match(/data-tick="current"/g)).toHaveLength(1)
    const blocked = render({ status: 'blocked', progress: 0.995 })
    expect(blocked).toContain('>99%<')
    expect(blocked).toContain('aria-valuenow="99"')
    expect(blocked).not.toContain('>100%<')
  })

  it('进度条的读法由 labels 拼：百分比加状态词', () => {
    expect(render({ status: 'blocked', progress: 0.76 })).toContain('aria-valuetext="76%, Blocked"')
    expect(render()).toContain('aria-valuetext="62%, Running"')
  })

  it('在跑：已用时在左、约剩在右，动作钮是暂停，没有问题卡也没有接着跑', () => {
    const html = render()
    expect(html).toContain('Elapsed 372s')
    expect(html).toContain('~240s left')
    expect(html).not.toContain('data-slot="run-question"')
    expect(html).not.toContain('data-slot="run-next"')
    expect(html).not.toContain('data-slot="run-action"')
    expect(render({ onAction: () => {} })).toMatch(/data-slot="run-action"[^>]*data-action="pause"/)
  })

  it('阻塞：写阻塞多久、没有约剩，问题卡带确认钮，动作钮是取消', () => {
    const html = render({
      status: 'blocked',
      blockedFor: sec(3480),
      question: { title: 'Lucas Mendes is missing a Tax ID', description: 'Add it to their profile?' },
      onConfirm: () => {},
      onAction: () => {},
      steps: [{ id: 'v', name: 'Verify Tax ID', status: 'blocked' }],
    })
    expect(html).toContain('Blocked 3480s ago')
    expect(html).not.toContain('left')
    expect(html).toContain('data-slot="run-question"')
    expect(html).toContain('Lucas Mendes is missing a Tax ID')
    expect(html).toMatch(/data-slot="run-confirm"[^>]*>Confirm/)
    expect(html).toMatch(/data-action="cancel"/)
    // 「取消」是 danger 样式，跟「确认」分得开；在跑时的「暂停」不是。
    expect(html).toMatch(
      /data-variant="danger"[^>]*data-action="cancel"|data-action="cancel"[^>]*data-variant="danger"/,
    )
    expect(render({ onAction: () => {} })).not.toContain('data-variant="danger"')
    // 确认钮用 aria-describedby 指向问题的标题与说明。
    const button = html.match(/<button[^>]*data-slot="run-confirm"[^>]*>/)![0]
    const describedby = button.match(/aria-describedby="([^"]+)"/)![1]!.split(' ')
    expect(describedby).toHaveLength(2)
    for (const id of describedby) expect(html).toContain(`id="${id}"`)
    expect(html).toMatch(/aria-current="step"/)
    expect(html).toContain('data-tone="warn"')
  })

  it('没有说明时确认钮只指向标题', () => {
    const html = render({ status: 'blocked', question: { title: 'Missing' }, onConfirm: () => {} })
    const button = html.match(/<button[^>]*data-slot="run-confirm"[^>]*>/)![0]
    const describedby = button.match(/aria-describedby="([^"]+)"/)![1]!
    expect(describedby.split(' ')).toHaveLength(1)
    expect(html).toContain(`id="${describedby}"`)
  })

  it('问题卡只在阻塞时出现；没给 onConfirm 就没有确认钮', () => {
    const question = { title: 'Missing' }
    expect(render({ question })).not.toContain('run-question')
    const html = render({ status: 'blocked', question })
    expect(html).toContain('run-question')
    expect(html).not.toContain('run-confirm')
  })

  it('完成：百分比 100，刻度全亮，写总用时，接着跑每钮带名字与预估，动作钮是再跑一次', () => {
    const html = render({
      status: 'done',
      progress: 0.9,
      took: sec(197),
      next: [
        { id: 'send', label: 'Send report', estimate: sec(120) },
        { id: 'schedule', label: 'Schedule re-run' },
      ],
      onNext: () => {},
      onAction: () => {},
    })
    expect(html).toContain('100%')
    expect(html).toContain('aria-valuenow="100"')
    expect(html.match(/data-tick="lit"/g)).toHaveLength(40)
    expect(html).toContain('Completed in 197s')
    expect(html).toMatch(/data-id="send"[^>]*>.*Send report.*~120s/)
    expect(html).toMatch(/data-id="schedule"/)
    expect(html).toMatch(/data-action="rerun"/)
  })

  it('接着跑只在完成时出现', () => {
    expect(render({ next: [{ id: 'a', label: 'A' }] })).not.toContain('run-next')
  })

  it('暂停与失败也画得出，状态词在百分比旁', () => {
    expect(render({ status: 'paused' })).toContain('data-tone="neutral"')
    expect(render({ status: 'paused', onAction: () => {} })).toContain('data-action="resume"')
    const failed = render({ status: 'failed', onAction: () => {} })
    expect(failed).toContain('data-tone="danger"')
    expect(failed).toContain('Failed')
    expect(failed).toContain('data-action="rerun"')
  })

  it('详情与步骤的标题是按钮，默认展开，aria-expanded 与 aria-controls 配对', () => {
    const html = render()
    const buttons = [...html.matchAll(/<button type="button" aria-expanded="(true|false)" aria-controls="([^"]+)"/g)]
    expect(buttons.map((m) => m[1])).toEqual(['true', 'true'])
    for (const [, , id] of buttons) expect(html).toContain(`id="${id}"`)
    expect(html).not.toContain(' hidden=')
  })

  it('defaultCollapsed 的分组一开始收起：aria-expanded 为 false，内容先 hidden（挂上后在浏览器里改成 until-found）', () => {
    const html = render({ defaultCollapsed: ['steps'] })
    expect(html).toMatch(/aria-expanded="false"[^>]*><span>Steps/)
    expect(html.match(/ hidden=""/g)).toHaveLength(1)
  })

  it('步骤：每步读屏词，完成写耗时、在跑与阻塞写状态字、等待不写，在跑那步 aria-current', () => {
    const html = render()
    expect(html).toContain('Fetch cycle<span class="k-ard-sr">Done</span>')
    expect(html).toContain('>46s<')
    // 完成步骤的耗时读屏读得到，状态词（在跑）写在右边的那份才对读屏隐藏。
    expect(html).toMatch(/<span class="k-ard-step-meta">46s<\/span>/)
    expect(html).toMatch(/<span class="k-ard-step-meta" aria-hidden="true">Running<\/span>/)
    expect(html).toMatch(/data-status="running"[^>]*aria-current="step"/)
    expect(html).toMatch(/data-status="pending"[^>]*>.*?<span class="k-ard-step-meta" aria-hidden="true"><\/span>/)
  })

  it('返回钮只在给了 onBack 时有；详情行带键与值，图标对读屏隐藏', () => {
    expect(render()).not.toContain('run-back')
    expect(render({ onBack: () => {} })).toMatch(/aria-label="Back"/)
    const html = render({ details: [{ id: 'w', label: 'Worker', icon: <svg />, value: '48 contractors' }] })
    expect(html).toContain('<dt>Worker</dt>')
    expect(html).toContain('<span aria-hidden="true"><svg></svg></span>48 contractors')
  })

  it('没有详情与步骤时不画那两组', () => {
    const html = render({ details: [], steps: [] })
    expect(html).not.toContain('run-details')
    expect(html).not.toContain('run-steps')
  })
})

describe('标题层级由调用方定', () => {
  const blocked = { status: 'blocked', question: { title: 'Missing' }, onConfirm: () => {} } as const
  const heads = (html: string) =>
    [...html.matchAll(/<h([1-6])[^>]*class="(k-ard-[a-z-]+)"/g)].map((m) => `${m[2]}:${m[1]}`)

  it('默认运行名是 h2，分组标题与问题标题是 h3', () => {
    expect(heads(render(blocked))).toEqual([
      'k-ard-name:2',
      'k-ard-question-title:3',
      'k-ard-section-title:3',
      'k-ard-section-title:3',
    ])
  })

  it('headingLevel 往下传：运行名 h4，其余 h5；到 6 为止；坏值当 2', () => {
    expect(heads(render({ ...blocked, headingLevel: 4 }))).toEqual([
      'k-ard-name:4',
      'k-ard-question-title:5',
      'k-ard-section-title:5',
      'k-ard-section-title:5',
    ])
    expect(heads(render({ headingLevel: 6 }))).toEqual([
      'k-ard-name:6',
      'k-ard-section-title:6',
      'k-ard-section-title:6',
    ])
    expect(heads(render({ headingLevel: 1 as 2 }))[0]).toBe('k-ard-name:2')
    expect(render({ headingLevel: 4 })).not.toMatch(/<h[1236]/)
  })
})

describe('AgentRunList', () => {
  const LIST_LABELS: AgentRunListLabels = {
    status: { running: 'Running', blocked: 'Action required', done: 'Completed', paused: 'Paused', failed: 'Failed' },
  }
  const html = renderToStaticMarkup(
    <AgentRunList
      title="Agents"
      actions={<button type="button">New agent</button>}
      groups={[
        {
          id: 'active',
          title: 'Active now',
          items: [
            { id: 'a', name: 'Run payroll', subtitle: '48 contractors', status: 'running', when: 'Started 6m ago' },
            { id: 'b', name: 'Create EOR contract', status: 'blocked', when: 'Blocked 1h ago' },
          ],
        },
        { id: 'week', title: 'This week', items: [{ id: 'c', name: 'Review compliance', status: 'done' }] },
      ]}
      selectedId="b"
      onOpen={() => {}}
      labels={LIST_LABELS}
    />,
  )

  it('分组有名字，一行一个运行，读屏名依次写名字、副标题、状态、时间', () => {
    // 分组标题是真标题（不隐藏），分组用 aria-labelledby 指向它。
    const labelledby = html.match(/class="k-arl-group" role="group" aria-labelledby="([^"]+)"/)![1]!
    expect(html).toContain(`<h3 id="${labelledby}" class="k-arl-group-title">Active now</h3>`)
    expect(html).not.toMatch(/<h[1-6][^>]*aria-hidden/)
    expect(html.match(/data-slot="run-row"/g)).toHaveLength(3)
    expect(html).toContain('aria-label="Run payroll, 48 contractors, Running, Started 6m ago"')
    expect(html).toContain('aria-label="Create EOR contract, Action required, Blocked 1h ago"')
  })

  it('状态字着状态色：行带 data-tone；选中的行 aria-current', () => {
    expect(html).toMatch(/data-id="b" data-status="blocked" data-tone="warn"/)
    expect(html).toMatch(/data-id="c" data-status="done" data-tone="ok"/)
    expect(html.match(/aria-current="true"/g)).toHaveLength(1)
    expect(html).toMatch(/data-id="b"[^>]*aria-current="true"/)
  })

  it('headingLevel：标题 h4，分组标题 h5', () => {
    const level = renderToStaticMarkup(
      <AgentRunList
        title="Agents"
        headingLevel={4}
        groups={[{ id: 'g', title: 'G', items: [] }]}
        labels={LIST_LABELS}
      />,
    )
    expect(level).toContain('>Agents</h4>')
    expect(level).toMatch(/<h5 id="[^"]+" class="k-arl-group-title">G<\/h5>/)
  })

  it('头上有标题与右侧动作', () => {
    expect(html).toContain('>Agents</h2>')
    expect(html).toContain('New agent')
  })
})
