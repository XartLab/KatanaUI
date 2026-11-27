// SPDX-License-Identifier: MIT
import { DecisionTree, type Decision } from '../../src/index'

// 示例数据：数据员 Agent 走到两个岔口，问题与后果是手写的演示值。
const DECISIONS: readonly Decision[] = [
  {
    id: 'gap',
    question: '600519 日 K 缺了 3 天，怎么补？',
    context: '2026-11-18 到 11-20，主源返回空',
    agent: '数据员',
    model: 'model-a',
    risk: 'medium',
    options: [
      {
        id: 'refetch',
        label: '从备源重抓',
        pick: true,
        effects: [
          '约 2 分钟',
          { text: '备源复权口径不同', note: '要用复权因子对一次，否则跳空', source: '回落链日志' },
        ],
      },
      { id: 'suspend', label: '标成停牌', effects: ['回测里这三天没有成交', '指标窗口会跳过这三天'] },
      { id: 'leave', label: '先不管', effects: [{ text: '依赖它的因子会算错', note: '动量 20 日窗口受影响' }] },
    ],
  },
  {
    id: 'clean',
    question: '分钟线里有 12 根成交量为 0，要删吗？',
    agent: '数据员',
    options: [
      { id: 'drop', label: '删掉', effects: ['K 线会断开'] },
      { id: 'keep', label: '保留', pick: true, effects: ['成交量均线会被拉低一点'] },
    ],
  },
]

export function DecisionTreeUsage() {
  return (
    <div className="gal-wide" style={{ maxWidth: 900 }} data-gallery-dt="main">
      <DecisionTree
        title="待定（示例）"
        decisions={DECISIONS}
        onChoose={(_, choice) => ('other' in choice ? `收到，按「${choice.other}」处理` : undefined)}
        labels={{
          agentPick: 'Agent 倾向',
          risk: { high: '高风险', medium: '中风险' },
          other: '其他…',
          otherField: '写一句指示给 Agent',
          send: '发出',
          position: (index, count) => `${index} / ${count}`,
          previous: '上一个',
          next: '下一个',
          chose: (question, choice) => `${question} 选了 ${choice}`,
          sent: (question) => `${question}：指示已发出`,
          empty: '没有待定的决定',
        }}
      />
    </div>
  )
}
