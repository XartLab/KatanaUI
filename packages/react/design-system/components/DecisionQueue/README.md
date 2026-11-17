# DecisionQueue

产品底线「Agent 输出只是带来源的建议，人接受后才生效」的界面：每张卡写建议动作、对象、理由摘要、置信与依据、来源链接、生成时间、过期倒计时，按钮 接受 / 拒绝 / 稍后，回调由调用方给。接受用按住确认（HoldToConfirm），单击不触发。队列按 待处理 / 已接受 / 已拒绝 / 已过期 筛选；已处理的收成一行（结果、谁、何时），点开看全文。件不改状态：回调后由调用方把条目状态改了再传回来。卡片照 uiarc（待核对）、一行记录照 TradingView 告警列表的读法，实现原创。演示数据是虚构的。

## Provide

`*` marks a required prop.

### DecisionQueue

筛选页与展开状态在件内；数据、文字、当前时间都由调用方传，件不认识任何应用或交易所。高度由外层给（列表自己滚）。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `items` | `DecisionItem[]` | — | { id, action, target, targetTag?, rationale, confidence?（0 到 1）, basis?, sources: {label, href}[], createdAt, expiresAt?, status, resolvedBy?, resolvedAt? }。status 是 pending / snoozed / accepted / rejected / expired。 |
| `now` | `number` | — | 当前毫秒时间：倒计时与过期都按它算，调用方每秒更新（件不在渲染里取时间）。 |
| `labels` | `DecisionQueueLabels` | — | 全部文字，包括各筛选页、各状态、按钮、接受的按住提示（acceptHint）、倒计时 expiresIn(秒)、各页空态。包里没有语言。 |
| `onAccept / onReject / onSnooze` | `(item) => void` | — | 三个按钮的回调；接受要按住 holdMs 才回调。 |
| `holdMs` | `number` | — | 按住多久算接受，传给 HoldToConfirm（默认见该件）。 |
| `renderDetail` | `(item) => ReactNode` | — | 卡上「详情」展开的内容，如 ConsensusBlock 的执行前检查；返回空就没有详情按钮。 |
| `renderTarget` | `(item) => ReactNode` | — | 对象名旁的内容，如品种徽标。 |
| `defaultFilter / onFilterChange` | `DecisionFilter / callback` | — | 起始页（默认待处理）与切页通知。 |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { useState } from 'react'
import {
  ConsensusBlock,
  DecisionQueue,
  PanelFrame,
  PanelFrameBody,
  PanelFrameHeader,
  type DecisionItem,
  type DecisionQueueLabels,
} from '@katana-ui/react/blocks'
import { Button } from '@katana-ui/react'

const DQ_NOW = Date.UTC(2026, 10, 15, 9, 30, 0)

const DQ_ITEMS: DecisionItem[] = [
  {
    id: 'd1',
    action: '买入',
    target: '星河锂业',
    targetTag: '600001',
    rationale: '产能爬坡超出指引，回测中同类事件后 20 日超额收益为正；仓位建议不超过组合的 3%。',
    confidence: 0.72,
    basis: '事件回测 2023-2026，样本 38 次，胜率 63%',
    sources: [
      { label: '演示通讯社 · 产能公告', href: 'https://example.com/demo/capacity' },
      { label: '回测报告 #12', href: 'https://example.com/demo/backtest-12' },
    ],
    createdAt: DQ_NOW - 4 * 60_000,
    expiresAt: DQ_NOW + 5 * 60_000,
    status: 'pending',
  },
  {
    id: 'd2',
    action: '停策略',
    target: '动量轮动 A',
    targetTag: '策略',
    rationale: '近 20 日回撤超过限额的 80%，且与大盘的相关性升到 0.9，已失去分散作用。',
    confidence: 0.58,
    basis: '风控监控，滚动 20 日',
    sources: [{ label: '风控面板 · 回撤', href: 'https://example.com/demo/risk' }],
    createdAt: DQ_NOW - 9 * 60_000,
    expiresAt: DQ_NOW + 50_000,
    status: 'pending',
  },
  {
    id: 'd3',
    action: '调参数',
    target: '均值回归 B',
    targetTag: '策略',
    rationale: '入场阈值从 2.0 降到 1.6，样本外夏普由 0.8 升到 1.1；换手率增加约 15%。',
    basis: '参数扫描 6 组，样本外 2025-2026',
    sources: [{ label: '参数扫描结果', href: 'https://example.com/demo/sweep' }],
    createdAt: DQ_NOW - 30 * 60_000,
    status: 'snoozed',
  },
  {
    id: 'd4',
    action: '调仓',
    target: '半导体篮子',
    rationale: '把权重从 12% 降到 8%：行业拥挤度处于近三年高位。',
    confidence: 0.64,
    sources: [{ label: '拥挤度数据', href: 'https://example.com/demo/crowd' }],
    createdAt: DQ_NOW - 2 * 3600_000,
    expiresAt: DQ_NOW + 3600_000,
    status: 'accepted',
    resolvedBy: '演示用户',
    resolvedAt: DQ_NOW - 3600_000,
  },
  {
    id: 'd5',
    action: '买入',
    target: '云岭能源',
    targetTag: '600004',
    rationale: '回购公告后的短期反弹，但成交额不足以承接仓位。',
    confidence: 0.41,
    sources: [{ label: '演示通讯社 · 回购', href: 'https://example.com/demo/buyback' }],
    createdAt: DQ_NOW - 5 * 3600_000,
    status: 'rejected',
    resolvedBy: '演示用户',
    resolvedAt: DQ_NOW - 4 * 3600_000,
  },
  {
    id: 'd6',
    action: '卖出',
    target: '海岚电子',
    targetTag: '000003',
    rationale: '触及止盈线；建议分两笔减仓。',
    sources: [{ label: '持仓监控', href: 'https://example.com/demo/position' }],
    createdAt: DQ_NOW - 8 * 3600_000,
    expiresAt: DQ_NOW - 7 * 3600_000,
    status: 'pending',
  },
]

const DQ_LABELS: DecisionQueueLabels = {
  queue: '建议队列',
  filters: '状态筛选',
  filter: { pending: '待处理', accepted: '已接受', rejected: '已拒绝', expired: '已过期' },
  accept: '接受',
  reject: '拒绝',
  snooze: '稍后',
  acceptHint: '按住 1 秒确认接受',
  accepted: '已接受',
  snoozed: '已推后',
  status: { pending: '待处理', snoozed: '稍后', accepted: '已接受', rejected: '已拒绝', expired: '已过期' },
  confidence: (p) => `置信 ${p}%`,
  basis: '依据',
  sources: '来源',
  details: '执行前检查',
  createdAgo: (s) => `生成于 ${s < 3600 ? `${Math.floor(s / 60)} 分钟` : `${Math.floor(s / 3600)} 小时`}前`,
  expiresIn: (s) => `还剩 ${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`,
  expired: '已过期',
  resolvedBy: (by, ago) => `${by} · ${ago}`,
  ago: (s) => (s < 3600 ? `${Math.floor(s / 60)} 分钟前` : `${Math.floor(s / 3600)} 小时前`),
  absolute: (t) => new Date(t).toISOString().replace('T', ' ').slice(0, 16) + ' UTC',
  empty: {
    pending: '没有待处理的建议',
    accepted: '还没有接受过的建议',
    rejected: '还没有拒绝过的建议',
    expired: '没有过期的建议',
  },
}

export function DecisionQueueUsage() {
  const [items, setItems] = useState(DQ_ITEMS)
  const [now, setNow] = useState(DQ_NOW)
  const [log, setLog] = useState('—')
  const settle = (id: string, status: DecisionItem['status'], what: string) => {
    setLog(`${what} ${id}`)
    setItems((prev) =>
      prev.map((i) =>
        i.id === id
          ? { ...i, status, ...(status === 'snoozed' ? {} : { resolvedBy: '演示用户', resolvedAt: now }) }
          : i,
      ),
    )
  }
  return (
    <div className="gal-stack" style={{ width: '100%' }}>
      <p className="gal-note">
        演示数据（品种、策略、来源都是虚构的，时间固定）。接受要按住 1 秒；点「快进 2
        分钟」看倒计时与过期；最近一次回调：
        <span data-testid="dq-log">{log}</span>
      </p>
      <Button data-testid="dq-ff" onClick={() => setNow((n) => n + 120_000)}>
        快进 2 分钟
      </Button>
      <div style={{ height: 520 }} data-testid="dq-frame">
        <PanelFrame aria-label="Decision panel">
          <PanelFrameHeader heading="Decisions" object="· 演示数据" />
          <PanelFrameBody>
            <div style={{ height: '100%', padding: 8 }}>
              <DecisionQueue
                items={items}
                now={now}
                labels={DQ_LABELS}
                holdMs={1000}
                onAccept={(i) => settle(i.id, 'accepted', '接受')}
                onReject={(i) => settle(i.id, 'rejected', '拒绝')}
                onSnooze={(i) => settle(i.id, 'snoozed', '稍后')}
                renderDetail={(i) =>
                  i.id === 'd1' ? (
                    <ConsensusBlock
                      label="执行前检查"
                      subject="买入 · 600001 × 2,000"
                      parties={[
                        { id: 'gw', label: 'GATEWAY', state: 'pass', message: '整手 ✓' },
                        { id: 'risk', label: 'RISK', state: 'warn', message: '集中度 58 / 60' },
                      ]}
                      verdict="warn"
                      verdictText="可提交"
                    />
                  ) : null
                }
              />
            </div>
          </PanelFrameBody>
        </PanelFrame>
      </div>
    </div>
  )
}

// 系统监控的演示数据是虚构的（连接、账户、策略名都不是真实的），时间固定在 MON_NOW。里面有一个出错连接与一个出错策略。
```

## States

- 待处理：灯亮、有倒计时，最后一分钟倒计时变琥珀；快过期的排在前。
- 稍后：仍在待处理页，带「已推后」标记，不再给「稍后」按钮。
- 过了有效期没人处理：按已过期画，不能再接受或拒绝（调用方不必先改状态）。
- 已接受 / 已拒绝 / 已过期：收成一行（灯、结果、动作、对象、谁与何时），点开看理由与来源。
- 灯的语气（decisionSeverity → ledOf，G6）：待处理 accent、稍后 warn、接受 ok、拒绝 danger、过期 off。

## Don't

- 不要把接受做成单击：它是不可撤的，必须按住。
- 不要在件里取当前时间：传 now。
- 不要让件自己改状态：回调后由调用方写回，来源才对得上账。

## Composition

```
DecisionQueue
  筛选 ToggleGroup（带计数）
  ol
    li 待处理：灯、生成时间、倒计时、动作与对象、理由、置信条与依据、来源链接、详情（ConsensusBlock）、HoldToConfirm 接受、拒绝、稍后
    li 已处理：一行按钮（灯、结果、动作、对象、谁与何时），展开后理由与来源
```

## Keyboard

- `Tab`：在筛选、卡上的来源、详情、按钮、已处理行间移动
- `Space / Enter（按住）`：在「接受」上按住到填满才确认；松手退回
- `Enter / Space`：触发拒绝、稍后、详情与已处理行的展开
