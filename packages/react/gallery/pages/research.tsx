// SPDX-License-Identifier: MIT
import {
  TransmissionChain,
  type ChainEdge,
  type ChainNode,
  type TransmissionChainLabels,
} from '../../src/blocks/index.ts'

// 传导链图的演示。节点与边是「地缘与国内利益结构 → 货币与信用流向 → 购买力与利润再分配 → 资产定价」这条研究框架；
// 状态与证据条数都是演示数据（不是研究结论，也不是真实证据），页上与证据行都写明；应用里接真实研究数据另开票。

const NODES: readonly ChainNode[] = [
  { id: 'geo', label: '地缘格局与国家目标', note: '谁在约束谁、国家要优先保住什么。' },
  { id: 'rules', label: '货币财政金融规则', note: '谁有权创造资金、按什么规则创造。' },
  { id: 'credit', label: '信用与购买力分配', note: '新增资金先到谁手里。' },
  { id: 'spend', label: '偿债消费投资', note: '先得到购买力的人拿它去做什么。' },
  { id: 'alloc', label: '境内外资产配置', note: '资金留在境内还是流向境外。' },
  { id: 'profit', label: '订单成本利润归属', note: '谁拿到收入，谁承担成本，利润落在哪。' },
  { id: 'price', label: '资产价格', note: '哪类资产拥有收益权，价格已经反映了多少。' },
]

const SRC = '演示数据'
const EDGES: readonly ChainEdge[] = [
  {
    id: 'e1',
    from: 'geo',
    to: 'rules',
    status: 'supported',
    label: '目标约束规则',
    failureCondition: '目标变化后三个季度内规则没有跟着变。',
    evidence: [
      {
        id: 'e1a',
        stance: 'support',
        kind: 'fact',
        text: '某项金融规则调整出现在目标表述变化之后一个季度内。',
        source: SRC,
      },
      { id: 'e1b', stance: 'support', kind: 'view', text: '某学者认为规则是目标的函数，不是独立变量。', source: SRC },
      { id: 'e1c', stance: 'neutral', kind: 'hypothesis', text: '我们的假说：规则调整滞后一到两个季度。', source: SRC },
    ],
  },
  {
    id: 'e2',
    from: 'rules',
    to: 'credit',
    status: 'supported',
    label: '规则定分配',
    failureCondition: '规则放松期，信用增量没有先流向规则偏向的部门。',
    evidence: [
      {
        id: 'e2a',
        stance: 'support',
        kind: 'fact',
        text: '规则放松后的两个季度，偏向部门的新增贷款占比上升。',
        source: SRC,
      },
      { id: 'e2b', stance: 'support', kind: 'fact', text: '同期另一部门的新增贷款占比下降。', source: SRC },
    ],
  },
  {
    id: 'e3',
    from: 'credit',
    to: 'spend',
    status: 'partial',
    label: '先到先用',
    failureCondition: '先得到信用的部门把它全部用于偿债，消费与投资没有增量。',
    evidence: [
      {
        id: 'e3a',
        stance: 'support',
        kind: 'fact',
        text: '偿债支出上升的同时，该部门的固定资产投资也上升。',
        source: SRC,
      },
      { id: 'e3b', stance: 'against', kind: 'fact', text: '消费数据在同一时期没有跟随。', source: SRC },
      { id: 'e3c', stance: 'against', kind: 'view', text: '某学者认为这一段会被偿债吃掉。', source: SRC },
    ],
  },
  {
    id: 'e4',
    from: 'credit',
    to: 'alloc',
    status: 'untested',
    label: '资金外流',
    failureCondition: '新增信用之后，跨境资金流向没有可观察的变化。',
  },
  {
    id: 'e5',
    from: 'spend',
    to: 'profit',
    status: 'supported',
    label: '需求变订单',
    failureCondition: '投资与消费上升后，上游订单没有同向变化。',
    evidence: [
      { id: 'e5a', stance: 'support', kind: 'fact', text: '相关行业新增订单与投资增速同向。', source: SRC },
      { id: 'e5b', stance: 'support', kind: 'fact', text: '行业开工率同向。', source: SRC },
      { id: 'e5c', stance: 'against', kind: 'view', text: '有观点认为订单被前置透支。', source: SRC },
    ],
  },
  {
    id: 'e6',
    from: 'alloc',
    to: 'price',
    status: 'contradicted',
    label: '外流压价',
    failureCondition: '资金外流加快的时期，境内资产价格没有承压。',
    evidence: [
      { id: 'e6a', stance: 'against', kind: 'fact', text: '外流加快的季度，境内相关资产价格上涨。', source: SRC },
      { id: 'e6b', stance: 'against', kind: 'fact', text: '换一个口径重算，方向相同。', source: SRC },
      { id: 'e6c', stance: 'support', kind: 'hypothesis', text: '我们的假说：影响只在流动性收紧时出现。', source: SRC },
    ],
  },
  {
    id: 'e7',
    from: 'profit',
    to: 'price',
    status: 'partial',
    label: '利润定价',
    failureCondition: '利润归属变化之后，对应资产的价格没有重估。',
    evidence: [
      { id: 'e7a', stance: 'support', kind: 'fact', text: '利润集中的行业估值抬升。', source: SRC },
      { id: 'e7b', stance: 'against', kind: 'fact', text: '利润被上游吃掉的行业，估值没有下降。', source: SRC },
    ],
  },
  {
    id: 'e8',
    from: 'price',
    to: 'credit',
    status: 'supported',
    feedback: true,
    label: '抵押品与再融资',
    failureCondition: '资产价格大幅变化后，以它为抵押的新增信用没有同向变化。',
    evidence: [
      { id: 'e8a', stance: 'support', kind: 'fact', text: '抵押品价格上行期，以其为抵押的新增贷款增加。', source: SRC },
      { id: 'e8b', stance: 'support', kind: 'view', text: '某学者把这条反馈称为信用的顺周期放大器。', source: SRC },
    ],
  },
]

const LABELS: TransmissionChainLabels = {
  chain: '传导链图',
  notConnected: '未连接',
  status: { untested: '未检验', supported: '有证据支持', contradicted: '证据反对', partial: '部分成立' },
  stance: { support: '支持', against: '反对', neutral: '背景' },
  kind: { view: '学者观点', fact: '已发生的政策与资金变化', hypothesis: '我们的假说' },
  legend: '验证状态图例',
  evidence: '证据',
  noEvidence: '还没有证据。',
  failureCondition: '失败条件',
  noFailureCondition: '还没写失败条件：写不出来的判断先别信。',
  feedback: '反馈',
  upstream: '上游（谁传到这里）',
  downstream: '下游（传到谁）',
  none: '没有',
  pickHint: '点一条边看证据与失败条件，点一个环节看它的上下游。滚轮缩放，拖动平移。',
  counts: (support, against) => `支 ${support} 反 ${against}`,
  edgeName: (from, to) => `${from} 到 ${to}`,
  zoomIn: '放大',
  zoomOut: '缩小',
  fit: '适应窗口',
}

export function TransmissionChainDemo() {
  return (
    <div className="gal-stack" style={{ width: '100%' }}>
      <p className="gal-note">
        演示数据：环节是「地缘 → 规则 → 信用 → 用途 → 利润 →
        资产价格」这条研究框架，状态与证据条数是编的，不是研究结论。 资产价格到信用是反馈边。
      </p>
      <div style={{ height: 700 }} data-testid="tc-frame">
        <TransmissionChain nodes={NODES} edges={EDGES} labels={LABELS} />
      </div>
      <p className="gal-note">没有节点时：</p>
      <div style={{ height: 120 }} data-testid="tc-empty">
        <TransmissionChain nodes={[]} edges={[]} labels={LABELS} />
      </div>
    </div>
  )
}
