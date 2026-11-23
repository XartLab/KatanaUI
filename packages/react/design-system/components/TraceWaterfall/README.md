# TraceWaterfall

一次数据请求的链路：哪个源慢、哪次重试、解析花了多久。左边是可折叠的 span 树，中间是时间轴上的条（按种类取 series 色，失败 danger，运行中斜纹并长到 now），右边是耗时与调用方写的一个小数（行数、字节、HTTP 状态）；跑完的叶子里最慢的标「最慢」。Enter 打开这一步的详情（种类、状态、开始、耗时、说明、错误），是表下的内嵌区，不弹对话框。不写 token 与花费。功能参照 affectUI 的 Trace Waterfall（affectui.com/components/trace-waterfall，2026-11-23 读；Pro 件，页上没写许可证：只读说明、实现原创，不装它的 registry）。演示数据是示例。

## Provide

`*` marks a required prop.

### TraceWaterfall

时间都是从请求开始算的毫秒；折叠（collapsed）与详情（openId）都可受控。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `root` * | `TraceSpan` | — | The request as a span tree. |
| `title` * | `ReactNode` | — | Heading. |
| `label` * | `string` | — | Accessible name of the tree. |
| `now` | `number` | — | Clock in milliseconds from the start of the request; running spans grow to it. |
| `minRange` | `number` | — | Smallest axis range in milliseconds; defaults to the extent of the trace. |
| `formatMs` * | `(ms: number) => string` | — | How milliseconds are written (durations and axis ticks). |
| `markSlowest` | `boolean` | `true` | Mark the slowest finished leaf. |
| `collapsed` | `readonly string[]` | — | Controlled folded span ids. |
| `defaultCollapsed` | `readonly string[]` | `[]` | Folded span ids when uncontrolled. |
| `onCollapsedChange` | `(collapsed: readonly string[]) => void` | — | Called with the folded span ids after a fold or unfold. |
| `openId` | `string \| null` | — | Controlled span id whose details are open; null when closed. |
| `defaultOpenId` | `string \| null` | `null` | Span id open first when uncontrolled. |
| `onOpenChange` | `(id: string \| null) => void` | — | Called when the open span changes. |
| `labels` * | `TraceWaterfallLabels` | — | Texts. |
| `className` | `string` | — | Extra class name on the root. |

### moveSpan

纯函数：树的键盘移动，带展开收起。

### slowestSpan

纯函数：跑完的叶子里耗时最长的。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `id` * | `string` | — | Stable key. |
| `name` * | `string` | — | Step name. |
| `kind` * | `string` | — | Kind of step, such as fetch, retry, parse or cache; picks the bar tint. |
| `status` | `SpanStatus` | — | Running, done or failed; defaults to done. |
| `start` * | `number` | — | Start in milliseconds from the start of the request. |
| `end` | `number` | — | End in milliseconds from the start of the request; omit while running. |
| `detail` | `string` | — | Muted text after the name (the URL, the symbol). |
| `metric` | `string` | — | One short figure written by the caller, such as rows, bytes or the HTTP status. |
| `error` | `string` | — | Error text of a failed span. |
| `children` | `readonly TraceSpan[]` | — | Child steps. |

### spanEnd

纯函数：span 的结束，运行中长到 now。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `id` * | `string` | — | Stable key. |
| `name` * | `string` | — | Step name. |
| `kind` * | `string` | — | Kind of step, such as fetch, retry, parse or cache; picks the bar tint. |
| `status` | `SpanStatus` | — | Running, done or failed; defaults to done. |
| `start` * | `number` | — | Start in milliseconds from the start of the request. |
| `end` | `number` | — | End in milliseconds from the start of the request; omit while running. |
| `detail` | `string` | — | Muted text after the name (the URL, the symbol). |
| `metric` | `string` | — | One short figure written by the caller, such as rows, bytes or the HTTP status. |
| `error` | `string` | — | Error text of a failed span. |
| `children` | `readonly TraceSpan[]` | — | Child steps. |

### traceAxis

纯函数：时间轴范围与整齐刻度。

### traceExtent

纯函数：整棵树最晚的结束。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `id` * | `string` | — | Stable key. |
| `name` * | `string` | — | Step name. |
| `kind` * | `string` | — | Kind of step, such as fetch, retry, parse or cache; picks the bar tint. |
| `status` | `SpanStatus` | — | Running, done or failed; defaults to done. |
| `start` * | `number` | — | Start in milliseconds from the start of the request. |
| `end` | `number` | — | End in milliseconds from the start of the request; omit while running. |
| `detail` | `string` | — | Muted text after the name (the URL, the symbol). |
| `metric` | `string` | — | One short figure written by the caller, such as rows, bytes or the HTTP status. |
| `error` | `string` | — | Error text of a failed span. |
| `children` | `readonly TraceSpan[]` | — | Child steps. |

### traceStatus

纯函数：整次请求的状态。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `id` * | `string` | — | Stable key. |
| `name` * | `string` | — | Step name. |
| `kind` * | `string` | — | Kind of step, such as fetch, retry, parse or cache; picks the bar tint. |
| `status` | `SpanStatus` | — | Running, done or failed; defaults to done. |
| `start` * | `number` | — | Start in milliseconds from the start of the request. |
| `end` | `number` | — | End in milliseconds from the start of the request; omit while running. |
| `detail` | `string` | — | Muted text after the name (the URL, the symbol). |
| `metric` | `string` | — | One short figure written by the caller, such as rows, bytes or the HTTP status. |
| `error` | `string` | — | Error text of a failed span. |
| `children` | `readonly TraceSpan[]` | — | Child steps. |

### visibleSpans

纯函数：按折叠展开成可见行。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `id` * | `string` | — | Stable key. |
| `name` * | `string` | — | Step name. |
| `kind` * | `string` | — | Kind of step, such as fetch, retry, parse or cache; picks the bar tint. |
| `status` | `SpanStatus` | — | Running, done or failed; defaults to done. |
| `start` * | `number` | — | Start in milliseconds from the start of the request. |
| `end` | `number` | — | End in milliseconds from the start of the request; omit while running. |
| `detail` | `string` | — | Muted text after the name (the URL, the symbol). |
| `metric` | `string` | — | One short figure written by the caller, such as rows, bytes or the HTTP status. |
| `error` | `string` | — | Error text of a failed span. |
| `children` | `readonly TraceSpan[]` | — | Child steps. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { TraceWaterfall, type TraceSpan } from '@katana-ui/react/blocks'

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
```

## States

- 完成：条是种类色；头里写「完成 · 总耗时」（ok 色）。
- 运行中：条带斜纹并长到 now，每行一道 now 竖线；头里 warn 色。
- 失败：条与结果是 danger 色；根失败时头里 danger 色。
- 最慢：名字后 warn 色小标，条加一圈 warn 描边。
- 折叠：箭头朝右，子行不渲染。

## Don't

- 不要拿它看几个任务一天里的排程：用 RateLimitPlanner。
- 不要把父 span 当成最慢：它的耗时含子。

## Composition

```
TraceWaterfall
  头（标题 · 请求名 · 状态与总耗时）
  列头（步骤 · 时间轴刻度 · 耗时 · 结果）
  tree（每行 treeitem：折叠箭头 · 名字 · 说明 · 最慢 · 条 · 耗时 · 结果）
  region（详情 dl）
```

## Keyboard

- `Tab`：进树（一个停点）
- `↑ ↓`：上一行 / 下一行
- `→`：收着的先展开，展开的到第一个子
- `←`：展开的先收起，否则回父
- `Home / End`：第一行 / 最后一行
- `Enter / Space`：打开或收起详情
- `Esc`：收起详情
