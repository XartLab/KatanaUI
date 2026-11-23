// SPDX-License-Identifier: MIT
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vite-plus/test'
import {
  moveSpan,
  slowestSpan,
  spanEnd,
  traceAxis,
  traceExtent,
  traceStatus,
  visibleSpans,
  type TraceSpan,
} from './trace-model.ts'
import { TraceWaterfall, type TraceWaterfallLabels } from './trace-waterfall.tsx'

const ROOT: TraceSpan = {
  id: 'req',
  name: '日 K',
  kind: 'request',
  start: 0,
  end: 640,
  children: [
    { id: 'cache', name: '缓存', kind: 'cache', start: 0, end: 12 },
    {
      id: 'tx',
      name: '腾讯',
      kind: 'fetch',
      start: 12,
      end: 420,
      children: [
        { id: 'tx1', name: '第 1 次', kind: 'fetch', status: 'failed', start: 12, end: 212, error: '超时' },
        { id: 'tx2', name: '第 2 次', kind: 'retry', start: 240, end: 420 },
      ],
    },
    { id: 'parse', name: '解析', kind: 'parse', start: 420, end: 470 },
  ],
}

const LABELS: TraceWaterfallLabels = {
  status: { running: '运行中', done: '完成', failed: '失败' },
  slowest: '最慢',
  name: '步骤',
  duration: '耗时',
  metric: '结果',
  start: '开始',
  detail: '说明',
  error: '错误',
  details: '详情',
}

describe('链路瀑布的纯逻辑', () => {
  it('运行中的 span 长到 now；没给 now 时长度为 0；不早于开始', () => {
    expect(spanEnd({ id: 'a', name: 'a', kind: 'k', status: 'running', start: 100 }, 350)).toBe(350)
    expect(spanEnd({ id: 'a', name: 'a', kind: 'k', status: 'running', start: 100 })).toBe(100)
    expect(spanEnd({ id: 'a', name: 'a', kind: 'k', start: 100, end: 50 })).toBe(100)
  })

  it('范围取最晚结束与 minRange 的大者，并取整齐步长', () => {
    expect(traceExtent(ROOT)).toBe(640)
    expect(traceAxis(640).range).toBe(800)
    expect(traceAxis(640).ticks).toEqual([0, 200, 400, 600, 800])
    expect(traceAxis(640, 10_000).range).toBe(10_000)
  })

  it('折叠的 span 不展开子；最慢的是跑完的叶子里最长的（失败的不算）', () => {
    expect(visibleSpans(ROOT, new Set()).map((row) => row.span.id)).toEqual([
      'req',
      'cache',
      'tx',
      'tx1',
      'tx2',
      'parse',
    ])
    expect(visibleSpans(ROOT, new Set(['tx'])).map((row) => row.span.id)).toEqual(['req', 'cache', 'tx', 'parse'])
    expect(slowestSpan(ROOT)).toBe('tx2')
  })

  it('整体状态：根失败才算失败，有运行中的是运行中', () => {
    expect(traceStatus(ROOT)).toBe('done')
    expect(traceStatus({ ...ROOT, status: 'failed' })).toBe('failed')
    expect(
      traceStatus({ ...ROOT, children: [{ id: 'x', name: 'x', kind: 'fetch', status: 'running', start: 0 }] }),
    ).toBe('running')
  })

  it('键盘：→ 先展开再进子，← 先收起再回父', () => {
    const open = visibleSpans(ROOT, new Set())
    expect(moveSpan(open, 'tx', 'ArrowRight')).toEqual({ focus: 'tx1' })
    expect(moveSpan(open, 'tx', 'ArrowLeft')).toEqual({ toggle: 'tx' })
    expect(moveSpan(open, 'tx2', 'ArrowLeft')).toEqual({ focus: 'tx' })
    const folded = visibleSpans(ROOT, new Set(['tx']))
    expect(moveSpan(folded, 'tx', 'ArrowRight')).toEqual({ toggle: 'tx' })
    expect(moveSpan(folded, 'tx', 'ArrowLeft')).toEqual({ focus: 'req' })
    expect(moveSpan(open, 'cache', 'End')).toEqual({ focus: 'parse' })
    expect(moveSpan(open, 'cache', 'x')).toBeUndefined()
  })
})

describe('链路瀑布的渲染', () => {
  it('一个 Tab 停点；有子的行带 aria-expanded；最慢与失败写在 data 上', () => {
    const html = renderToStaticMarkup(
      <TraceWaterfall root={ROOT} title="链路" label="示例链路" formatMs={(ms) => `${ms} ms`} labels={LABELS} />,
    )
    expect(html.match(/role="treeitem"/g)).toHaveLength(6)
    expect(html.match(/tabindex="0"/g)).toHaveLength(1)
    expect(html.match(/aria-expanded="true"/g)).toHaveLength(2)
    expect(html).toMatch(/data-id="tx2"[^>]*data-slowest=""/)
    expect(html).toMatch(/data-id="tx1"[^>]*data-status="failed"/)
  })

  it('打开一步：详情区写错误；折叠后子行不渲染', () => {
    const html = renderToStaticMarkup(
      <TraceWaterfall
        root={ROOT}
        title="链路"
        label="l"
        formatMs={String}
        labels={LABELS}
        defaultOpenId="tx1"
        defaultCollapsed={[]}
      />,
    )
    expect(html).toContain('超时')
    const folded = renderToStaticMarkup(
      <TraceWaterfall root={ROOT} title="链路" label="l" formatMs={String} labels={LABELS} defaultCollapsed={['tx']} />,
    )
    expect(folded).not.toContain('data-id="tx1"')
  })
})
