# HypothesisLedger

研究「地缘与国内利益结构 → 货币与信用流向 → 购买力与利润再分配 → 资产定价」这类框架用的面板。每条假说一行、可展开：命题、所属传导层（国家战略 / 信用供给 / 财政分配 / 跨境流动 / 产业承接 / 利润归属 / 资产配置 / 避险）、状态（待验证 / 有支持 / 被否定 / 过期）、提前写好的失败条件与检验期限（到期倒计时，过了期限的待验证项自动标过期）、证据列表（学者观点 / 政策原文 / 数据 / 财报，各带发布时间、来源链接、支持或反对）、关联品种或资产。顶上按层与状态筛选；同一面板可切「观察表」：传导层 × 核心证据 × 最容易混淆的地方。学者观点、已发生的政策与资金变化、我们的假说分开放，不混排。件不改状态，由调用方写回。字段按用户 2026-11-15 给的框架，对设计稿 HypothesisLedger 卡的功能（假设账、证据与反例）重写；样子照 TradingView 告警列表的读法，实现原创。演示数据是虚构的。

## Provide

### HypothesisLedger

筛选、视图与展开状态在件内；数据、文字、当前时间都由调用方传，件不认识任何应用或交易所。高度由外层给（列表自己滚）。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `items` | `Hypothesis[]` | — | { id, claim, layer, status, failure, deadline, evidence[], assets? }。evidence 每条 { id, kind: scholar / policy / data / filing, source, href, publishedAt, summary, stance: support / oppose }。status 是 pending / supported / refuted / expired。 |
| `watch` | `WatchRow[]` | — | 观察表的行 { layer, evidence, confusion }；不给就没有「观察表」视图。 |
| `now` | `number` | — | 当前毫秒时间：倒计时与过期都按它算，调用方更新它（件不在渲染里取时间）。 |
| `labels` | `HypothesisLedgerLabels` | — | 全部文字，包括八层、四个状态、四类证据、支持 / 反对、倒计时 deadlineIn(天)、过期 overdueBy(天)、日期 date(毫秒) 与观察表三列。包里没有语言。 |
| `renderAsset` | `(asset) => ReactNode` | — | 关联资产旁的内容，如品种徽标。 |
| `defaultView` | `'ledger' \| 'watch'` | `ledger` | 起始视图。 |

## States

- 待验证：灯亮、有倒计时；14 天内到期的倒计时变琥珀；快到期的排在前。
- 过了检验期限还没结论：自动按「过期」画（调用方不必先改状态），倒计时换成已过期天数。
- 有支持 / 被否定：人下了结论，行上显示期限日期；一行上的「n 支持 · m 反对」是证据对比。
- 筛选：状态与传导层叠加，两边的计数各自不被对方的筛选影响；没有结果出空态。

## Don't

- 不要把学者观点当成已发生的事实：证据按类型打标，假说自己永远是命题。
- 不要在件里取当前时间：传 now。
- 不要让件自己改状态：判定是人的动作，由调用方写回。

## Composition

```
HypothesisLedger
  视图 ToggleGroup（假说 / 观察表）、状态 ToggleGroup（带计数）
  传导层 ChipGroup
  ol
    li × 假说：一行按钮（灯、状态、传导层、命题、证据对比、倒计时），展开后失败条件、证据列表（类型、支持或反对、时间、来源链接、摘要）、关联资产
  观察表：table（传导层、核心证据、最容易混淆的地方）
```

## Keyboard

- `Tab`：在视图、状态、传导层芯片、每行、证据来源链接间移动
- `Enter / Space`：展开或收起一行；切换视图与筛选
- `← / →`：在状态分段与传导层芯片间移动
