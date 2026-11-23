// SPDX-License-Identifier: MIT
import { CostWaterfall, type CostStep } from '../../src/blocks'
import { formatCnAmount } from '../../src/cn'

// 示例数据：一次「写周报」会话的每一步（花费是人民币元，token 与毫秒是手写的演示值）。取数子 Agent 的数不用预先加，件自己加。
const STEPS: readonly CostStep[] = [
  {
    id: 'plan',
    name: '拆解任务',
    kind: 'llm',
    model: 'model-a',
    cost: 0.12,
    tokensIn: 3200,
    tokensOut: 600,
    duration: 2400,
  },
  {
    id: 'fetch',
    name: '取数',
    kind: 'agent',
    cost: 0.02,
    input: '取本周成交、权益与持仓',
    output: '312 笔成交，5 个账户',
    children: [
      { id: 'q1', name: '查成交', kind: 'tool', cost: 0.01, duration: 380, input: 'trades(week=47)', output: '312 行' },
      { id: 'q2', name: '查权益', kind: 'tool', cost: 0.01, duration: 240, input: 'equity(week=47)', output: '5 行' },
      {
        id: 'sum',
        name: '对账汇总',
        kind: 'llm',
        model: 'model-b',
        cost: 0.36,
        tokensIn: 18600,
        tokensOut: 1400,
        duration: 5200,
      },
    ],
  },
  {
    id: 'draft',
    name: '写周报草稿',
    kind: 'llm',
    model: 'model-a',
    cost: 0.84,
    tokensIn: 22400,
    tokensOut: 5200,
    duration: 14800,
    input: '按归因写三段：收益、回撤、下周计划',
    output: '本周净值 +1.8%……',
  },
  { id: 'cache', name: '提示缓存抵扣', kind: 'tool', cost: -0.18 },
]

export function CostWaterfallUsage() {
  return (
    <div className="gal-wide" style={{ maxWidth: 900 }} data-gallery-cw="main">
      <CostWaterfall
        title="会话花费（示例）"
        task="写第 47 周周报"
        label="会话步骤"
        steps={STEPS}
        formatCost={(cost) => `¥${formatCnAmount(cost, { digits: 2 })}`}
        formatTokens={(tokens) => formatCnAmount(tokens)}
        formatDuration={(ms) => `${(ms / 1000).toFixed(1)} 秒`}
        labels={{
          mode: '看什么',
          cost: '花费',
          tokens: 'token',
          kind: { agent: '子 Agent', llm: '模型', tool: '工具' },
          status: { running: '进行中', done: '完成', failed: '失败' },
          run: { live: '进行中', done: '完成', failed: '失败' },
          priciest: '最贵一步',
          name: '步骤',
          time: '时长',
          tokensIn: '输入',
          tokensOut: '输出',
          io: { agent: ['任务', '结果'], llm: ['提示', '回答'], tool: ['输入', '输出'] },
          details: '这一步的详情',
          error: '错误',
        }}
      />
    </div>
  )
}
