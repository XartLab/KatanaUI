// SPDX-License-Identifier: MIT
import { FanOutGrid, type FanTask } from '../../src/index'
import { formatCnAmount } from '../../src/cn'

// 示例数据：给 48 只票补资金流，状态按固定规则生成（不是随机），耗时与花费是演示值。
const STATUS: readonly FanTask['status'][] = ['done', 'done', 'done', 'running', 'done', 'failed', 'done', 'queued']
const TASKS: readonly FanTask[] = Array.from({ length: 48 }, (_, n) => {
  const status = n < 30 ? STATUS[n % STATUS.length]! : n < 34 ? 'running' : n === 34 ? 'retrying' : 'queued'
  const finished = status === 'done' || status === 'failed'
  return {
    id: `t${n}`,
    label: `${600000 + n * 7}`,
    status,
    worker: `w${(n % 4) + 1}`,
    start: finished || status === 'running' ? n * 400 : undefined,
    end: finished ? n * 400 + 2000 + (n % 5) * 300 : undefined,
    cost: finished ? 0.004 : undefined,
    attempts: status === 'failed' ? 3 : 1,
    result: status === 'done' ? '240 行' : undefined,
    error: status === 'failed' ? '没有这只票的数据' : undefined,
  }
})

export function FanOutGridUsage() {
  return (
    <div className="gal-wide" style={{ maxWidth: 640 }} data-gallery-fan="main">
      <FanOutGrid
        title="分发（示例）"
        job="给 48 只票补资金流"
        tasks={TASKS}
        workers={4}
        onRetry={() => {}}
        formatCost={(cost) => `¥${formatCnAmount(cost, { digits: 3 })}`}
        formatDuration={(ms) => `${Math.round(ms / 1000)} 秒`}
        labels={{
          status: { queued: '排队', running: '在跑', retrying: '重试', done: '成功', failed: '失败' },
          grid: '子任务',
          progress: (finished, total) => `${finished} / ${total}`,
          live: (percent) => `完成 ${percent}%`,
          eta: (text) => (text === null ? '剩余 估算中' : `剩余约 ${text}`),
          cost: (text) => `花费 ${text}`,
          worker: 'worker',
          took: '耗时',
          attempts: '第几次',
          result: '结果',
          error: '错误',
          filter: '按状态看',
          retry: (count) => `重试失败的 ${count} 个`,
          hint: '悬停或聚焦一格看详情；Enter 钉住',
        }}
      />
    </div>
  )
}
