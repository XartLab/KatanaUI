# AwaySummary

回到对话或面板时的一张小卡：头一行写离开了多久（或从几点起，由调用方的 heading 写）与各类计数；下面一行一件：状态字（要你 / 失败 / 做完）、标题、小注、一个动作（默认决定 / 重试 / 打开，可改字，action 给 null 不要）。要你的排最前、失败其次、做完最后；超过 limit 的收进「再看 n 件」。「知道了」或 Esc 把卡折成一行分隔条，点分隔条再展开、焦点回到上次用的动作。动作可以返回 Promise，等的时候写「处理中」。行等高。件不走钟：now 由调用方给。功能参照 affectUI 的 Away Summary（affectui.com/components/away-summary，2026-11-23 读；Pro 件，页上没写许可证：只读说明、实现原创，不装它的 registry）。演示数据是示例。

## Provide

`*` marks a required prop.

### AwaySummary

折叠受控或不受控（collapsed / defaultCollapsed）；onDismiss 让调用方记下「看过了」。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `since` * | `number` | — | When the person left, in milliseconds. |
| `now` * | `number` | — | Current time, in milliseconds; the component does not tick on its own. |
| `items` * | `readonly RecapEvent[]` | — | What happened, in any order. |
| `onAction` | `(item: RecapEvent) => unknown` | — | Runs a row's action; may return a promise. |
| `onDismiss` | `() => void` | — | Called by Got it, so the caller can record that the card was seen. |
| `collapsed` | `boolean` | — | Controlled folded state. |
| `defaultCollapsed` | `boolean` | `false` | Folded state when uncontrolled. |
| `onCollapsedChange` | `(collapsed: boolean) => void` | — | Called when the card folds or opens. |
| `limit` | `number` | `5` | Rows shown before Show more. |
| `labels` * | `AwaySummaryLabels` | — | Texts. |
| `className` | `string` | — | Extra class name on the root. |

### recapOrder

纯函数：要你的在前、失败其次、做完最后，同类新的在前。

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { AwaySummary, type RecapEvent } from '@katana-ui/react'

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
```

## States

- 展开：标题、计数、清单与底栏。
- 折起：只剩一行分隔条（aria-expanded 为假），折起的内容不在焦点里。
- 处理中：这一行的按钮写 working，仍可聚焦。
- 超出 limit：底栏有「再看 n 件」，展开后焦点到第一个新行的动作。
- 窄于 420px：计数换到标题下，长标题截断（title 里有全文）。

## Don't

- 不要拿它放整夜的回顾与分布图：用 AgentRecap。
- 不要拿它批一个高风险动作：用 AiApproval 或 DecisionQueue（按住确认）。

## Composition

```
AwaySummary（section，标题命名）
  头（标题 · 计数）
  ul（每行：状态字 · 标题与小注 · Button）
  底栏（再看 n 件 · 知道了）
  折起时：button 分隔条
```

## Keyboard

- `Tab`：按清单次序走每行的动作，再到「再看」「知道了」
- `Enter / Space`：执行；「知道了」折起并把焦点放到分隔条
- `Esc`：折起，焦点到分隔条；点分隔条展开、焦点回到上次用的动作
