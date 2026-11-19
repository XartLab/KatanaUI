# HypothesisLedger

研究「地缘与国内利益结构 → 货币与信用流向 → 购买力与利润再分配 → 资产定价」这类框架用的面板。每条假说一行、可展开：命题、所属传导层（国家战略 / 信用供给 / 财政分配 / 跨境流动 / 产业承接 / 利润归属 / 资产配置 / 避险）、状态（待验证 / 有支持 / 被否定 / 过期）、提前写好的失败条件与检验期限（到期倒计时，过了期限的待验证项自动标过期）、证据列表（学者观点 / 政策原文 / 数据 / 财报，各带发布时间、来源链接、支持或反对）、关联品种或资产。顶上按层与状态筛选；同一面板可切「观察表」：传导层 × 核心证据 × 最容易混淆的地方。学者观点、已发生的政策与资金变化、我们的假说分开放，不混排。件不改状态，由调用方写回。字段按用户 2026-11-15 给的框架，对设计稿 HypothesisLedger 卡的功能（假设账、证据与反例）重写；样子照 TradingView 告警列表的读法，实现原创。演示数据是虚构的。

## Provide

`*` marks a required prop.

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

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { useState } from 'react'
import {
  HypothesisLedger,
  PanelFrame,
  PanelFrameBody,
  PanelFrameHeader,
  type Hypothesis,
  type HypothesisLedgerLabels,
  type WatchRow,
} from '@katana-ui/react/blocks'
import { Button } from '@katana-ui/react'

const HL_NOW = Date.UTC(2026, 10, 15)

const HL_DAY = 86_400_000

const hlEv = (
  id: string,
  kind: 'scholar' | 'policy' | 'data' | 'filing',
  stance: 'support' | 'oppose',
  source: string,
  daysAgo: number,
  summary: string,
) => ({
  id,
  kind,
  stance,
  source,
  href: `https://example.com/demo/${id}`,
  publishedAt: HL_NOW - daysAgo * HL_DAY,
  summary,
})

const HL_ITEMS: Hypothesis[] = [
  {
    id: 'h1',
    claim: '政策倾斜假说：资源持续向自主可控的先进制造倾斜，相关产业先拿到信贷与财政支持',
    layer: 'strategy',
    status: 'pending',
    failure: '连续两个季度，产业专项的新增信贷与补贴投向不再向该方向倾斜，或相关表述从规划中撤下。',
    deadline: HL_NOW + 45 * HL_DAY,
    evidence: [
      hlEv(
        'e1',
        'policy',
        'support',
        '演示政策文本 · 产业规划摘要',
        30,
        '规划把先进制造列为首要方向，并写明配套资金安排。',
      ),
      hlEv('e2', 'scholar', 'support', '演示研究所 · 产业政策评论', 21, '认为产业政策重心已从总量刺激转向结构倾斜。'),
      hlEv('e3', 'data', 'oppose', '演示数据库 · 信贷投向', 8, '最近一期新增信贷里，该方向占比环比没有上升。'),
    ],
    assets: [{ label: '先进制造主题篮子', tag: '演示' }],
  },
  {
    id: 'h2',
    claim: '海外配置分流假说：居民与机构增加海外配置，分走一部分境内权益的增量资金',
    layer: 'crossborder',
    status: 'pending',
    failure: '跨境资金净流出连续两个月转为净流入，且境内权益的新增份额不降反升。',
    deadline: HL_NOW + 9 * HL_DAY,
    evidence: [
      hlEv('e4', 'data', 'support', '演示数据库 · 跨境资金流向', 5, '跨境渠道的净流出方向连续出现。'),
      hlEv('e5', 'filing', 'support', '演示基金公司 · 季报', 12, '季报披露海外资产的配置比例较上季提高。'),
    ],
    assets: [
      { label: '海外配置基金', tag: '演示' },
      { label: '境内宽基指数', tag: '演示' },
    ],
  },
  {
    id: 'h3',
    claim: '避险假说：不确定性上升期，资金先流向收益权稳定的资产',
    layer: 'haven',
    status: 'supported',
    failure: '不确定性指标上升的月份里，稳定收益资产的资金流入没有高于其他类别。',
    deadline: HL_NOW - 20 * HL_DAY,
    evidence: [
      hlEv('e6', 'data', 'support', '演示数据库 · 资金流向', 40, '三次不确定性上升期，稳定收益类资产都有净流入。'),
      hlEv('e7', 'scholar', 'support', '演示研究所 · 避险资产综述', 35, '综述归纳了类似的历史规律。'),
    ],
    assets: [{ label: '稳定收益资产篮子', tag: '演示' }],
  },
  {
    id: 'h4',
    claim: '信用供给假说：新增信用主要流向财政与融资平台，而不是民营制造业',
    layer: 'credit',
    status: 'refuted',
    failure: '民营制造业的新增贷款占比连续两个季度上升，且高于平台类。',
    deadline: HL_NOW - 10 * HL_DAY,
    evidence: [
      hlEv('e8', 'data', 'oppose', '演示数据库 · 贷款结构', 14, '民营制造业的新增贷款占比已连续上升，失败条件被触发。'),
      hlEv('e9', 'scholar', 'support', '演示研究所 · 信用观察', 90, '早期观点认为信用向平台集中。'),
    ],
  },
  {
    id: 'h5',
    claim: '利润归属假说：上游涨价的利润被中游吃掉，终端环节拿不到',
    layer: 'profit',
    status: 'pending',
    failure: '终端环节的毛利连续两个季度随上游价格同步改善。',
    deadline: HL_NOW - 6 * HL_DAY,
    evidence: [hlEv('e10', 'filing', 'support', '演示公司 · 半年报', 50, '中游毛利改善，终端毛利持平。')],
    assets: [{ label: '中游材料龙头', tag: '演示' }],
  },
  {
    id: 'h6',
    claim: '财政分配假说：专项债与补贴的使用向基建之外的产业升级倾斜',
    layer: 'fiscal',
    status: 'pending',
    failure: '下一轮预算执行报告里，产业升级类支出占比低于基建类。',
    deadline: HL_NOW + 120 * HL_DAY,
    evidence: [],
  },
]

const HL_WATCH: WatchRow[] = [
  {
    layer: 'strategy',
    evidence: '规划与会议原文里的表述变化、配套资金安排',
    confusion: '口号式表述和有预算的安排不是一回事',
  },
  { layer: 'credit', evidence: '新增信贷的投向结构、利率走势', confusion: '总量宽松不等于流向目标产业' },
  { layer: 'fiscal', evidence: '预算执行、专项债与补贴的使用方向', confusion: '计划额度和实际拨付之间有时间差' },
  { layer: 'crossborder', evidence: '跨境资金净流向、海外配置比例', confusion: '汇率变动造成的账面变化不是资金流动' },
  { layer: 'industry', evidence: '订单、产能利用率、资本开支', confusion: '订单预期和已经确认的收入要分开看' },
  { layer: 'profit', evidence: '各环节毛利、价格传导的先后', confusion: '收入增长不等于利润落到该环节' },
  { layer: 'allocation', evidence: '基金份额变化、机构持仓披露', confusion: '被动跟踪的资金流入不代表主动看好' },
  { layer: 'haven', evidence: '不确定性指标上升期的资金去向', confusion: '短期恐慌性抛售和中期配置调整混在一起' },
]

const HL_LABELS: HypothesisLedgerLabels = {
  ledger: '假说账',
  views: '视图',
  viewLedger: '假说',
  viewWatch: '观察表',
  statusFilter: '状态筛选',
  layerFilter: '传导层筛选',
  clearLayers: '清除层筛选',
  all: '全部',
  layer: {
    strategy: '国家战略',
    credit: '信用供给',
    fiscal: '财政分配',
    crossborder: '跨境流动',
    industry: '产业承接',
    profit: '利润归属',
    allocation: '资产配置',
    haven: '避险',
  },
  status: { pending: '待验证', supported: '有支持', refuted: '被否定', expired: '过期' },
  kind: { scholar: '学者观点', policy: '政策原文', data: '数据', filing: '财报' },
  stance: { support: '支持', oppose: '反对' },
  failure: '失败条件',
  evidence: '证据',
  assets: '关联',
  noEvidence: '还没有证据',
  tally: (s, o) => `${s} 支持 · ${o} 反对`,
  deadlineIn: (d) => (d === 0 ? '今天到期' : `还剩 ${d} 天`),
  overdueBy: (d) => `已过期 ${d} 天`,
  date: (t) => new Date(t).toISOString().slice(0, 10),
  empty: '没有符合条件的假说',
  watchLayer: '传导层',
  watchEvidence: '核心证据',
  watchConfusion: '最容易混淆的地方',
}

export function HypothesisLedgerUsage() {
  const [now, setNow] = useState(HL_NOW)
  return (
    <div className="gal-stack" style={{ width: '100%' }}>
      <p className="gal-note">
        演示数据（假说、机构、文章与日期都是虚构的，不含真实数字，时间固定在{' '}
        <span data-testid="hl-now">2026-11-15</span>
        ）。点一行展开失败条件与证据；点「快进 10 天」看倒计时与自动过期。
      </p>
      <Button data-testid="hl-ff" onClick={() => setNow((n) => n + 10 * HL_DAY)}>
        快进 10 天
      </Button>
      <div style={{ height: 560 }} data-testid="hl-frame">
        <PanelFrame aria-label="Hypothesis panel">
          <PanelFrameHeader heading="Hypotheses" object="· 演示数据" />
          <PanelFrameBody>
            <div style={{ height: '100%', padding: 8 }}>
              <HypothesisLedger items={HL_ITEMS} watch={HL_WATCH} now={now} labels={HL_LABELS} />
            </div>
          </PanelFrameBody>
        </PanelFrame>
      </div>
    </div>
  )
}
```

## States

- 待验证：灯亮、有倒计时；14 天内到期的倒计时变琥珀；快到期的排在前。
- 过了检验期限还没结论：自动按「过期」画（调用方不必先改状态），倒计时换成已过期天数。
- 有支持 / 被否定：人下了结论，行上显示期限日期；一行上的「n 支持 · m 反对」是证据对比。
- 筛选：状态与传导层叠加，两边的计数各自不被对方的筛选影响；没有结果出空态。
- 灯的语气（hypothesisSeverity → ledOf，G6）：待验证 accent（点亮的强调色）、支持 ok、证伪 danger、过期 warn；不再在件里手写灯表。

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
