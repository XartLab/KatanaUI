// SPDX-License-Identifier: MIT
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vite-plus/test'
import { orbIntensity, ORB_SCALE, ORB_STATES } from '../katana/matrix-orb-model.ts'
import { AiApproval, AiContextMeter, AiDiff, AiPromptInput, AiResponse, AiTaskList, AiToolCall } from '../index.ts'
import { createAvatar, createRng, generatePalette, hashSeed } from './agent-avatar-model.ts'
import { contextFraction, contextLevel, formatTokenCount } from './ai-context-model.ts'
import { countDiff } from './ai-diff-model.ts'
import { formatBytes, shouldSubmit } from './ai-prompt-model.ts'
import { tokenizeResponse } from './ai-response-model.ts'
import { centreOutOrder } from './ai-suggestions.tsx'
import { taskProgress } from './ai-task-model.ts'
import { AI_STATE_MOTION, getAiStateAccentColor, getAiStateMotion } from './ai-core.ts'

// AI 件的纯逻辑与结构。动效、焦点、键盘在 e2e/ui-gallery.spec.ts 里用真浏览器验。

describe('core 状态约定', () => {
  it('六个状态都有动效参数，只有完成与出错带语义色', () => {
    expect(Object.keys(AI_STATE_MOTION).sort()).toEqual([...ORB_STATES].sort())
    expect(getAiStateMotion('done').accent).toBe('success')
    expect(getAiStateMotion('error').accent).toBe('danger')
    expect(getAiStateMotion('thinking').accent).toBeNull()
    expect(getAiStateMotion(undefined)).toBe(AI_STATE_MOTION.idle)
  })
  it('语义色走 token', () => {
    expect(getAiStateAccentColor('done', 'x')).toBe('var(--signal-green)')
    expect(getAiStateAccentColor('error', 'x')).toBe('var(--signal-red)')
    expect(getAiStateAccentColor('idle', 'x')).toBe('x')
  })
})

describe('MatrixOrb 并入的三个状态', () => {
  it('亮度在 0 到 1 之间，且每个状态有缩放目标', () => {
    for (const state of ['streaming', 'done', 'error'] as const) {
      expect(ORB_SCALE[state]).toBeGreaterThan(0)
      for (const t of [0, 0.7, 1.9, 5.3])
        for (const [x, y] of [
          [0, 0],
          [0.5, -0.4],
          [0.9, 0.2],
        ] as const) {
          const v = orbIntensity(state, x, y, t, 0.5)
          expect(v).toBeGreaterThanOrEqual(0)
          expect(v).toBeLessThanOrEqual(1)
        }
    }
  })
  it('完成态亮而平：中心足够亮', () => {
    expect(orbIntensity('done', 0, 0, 1, 0)).toBeGreaterThan(0.6)
  })
})

describe('ai-context', () => {
  it('token 数紧凑写法：一万以下留一位小数', () => {
    expect(formatTokenCount(842)).toBe('842')
    expect(formatTokenCount(1800)).toBe('1.8k')
    expect(formatTokenCount(62_000)).toBe('62k')
    expect(formatTokenCount(1_000_000)).toBe('1.0M')
    expect(formatTokenCount(-5)).toBe('0')
    expect(formatTokenCount(Number.NaN)).toBe('0')
  })
  it('占比夹在 0 到 1，窗口非正时为 0；越线换档', () => {
    expect(contextFraction(150, 100)).toBe(1)
    expect(contextFraction(5, 0)).toBe(0)
    expect(contextLevel(0.79)).toBe('ok')
    expect(contextLevel(0.8)).toBe('warning')
    expect(contextLevel(0.95)).toBe('danger')
    expect(contextLevel(0.6, 0.5, 0.7)).toBe('warning')
  })
  it('读屏名取 label，没有分项时按钮禁用', () => {
    const html = renderToStaticMarkup(<AiContextMeter used={62_000} limit={128_000} label="上下文已用 48%" />)
    expect(html).toContain('aria-label="上下文已用 48%"')
    expect(html).toContain('disabled=""')
    expect(html).toContain('62k/128k')
  })
})

describe('AiDiff', () => {
  const lines = [
    { kind: 'removed', content: 'a' },
    { kind: 'added', content: 'b' },
    { kind: 'added', content: 'c' },
    { kind: 'context', content: 'd' },
  ] as const
  it('数增删行', () => {
    expect(countDiff(lines)).toEqual({ added: 2, removed: 1 })
  })
  it('只有给了回调才画按钮；行读屏先读性质', () => {
    const labels = {
      accept: '接受',
      reject: '拒绝',
      accepted: '已接受',
      rejected: '已拒绝',
      added: '新增',
      removed: '删除',
      context: '未变',
    }
    const html = renderToStaticMarkup(<AiDiff lines={lines} labels={labels} onAccept={() => undefined} />)
    expect(html).toContain('接受')
    expect(html).not.toContain('拒绝')
    expect(html).toContain('<span class="sr-only">新增</span>')
  })
})

describe('AiApproval', () => {
  it('hold 的选项画成按住确认，普通选项是按钮；事实表带语气色', () => {
    const html = renderToStaticMarkup(
      <AiApproval
        question="下单？"
        facts={[{ label: '方向', value: '卖出', tone: 'down' }]}
        options={[
          { id: 'a', label: '批准', hold: { hint: '按住 2 秒' } },
          { id: 'b', label: '拒绝' },
        ]}
      />,
    )
    expect(html).toContain('k-hold')
    expect(html).toContain('data-slot="ai-approval-option"')
    expect(html).toContain('text-(color:--pnl-down)')
    expect(html).toContain('按住 2 秒')
  })
  it('resolvedId 直接画成已决定，选项收没', () => {
    const html = renderToStaticMarkup(
      <AiApproval
        question="下单？"
        options={[
          { id: 'a', label: '批准' },
          { id: 'b', label: '拒绝' },
        ]}
        resolvedId="b"
      />,
    )
    expect(html).toContain('data-resolved="b"')
    expect(html).toContain('data-slot="ai-approval-resolved"')
    expect(html).not.toContain('data-slot="ai-approval-option"')
  })
})

describe('AiResponse 切词', () => {
  it('引用标记单独成词，标点粘着也认；不在集合里的当文字', () => {
    const tokens = tokenizeResponse('估值 [1], 另见 [9]。', new Set([1]))
    expect(tokens.filter((token) => token.cite !== undefined)).toEqual([{ value: '[1]', cite: 1, word: false }])
    expect(tokens.map((token) => token.value).join('')).toBe('估值 [1], 另见 [9]。')
  })
  it('中文按词切而不是整句一个词', () => {
    const tokens = tokenizeResponse('贵州茅台今日下跌', new Set(), 'zh-CN').filter((token) => token.word)
    expect(tokens.length).toBeGreaterThan(1)
  })
  it('标点与空白不算词', () => {
    expect(tokenizeResponse('， ！', new Set()).some((token) => token.word)).toBe(false)
  })
  it('渲染出段落、光标与引用小标', () => {
    const html = renderToStaticMarkup(
      <AiResponse
        text="批价回落 [1]"
        isStreaming
        citations={[{ index: 1, source: { id: 'a', site: '财新', title: 't' } }]}
      />,
    )
    expect(html).toContain('data-slot="ai-response-caret"')
    expect(html).toContain('data-slot="web-search-citation"')
  })
})

describe('AiPromptInput', () => {
  it('附件大小写法', () => {
    expect(formatBytes(842)).toBe('842 B')
    expect(formatBytes(12_800)).toBe('13 KB')
    expect(formatBytes(1_480_000)).toBe('1.4 MB')
  })
  it('回车发送，Shift+回车不发；输入法选词中的回车不发', () => {
    const base = { key: 'Enter', shiftKey: false, isComposing: false }
    expect(shouldSubmit(base)).toBe(true)
    expect(shouldSubmit({ ...base, shiftKey: true })).toBe(false)
    expect(shouldSubmit({ ...base, isComposing: true })).toBe(false)
    expect(shouldSubmit({ ...base, keyCode: 229 })).toBe(false)
    expect(shouldSubmit({ ...base, key: 'a' })).toBe(false)
  })
  it('流式时发送钮是停止；读屏名取 labels', () => {
    const labels = { send: '发送', stop: '停止生成' }
    const idle = renderToStaticMarkup(<AiPromptInput label="提问" labels={labels} />)
    const streaming = renderToStaticMarkup(<AiPromptInput label="提问" labels={labels} state="streaming" />)
    expect(idle).toContain('aria-label="发送"')
    expect(idle).toContain('disabled=""')
    expect(streaming).toContain('aria-label="停止生成"')
    expect(streaming).toContain('data-mode="stop"')
  })
})

describe('AiSuggestions / AiTaskList / AiToolCall', () => {
  it('从中间向两边：中间 0，两端最大', () => {
    expect(centreOutOrder(5)).toEqual([2, 1, 0, 1, 2])
    expect(centreOutOrder(4)).toEqual([1.5, 0.5, 0.5, 1.5])
  })
  it('计划计数从任务派生，含子步骤', () => {
    expect(
      taskProgress([
        { id: 'a', label: 'a', status: 'done', children: [{ id: 'a1', label: 'a1', status: 'done' }] },
        { id: 'b', label: 'b', status: 'running' },
      ]),
    ).toEqual({ done: 2, total: 3 })
    const html = renderToStaticMarkup(
      <AiTaskList
        label="计划"
        statusLabels={{ pending: '待办', running: '进行中', done: '已完成', failed: '失败' }}
        tasks={[{ id: 'a', label: '读行情', status: 'done' }]}
      />,
    )
    expect(html).toContain('1/1')
    expect(html).toContain('已完成')
  })
  it('没有参数与结果时工具行不可展开；状态词给读屏', () => {
    const labels = {
      status: { pending: '排队', running: '运行中', success: '完成', error: '失败' },
      args: '参数',
      result: '结果',
    }
    const html = renderToStaticMarkup(<AiToolCall name="search_news" labels={labels} status="running" />)
    expect(html).toContain('disabled=""')
    expect(html).toContain('<span class="sr-only">运行中</span>')
  })
})

describe('AgentAvatar', () => {
  it('同一个种子永远同一串：散列、色板、格子', () => {
    expect(hashSeed('risk')).toBe(hashSeed('risk'))
    expect(hashSeed('risk')).not.toBe(hashSeed('executor'))
    expect(generatePalette(hashSeed('risk'))).toEqual(generatePalette(hashSeed('risk')))
    const a = createRng(7)
    const b = createRng(7)
    expect([a(), a(), a()]).toEqual([b(), b(), b()])
    const avatar = createAvatar('risk', 48)
    expect(avatar.grid).toHaveLength(6)
    expect(avatar.grid[0]).toHaveLength(6)
  })
})
