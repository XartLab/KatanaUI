// SPDX-License-Identifier: MIT
import { TraceWaterfall, type TraceSpan } from '../../src/blocks'

// 示例数据：一次「000001.SZ 日 K」取数的链路，时间是手写的演示值（毫秒，从请求开始算）。腾讯第一次超时，重试成功；东财没用上。
const TRACE: TraceSpan = {
  id: 'req',
  name: '000001.SZ 日 K',
  kind: 'request',
  start: 0,
  end: 742,
  detail: 'kline?code=000001.SZ&period=1d&count=240',
  metric: '240 根',
  children: [
    { id: 'cache', name: '本地缓存', kind: 'cache', start: 0, end: 9, metric: '未命中' },
    {
      id: 'tencent',
      name: '腾讯 qt',
      kind: 'fetch',
      start: 9,
      end: 612,
      detail: 'web.ifzq.gtimg.cn',
      children: [
        {
          id: 'tx-1',
          name: '第 1 次',
          kind: 'fetch',
          status: 'failed',
          start: 9,
          end: 309,
          metric: '超时',
          error: '300 ms 内没有响应，按回落策略重试一次',
        },
        { id: 'tx-wait', name: '退避', kind: 'wait', start: 309, end: 359 },
        { id: 'tx-2', name: '第 2 次', kind: 'retry', start: 359, end: 612, metric: '200 · 38 KB' },
      ],
    },
    { id: 'parse', name: '解析与复权', kind: 'parse', start: 612, end: 701, metric: '240 行' },
    { id: 'write', name: '写缓存', kind: 'cache', start: 701, end: 742 },
  ],
}

export function TraceWaterfallUsage() {
  return (
    <div className="gal-wide" style={{ maxWidth: 920 }} data-gallery-trace="main">
      <TraceWaterfall
        root={TRACE}
        title="取数链路（示例）"
        label="示例：链路瀑布"
        formatMs={(ms) => `${Math.round(ms)} ms`}
        labels={{
          status: { running: '运行中', done: '完成', failed: '失败' },
          slowest: '最慢',
          kind: (kind) =>
            ({ request: '请求', cache: '缓存', fetch: '抓取', retry: '重试', wait: '等待', parse: '解析' })[kind] ??
            kind,
          name: '步骤',
          duration: '耗时',
          metric: '结果',
          start: '开始',
          detail: '说明',
          error: '错误',
          details: '这一步的详情',
        }}
      />
    </div>
  )
}
