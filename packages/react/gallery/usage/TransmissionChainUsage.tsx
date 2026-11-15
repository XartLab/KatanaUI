// SPDX-License-Identifier: MIT
import { TransmissionChain, type ChainEdge, type ChainNode, type TransmissionChainLabels } from '../../src/blocks'

const NODES: readonly ChainNode[] = [
  { id: 'rules', label: '货币财政金融规则', note: '谁有权创造资金、按什么规则创造。' },
  { id: 'credit', label: '信用与购买力分配', note: '新增资金先到谁手里。' },
  { id: 'price', label: '资产价格', note: '哪类资产拥有收益权。' },
]

const EDGES: readonly ChainEdge[] = [
  {
    id: 'e1',
    from: 'rules',
    to: 'credit',
    status: 'supported',
    label: '规则定分配',
    failureCondition: '规则放松期，信用增量没有先流向规则偏向的部门。',
    evidence: [
      {
        id: 'e1a',
        stance: 'support',
        kind: 'policy',
        summary: '规则放松后的两个季度，偏向部门的新增贷款占比上升（演示数据）。',
        source: '演示数据',
        href: '#/transmission-chain',
        publishedAt: Date.UTC(2026, 9, 20),
      },
    ],
  },
  { id: 'e2', from: 'credit', to: 'price', status: 'untested', label: '信用推价' },
  { id: 'e3', from: 'price', to: 'credit', status: 'partial', feedback: true, label: '抵押品与再融资' },
]

const LABELS: TransmissionChainLabels = {
  chain: '传导链图',
  notConnected: '未连接',
  status: { untested: '未检验', supported: '有证据支持', contradicted: '证据反对', partial: '部分成立' },
  stance: { support: '支持', oppose: '反对' },
  kind: { scholar: '学者观点', policy: '政策与资金变化', data: '数据', filing: '财报' },
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
  date: (at) => new Date(at).toISOString().slice(0, 10),
  zoomIn: '放大',
  zoomOut: '缩小',
  fit: '适应窗口',
}

export function TransmissionChainUsage() {
  return (
    <div style={{ width: '100%', height: 420 }}>
      <TransmissionChain nodes={NODES} edges={EDGES} labels={LABELS} />
    </div>
  )
}
