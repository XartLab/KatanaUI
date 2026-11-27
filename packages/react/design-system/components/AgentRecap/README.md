# AgentRecap

隔夜或离开几小时回来，后台 Agent 做了什么：上面一条离开期间的分布（每段几件、每件一个点；装饰，对读屏隐藏，卡里都有），下面三列：要你拍板、失败、做完，列头写总数（含超出 limit 的）。每张卡写状态字、时间、标题、小注、数量与动作：要你的有查看与主动作（批准），失败的有查看与重试，做完的有查看与撤销。动作可以返回 Promise：等的时候写「处理中」，失败退回原状；做完换成状态字加撤销，撤销后可重做。悬停或聚焦一张卡，分布上它的点变亮。卡等高。主动作只把人的决定回调出去，件不替人做。功能参照 affectUI 的 Agent Recap（affectui.com/components/agent-recap，2026-11-23 读；Pro 件，页上没写许可证：只读说明、实现原创，不装它的 registry）；不做开场回放动画。演示数据是示例。

## Provide

`*` marks a required prop.

### AgentRecap

since 与 until 由调用方给（不在渲染里取时间）；onAction / onUndo / onRedo 可返回 Promise。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `events` * | `readonly RecapEvent[]` | — | Everything that happened, in any order. |
| `since` * | `number` | — | When the person left, in milliseconds. |
| `until` * | `number` | — | End of the strip (usually now), in milliseconds. |
| `onAction` | `(event: RecapEvent, action: RecapAction) => unknown` | — | Runs the main action or Review; may return a promise. |
| `onUndo` | `(event: RecapEvent) => unknown` | — | Shows Undo on acted-on and done cards; may return a promise. |
| `onRedo` | `(event: RecapEvent) => unknown` | — | Shows Redo after an undo; may return a promise. |
| `limit` | `number` | `3` | Most cards per lane. |
| `title` * | `ReactNode` | — | Heading. |
| `formatTime` * | `(time: number) => string` | — | How a time is written on a card. |
| `labels` * | `AgentRecapLabels` | — | Texts. |
| `className` | `string` | — | Extra class name on the root. |

### recapLanes

纯函数：按类分开，每类新的在前。

### recapCounts

纯函数：各类的个数。

### recapBuckets

纯函数：since 到 until 等分，每段几件。

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { AgentRecap, type RecapEvent } from '@katana-ui/react'

// 示例数据：昨夜 23:00 到今早 07:00 后台 Agent 做的事（时间是 UTC 毫秒，按上海时区写钟点），条目是手写的演示值。
const SINCE = Date.UTC(2026, 10, 22, 15, 0)
const at = (hours: number) => SINCE + hours * 3_600_000
const EVENTS: readonly RecapEvent[] = [
  { id: 'e1', time: at(0.5), kind: 'done', title: '日 K 回补完成', detail: '沪深两市', count: '5,102 只' },
  { id: 'e2', time: at(1.6), kind: 'failed', title: '新闻源抓取失败', detail: '新浪滚动 · 限流 456' },
  { id: 'e3', time: at(2.4), kind: 'done', title: '因子重算完成', detail: '动量、反转、换手', count: '3 组' },
  { id: 'e4', time: at(3.1), kind: 'needs', title: '调仓建议待批', detail: '组合 A · 减仓 2 只', count: '2 笔' },
  { id: 'e5', time: at(4.8), kind: 'needs', title: '数据缺口要确认', detail: '600519 缺 3 天日 K', action: '去看' },
  { id: 'e6', time: at(6.2), kind: 'done', title: '周报草稿写好', detail: '第 47 周' },
  { id: 'e7', time: at(7.5), kind: 'done', title: '盘前快照就绪' },
]
const clock = new Intl.DateTimeFormat('zh-CN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Shanghai' })

export function AgentRecapUsage() {
  return (
    <div className="gal-wide" style={{ maxWidth: 900 }} data-gallery-rc="main">
      <AgentRecap
        title="你不在时（示例）"
        events={EVENTS}
        since={SINCE}
        until={at(8)}
        limit={2}
        onAction={() => new Promise((resolve) => setTimeout(resolve, 600))}
        onUndo={() => {}}
        onRedo={() => {}}
        formatTime={(time) => clock.format(time)}
        labels={{
          lanes: { needs: '要你拍板', failed: '失败', done: '做完' },
          empty: { needs: '没有要你的', failed: '没有失败', done: '还没有做完的' },
          tag: { needs: '要你', failed: '失败', done: '完成' },
          action: { needs: '批准', failed: '重试' },
          review: '查看',
          undo: '撤销',
          redo: '重做',
          working: '处理中',
          acted: '已处理',
          undone: '已撤销',
          more: (count) => `还有 ${count} 件`,
          named: (verb, title) => `${verb}：${title}`,
          announce: (verb, title) => `${title}：已${verb}`,
        }}
      />
    </div>
  )
}
```

## States

- 要你：状态字 warn 色，主动作是 primary 按钮。
- 失败：状态字 danger 色，主动作是重试。
- 做完：状态字 ok 色，有撤销（给了 onUndo）。
- 处理中：按钮写 working，aria-busy，仍可聚焦。
- 已处理 / 已撤销：状态字换成 doneLabel（或 acted）/ undone，按钮换成撤销 / 重做。
- 某列没有：写 empty。

## Don't

- 不要拿它盯正在跑的：用 RunningNow 或 AgentLanes。
- 不要拿它当完整的变更记录：它只摘离开期间的几件。
- 不要在聊天里放三列：对话里用 AwaySummary。

## Composition

```
AgentRecap（section，标题命名）
  分布 svg（每段柱 · 每件一个点）· 起止钟点
  三列 section（列头与总数 · ul 卡：状态字 · time · 标题 · 小注与数量 · Button × 2）
  播报
```

## Keyboard

- `Tab`：一张一张走卡里的按钮：先查看，再主动作或撤销 / 重做
- `Enter / Space`：执行；做完焦点移到撤销，撤销后回到动作
