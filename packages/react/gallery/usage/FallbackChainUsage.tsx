// SPDX-License-Identifier: MIT
import { FallbackChain, type FallbackAttempt } from '../../src/blocks'

// 示例数据：A 股日 K 的回落顺序（腾讯三个入口 → 新浪 → 东财），失败原因与耗时是手写的演示值。
const ATTEMPTS: readonly FallbackAttempt[] = [
  { id: 'qt', name: '腾讯', provider: 'qt 入口', status: 'failed', took: 300, reason: '超时' },
  { id: 'ifzq', name: '腾讯', provider: 'ifzq 入口', status: 'failed', took: 42, reason: '入口冷却中' },
  { id: 'sina', name: '新浪', provider: 'hq.sinajs', status: 'answered', took: 188 },
  { id: 'em', name: '东财', provider: 'push2his', status: 'skipped' },
]

export function FallbackChainUsage() {
  return (
    <div className="gal-wide" style={{ maxWidth: 640 }} data-gallery-fallback="main">
      <FallbackChain
        title="回落链（示例）"
        request="000001.SZ 日 K · 240 根"
        route="A 股日 K 回落"
        attempts={ATTEMPTS}
        formatMs={(ms) => `${ms} ms`}
        labels={{
          status: { waiting: '等待', trying: '在试', failed: '失败', answered: '答上', skipped: '不需要' },
          sources: '数据源，按回落顺序',
          pending: '等待响应',
          answered: (attempt, level) => `第 ${level} 级 ${attempt.name} 答上`,
          exhausted: '全部失败',
          summary: (o) => `试了 ${o.tried} 级 · ${o.failed} 失败 · ${o.elapsed} ms`,
          retry: '重试',
        }}
      />
    </div>
  )
}
