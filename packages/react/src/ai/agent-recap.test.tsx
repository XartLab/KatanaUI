// SPDX-License-Identifier: MIT
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vite-plus/test'
import { AgentRecap, type AgentRecapLabels } from './agent-recap.tsx'
import { AwaySummary, type AwaySummaryLabels } from './away-summary.tsx'
import { recapBuckets, recapCounts, recapLanes, recapOrder, type RecapEvent } from './recap-model.ts'

// 时间是分钟（×60000 成毫秒）；离开 0 → 回来 600。
const m = (minutes: number) => minutes * 60_000
const EVENTS: RecapEvent[] = [
  { id: 'r1', time: m(100), kind: 'done', title: '日 K 回补完成', count: '312 只' },
  { id: 'r2', time: m(200), kind: 'needs', title: '调仓建议待批', detail: '3 笔' },
  { id: 'r3', time: m(300), kind: 'failed', title: '新闻源抓取失败', detail: '限流 456' },
  { id: 'r4', time: m(400), kind: 'done', title: '因子重算完成' },
  { id: 'r5', time: m(500), kind: 'needs', title: '数据缺口确认', action: '去看' },
]

const RECAP_LABELS: AgentRecapLabels = {
  lanes: { needs: '要你拍板', failed: '失败', done: '做完' },
  empty: { needs: '没有要你的', failed: '没有失败', done: '还没做完的' },
  tag: { needs: '要你', failed: '失败', done: '完成' },
  action: { needs: '批准', failed: '重试' },
  review: '查看',
  undo: '撤销',
  redo: '重做',
  working: '处理中',
  acted: '已处理',
  undone: '已撤销',
  more: (n) => `还有 ${n} 件`,
  named: (verb, title) => `${verb}：${title}`,
  announce: (verb, title) => `${title} 已${verb}`,
}

const AWAY_LABELS: AwaySummaryLabels = {
  heading: (since, now) => `你离开了 ${(now - since) / 60_000} 分`,
  counts: (c) => `${c.needs} 件要你 · ${c.failed} 件失败 · ${c.done} 件做完`,
  mark: { needs: '要你', failed: '失败', done: '做完' },
  action: { needs: '决定', failed: '重试', done: '打开' },
  working: '处理中',
  named: (verb, title) => `${verb}：${title}`,
  more: (n) => `再看 ${n} 件`,
  less: '收起',
  gotIt: '知道了',
  divider: (since, now) => `离开 ${(now - since) / 60_000} 分 · 已读`,
}

describe('离开期间的分类与次序', () => {
  it('三列各自新的在前；清单要你的在前、失败其次、做完最后', () => {
    const lanes = recapLanes(EVENTS)
    expect(lanes.needs.map((e) => e.id)).toEqual(['r5', 'r2'])
    expect(lanes.done.map((e) => e.id)).toEqual(['r4', 'r1'])
    expect(recapOrder(EVENTS).map((e) => e.id)).toEqual(['r5', 'r2', 'r3', 'r4', 'r1'])
    expect(recapCounts(EVENTS)).toEqual({ needs: 2, failed: 1, done: 2 })
  })

  it('分布按时间等分，范围外的不算', () => {
    expect(recapBuckets(EVENTS, m(0), m(600), 6)).toEqual([0, 1, 1, 1, 1, 1])
    expect(recapBuckets(EVENTS, m(250), m(600), 1)).toEqual([3])
  })
})

describe('离开期间的渲染', () => {
  it('AgentRecap：列头写总数，超出上限的写还有几件，动作按类给', () => {
    const html = renderToStaticMarkup(
      <AgentRecap
        events={EVENTS}
        since={m(0)}
        until={m(600)}
        limit={1}
        onAction={() => {}}
        onUndo={() => {}}
        title="昨夜（示例）"
        formatTime={(t) => `${t / 60_000}`}
        labels={RECAP_LABELS}
      />,
    )
    expect(html.match(/data-slot="recap-card"/g)).toHaveLength(3)
    expect(html.match(/data-slot="recap-count"/g)).toHaveLength(3)
    expect(html).toContain('还有 1 件')
    // 要你的卡用它自己的动作字；做完的卡有撤销；失败的有重试。
    expect(html).toContain('aria-label="去看：数据缺口确认"')
    expect(html).toContain('aria-label="撤销：因子重算完成"')
    expect(html).toContain('aria-label="重试：新闻源抓取失败"')
  })

  it('AwaySummary：按次序排、超出的收起，折起来只剩一行分隔条', () => {
    const open = renderToStaticMarkup(
      <AwaySummary since={m(0)} now={m(134)} items={EVENTS} limit={3} onAction={() => {}} labels={AWAY_LABELS} />,
    )
    expect(open).toContain('你离开了 134 分')
    expect(open.match(/data-slot="away-row"/g)).toHaveLength(3)
    expect(open).toContain('再看 2 件')
    expect(open.indexOf('数据缺口确认')).toBeLessThan(open.indexOf('新闻源抓取失败'))
    const folded = renderToStaticMarkup(
      <AwaySummary since={m(0)} now={m(134)} items={EVENTS} defaultCollapsed labels={AWAY_LABELS} />,
    )
    expect(folded).toContain('data-slot="away-divider"')
    expect(folded).not.toContain('data-slot="away-row"')
  })
})
