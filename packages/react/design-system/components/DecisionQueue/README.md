# DecisionQueue

产品底线「Agent 输出只是带来源的建议，人接受后才生效」的界面：每张卡写建议动作、对象、理由摘要、置信与依据、来源链接、生成时间、过期倒计时，按钮 接受 / 拒绝 / 稍后，回调由调用方给。接受用按住确认（HoldToConfirm），单击不触发。队列按 待处理 / 已接受 / 已拒绝 / 已过期 筛选；已处理的收成一行（结果、谁、何时），点开看全文。件不改状态：回调后由调用方把条目状态改了再传回来。卡片照 uiarc（待核对）、一行记录照 TradingView 告警列表的读法，实现原创。演示数据是虚构的。

## Provide

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

## States

- 待处理：灯亮、有倒计时，最后一分钟倒计时变琥珀；快过期的排在前。
- 稍后：仍在待处理页，带「已推后」标记，不再给「稍后」按钮。
- 过了有效期没人处理：按已过期画，不能再接受或拒绝（调用方不必先改状态）。
- 已接受 / 已拒绝 / 已过期：收成一行（灯、结果、动作、对象、谁与何时），点开看理由与来源。

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
