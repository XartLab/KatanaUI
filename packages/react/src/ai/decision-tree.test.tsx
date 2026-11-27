// SPDX-License-Identifier: MIT
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vite-plus/test'
import { DecisionTree, type Decision, type DecisionTreeLabels } from './decision-tree.tsx'
import { SmartRecommendation, clampSignal, type SmartRecommendationLabels } from './smart-recommendation.tsx'

const DECISIONS: Decision[] = [
  {
    id: 'gap',
    question: '日 K 缺了 3 天，怎么补？',
    context: '600519 · 2026-11-18 到 20',
    agent: '数据员',
    model: 'model-a',
    risk: 'medium',
    options: [
      {
        id: 'refetch',
        label: '从备源重抓',
        pick: true,
        effects: ['约 2 分钟', { text: '备源复权口径不同', note: '要对一次复权因子', source: '回落链日志' }],
      },
      { id: 'skip', label: '标成停牌', effects: ['回测里这三天没有成交'] },
    ],
  },
  {
    id: 'size',
    question: '调仓幅度？',
    agent: '风控',
    options: [
      { id: 'a', label: '降到 60%' },
      { id: 'b', label: '不动' },
    ],
  },
]

const TREE_LABELS: DecisionTreeLabels = {
  agentPick: 'Agent 倾向',
  risk: { high: '高风险', medium: '中风险' },
  other: '其他…',
  otherField: '写一句指示',
  send: '发出',
  position: (i, n) => `${i} / ${n}`,
  previous: '上一个',
  next: '下一个',
  chose: (q, c) => `${q}：${c}`,
  sent: (q) => `已发出：${q}`,
  empty: '没有待定的决定',
}

const REC_LABELS: SmartRecommendationLabels = {
  signal: (s) => ['没把握', '把握不大', '较有把握', '很有把握'][s]!,
  recommended: '推荐',
  alternatives: '其他选项',
  accept: '采用',
  undo: '撤销',
  accepted: (label) => `已采用 ${label}`,
}

describe('决策树', () => {
  it('当前决定的分支编号、Agent 倾向、风险标与打标的后果都写出来，最后一支是其他', () => {
    const html = renderToStaticMarkup(<DecisionTree decisions={DECISIONS} title="待定（示例）" labels={TREE_LABELS} />)
    expect(html.match(/data-slot="decision-option"/g)).toHaveLength(2)
    expect(html).toContain('aria-label="从备源重抓，Agent 倾向"')
    expect(html).toContain('中风险')
    expect(html).toContain('role="tooltip"')
    expect(html).toContain('aria-keyshortcuts="3"')
    expect(html).toContain('1 / 2')
    expect(html).not.toContain('调仓幅度')
  })

  it('不给其他、没有待定的写空态', () => {
    const none = renderToStaticMarkup(<DecisionTree decisions={[]} title="待定" labels={TREE_LABELS} />)
    expect(none).toContain('没有待定的决定')
    const noOther = renderToStaticMarkup(
      <DecisionTree decisions={DECISIONS} allowOther={false} title="待定" labels={TREE_LABELS} />,
    )
    expect(noOther).not.toContain('data-slot="decision-other"')
  })
})

describe('带置信度的建议卡', () => {
  it('第一项是推荐，置信度写成字，格子按级点亮', () => {
    const html = renderToStaticMarkup(
      <SmartRecommendation
        title="建议（示例）"
        options={[
          { id: 'a', label: '把止损上移到 1820', reason: '近 5 日低点抬高', signal: 2, source: '规则：波动止损' },
          { id: 'b', label: '不动', signal: 1 },
        ]}
        labels={REC_LABELS}
      />,
    )
    expect(html).toContain('把止损上移到 1820')
    expect(html).toContain('推荐')
    expect(html).toContain('较有把握')
    expect(html.match(/data-on=""/g)).toHaveLength(2)
    expect(html).toContain('其他选项')
    expect(clampSignal(7)).toBe(3)
    expect(clampSignal(-1)).toBe(0)
  })
})
