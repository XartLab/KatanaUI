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
} from '../../src/blocks'
import { Button } from '../../src/index'

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
