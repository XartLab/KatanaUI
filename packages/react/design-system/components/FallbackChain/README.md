# FallbackChain

一次取数按顺序试一串数据源（腾讯三个入口 → 新浪 → 东财 …）：请求节点在上，每个源一行（第几级、状态灯、源名与入口、状态字与原因、耗时），响应节点在下。失败的行写原因、竖线变 danger 虚线；正在试的灯亮强调色；答上的那一级之前的竖线点亮到响应；没用上的写「不需要」并变淡。全部失败时响应写「全部失败」，有 onRetry 就出「重试」。竖排有序列表，不画分叉图，不写花费。功能参照 affectUI 的 Fallback Chain（affectui.com/components/fallback-chain，2026-11-23 读；Pro 件，页上没写许可证：只读说明、实现原创，不装它的 registry）。演示数据是示例。

## Provide

`*` marks a required prop.

### FallbackChain

源按回落顺序给；状态由调用方随请求推进改写。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `attempts` * | `readonly FallbackAttempt[]` | — | Sources in try order. |
| `title` * | `ReactNode` | — | Heading. |
| `request` * | `ReactNode` | — | The request node: what is being fetched, such as a symbol and period. |
| `route` | `ReactNode` | — | Route or policy name next to the request. |
| `formatMs` * | `(ms: number) => string` | — | How milliseconds are written. |
| `onRetry` | `() => void` | — | Called by the retry button after every source failed; omit to show no button. |
| `labels` * | `FallbackChainLabels` | — | Texts. |
| `className` | `string` | — | Extra class name on the root. |

### answeredLevel

纯函数：第几级答上（从 1 数）。

### chainOutcome

纯函数：答上的源、失败数、试了几级、是否用完、耗时。

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { FallbackChain, type FallbackAttempt } from '@katana-ui/react/blocks'

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
```

## States

- 等待：灯熄灭、字变淡。
- 在试：灯亮强调色，字 warn 色；头里的摘要是 status 区，读屏会播。
- 失败：灯与字 danger，竖线虚线，后面跟原因。
- 答上：灯与字 ok，响应节点 ok 色边框。
- 不需要：变淡。
- 全部失败：响应节点 danger 色边框；有 onRetry 出「重试」。

## Don't

- 不要拿它看耗时细节：用 TraceWaterfall。
- 不要只靠灯色：状态与原因都写成字。

## Composition

```
FallbackChain
  头（标题 · 摘要 status）
  请求节点（请求 · 路由）
  ol（每级一行：级号 · Led · 源名与入口 · 状态与原因 · 耗时）
  响应节点（结果 · Button）
```

## Keyboard

- `Tab`：全部失败时聚焦「重试」
