// SPDX-License-Identifier: MIT
import { AwaySummary, type RecapEvent } from '../../src/index'

// 示例数据：离开 2 小时 14 分钟期间 Agent 做的事（时间是毫秒，从离开那一刻算），条目是手写的演示值。
const MIN = 60_000
const ITEMS: readonly RecapEvent[] = [
  { id: 'a1', time: 20 * MIN, kind: 'done', title: '回测跑完', detail: '均线 20/60 · 3 年' },
  { id: 'a2', time: 55 * MIN, kind: 'needs', title: '是否把止损上移到 1820', detail: '贵州茅台 · 来自风控 Agent' },
  { id: 'a3', time: 70 * MIN, kind: 'failed', title: '资金流抓取失败', detail: '东财 · 超时' },
  { id: 'a4', time: 90 * MIN, kind: 'done', title: '盘后复盘写好' },
  { id: 'a5', time: 100 * MIN, kind: 'done', title: '自选股新闻摘要', action: null },
  { id: 'a6', time: 120 * MIN, kind: 'needs', title: '新加一个数据源？', detail: '自定义 CSV · 3 列' },
]

const minutes = (ms: number) => {
  const total = Math.round(ms / MIN)
  return total >= 60 ? `${Math.floor(total / 60)} 小时 ${total % 60} 分` : `${total} 分`
}

export function AwaySummaryUsage() {
  return (
    <div className="gal-wide" style={{ maxWidth: 560 }} data-gallery-away="main">
      <AwaySummary
        since={0}
        now={134 * MIN}
        items={ITEMS}
        limit={4}
        onAction={() => new Promise((resolve) => setTimeout(resolve, 600))}
        labels={{
          heading: (since, now) => `你离开了 ${minutes(now - since)}`,
          counts: (c) => `${c.needs} 件要你 · ${c.failed} 件失败 · ${c.done} 件做完`,
          mark: { needs: '要你', failed: '失败', done: '做完' },
          action: { needs: '决定', failed: '重试', done: '打开' },
          working: '处理中',
          named: (verb, title) => `${verb}：${title}`,
          more: (count) => `再看 ${count} 件`,
          less: '收起',
          gotIt: '知道了',
          divider: (since, now) => `离开 ${minutes(now - since)} 期间的 6 件事 · 点开再看`,
        }}
      />
    </div>
  )
}
