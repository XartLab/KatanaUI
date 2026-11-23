// SPDX-License-Identifier: MIT
import {
  FlowSankey,
  VintageSeries,
  type FlowLink,
  type FlowNode,
  type VintageObservation,
} from '../../src/quant/index.ts'
import { demoCopyImage } from './demo-copy.tsx'
import { Row } from './parts.tsx'
import { isoDate } from '../../src/lib/date.ts'
import { pad } from '../../src/lib/num.ts'

// 资金流向桑基图与按发布时间画的宏观序列的演示。下面所有数据都是虚构的演示数据（不是任何真实机构、市场或统计口径的数字），页上与小标都写明。

const ACTIONS = {
  group: '图的操作',
  table: '表格视图',
  exportCsv: '导出 CSV',
  fullscreen: '全屏',
  copyImage: '复制图片',
}

const NODES: FlowNode[] = [
  { id: 'cb', label: '央行', column: 0 },
  { id: 'credit', label: '银行信贷', column: 0 },
  { id: 'fiscal', label: '财政', column: 0 },
  { id: 'foreign', label: '海外', column: 0 },
  { id: 'banks', label: '银行体系', column: 1 },
  { id: 'nonbank', label: '非银金融', column: 1 },
  { id: 'treasury', label: '财政账户', column: 1 },
  { id: 'fx', label: '外汇渠道', column: 1 },
  { id: 'debt', label: '偿债', column: 2 },
  { id: 'consume', label: '消费', column: 2 },
  { id: 'invest', label: '投资', column: 2 },
  { id: 'assets', label: '资产配置', column: 2 },
  { id: 'households', label: '居民', column: 3 },
  { id: 'firms', label: '企业', column: 3 },
  { id: 'gov', label: '政府', column: 3 },
  { id: 'fin', label: '金融机构', column: 3 },
]

// 单位「演示单位」。交易流量按列守恒（每个节点流入 = 流出）；价格重估是另算的两条，没有资金移动。
const LINKS: FlowLink[] = [
  { source: 'cb', target: 'banks', value: 100 },
  { source: 'cb', target: 'nonbank', value: 60 },
  { source: 'credit', target: 'banks', value: 200 },
  { source: 'credit', target: 'nonbank', value: 100 },
  { source: 'fiscal', target: 'treasury', value: 180 },
  { source: 'foreign', target: 'fx', value: 90 },
  { source: 'banks', target: 'debt', value: 90 },
  { source: 'banks', target: 'consume', value: 60 },
  { source: 'banks', target: 'invest', value: 150 },
  { source: 'nonbank', target: 'invest', value: 40 },
  { source: 'nonbank', target: 'assets', value: 120 },
  { source: 'treasury', target: 'consume', value: 80 },
  { source: 'treasury', target: 'invest', value: 60 },
  { source: 'treasury', target: 'debt', value: 40 },
  { source: 'fx', target: 'assets', value: 50 },
  { source: 'fx', target: 'invest', value: 40 },
  { source: 'debt', target: 'fin', value: 130 },
  { source: 'consume', target: 'households', value: 70 },
  { source: 'consume', target: 'firms', value: 70 },
  { source: 'invest', target: 'firms', value: 200 },
  { source: 'invest', target: 'gov', value: 40 },
  { source: 'invest', target: 'households', value: 50 },
  { source: 'assets', target: 'households', value: 90 },
  { source: 'assets', target: 'fin', value: 80 },
  {
    source: 'assets',
    target: 'households',
    value: 60,
    kind: 'revaluation',
    note: '估值变化，没有资金移动',
  },
  { source: 'invest', target: 'firms', value: 25, kind: 'revaluation', note: '估值变化，没有资金移动' },
]

const one = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 })
const FLOW_LABELS = {
  chart: '示例：资金从来源经通道、用途到受益方的流向',
  flow: '交易流量',
  revaluation: '价格重估',
  showRevaluation: '显示价格重估',
  amount: '金额',
  shareOfSource: '占来源流出',
  shareOfTotal: '占总量',
  inflow: '流入',
  outflow: '流出',
  revalIn: '重估（入）',
  revalOut: '重估（出）',
  empty: '没有可画的流向',
  cycle: '流向里有环，先拆开再画',
}

export function FlowSankeyDemo() {
  return (
    <>
      <p className="gal-note">
        演示数据：全部虚构，单位是「演示单位」，不是任何真实机构或市场的数字。悬停看金额与占比，点节点钉住它的上下游，
        斜纹带是价格重估（估值变了、没有资金移动），不进占比。
      </p>
      <Row name="来源 → 通道 → 用途 → 受益方">
        <div className="gal-wide" data-gallery-flow="main" style={{ maxWidth: 880 }}>
          <FlowSankey
            nodes={NODES}
            links={LINKS}
            labels={FLOW_LABELS}
            columnLabels={['来源', '通道', '用途', '受益方']}
            formatValue={(value) => one.format(value)}
            actionLabels={ACTIONS}
            tableLabel="资金流向表"
            tableHead={['链路', '类型', '金额', '占来源流出', '占总量']}
            badge="演示数据"
            source="来源 / 演示数据（虚构）"
            onCopyImage={demoCopyImage}
          />
        </div>
      </Row>
      <Row name="有环（回流）时">
        <div className="gal-wide" data-gallery-flow="cycle" style={{ maxWidth: 880 }}>
          <FlowSankey
            nodes={[
              { id: 'p', label: '甲' },
              { id: 'q', label: '乙' },
            ]}
            links={[
              { source: 'p', target: 'q', value: 1 },
              { source: 'q', target: 'p', value: 1 },
            ]}
            labels={FLOW_LABELS}
            actionLabels={ACTIONS}
            tableLabel="资金流向表"
            tableHead={['链路', '类型', '金额', '占来源流出', '占总量']}
          />
        </div>
      </Row>
    </>
  )
}

function seeded(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const DAY = 86_400_000
const ASOF = Date.UTC(2025, 5, 30)
const NOW = Date.UTC(2026, 5, 30)

/** 36 个月（2023-01 到 2025-12）的虚构同比：首次发布值带噪声，一部分期有第二次修订，2023 年有一次年度基准修订。 */
const VINTAGES: VintageObservation[] = (() => {
  const rand = seeded(45)
  return Array.from({ length: 36 }, (_, i) => {
    const period = Date.UTC(2023, i + 1, 0)
    const truth = 2.4 + 1.1 * Math.sin(i / 5) + (rand() - 0.5) * 0.4
    const first = truth + (rand() - 0.5) * 1.1
    const releases = [{ at: period + 14 * DAY, value: Number(first.toFixed(2)), note: '首次发布' }]
    if (rand() < 0.75) {
      const second = first + (truth - first) * 0.6 + (rand() - 0.5) * 0.2
      releases.push({ at: period + 45 * DAY, value: Number(second.toFixed(2)), note: '第二次修订' })
    }
    if (i < 12) {
      releases.push({ at: Date.UTC(2024, 6, 15), value: Number((truth + 0.15).toFixed(2)), note: '年度基准修订' })
    }
    return { period, releases: releases.filter((release) => release.at <= NOW) }
  })
})()

const month = (at: number) => `${new Date(at).getUTCFullYear()}-${pad(new Date(at).getUTCMonth() + 1)}`
const day = isoDate
const signed = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  signDisplay: 'always',
})
const plain = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const VINTAGE_LABELS = {
  chart: '示例：某虚构指标同比，按发布时间',
  mode: '看哪条线',
  known: '当时已知值',
  latest: '最新修订值',
  both: '两条都看',
  revisions: '修订幅度（最新 − 首次）',
  revision: '累计修订',
  notYet: '还没发布',
  stats: { revised: '修订过的期', meanAbs: '平均绝对修订', bias: '平均修订方向', largest: '最大一次' },
  empty: '没有数据',
}

export function VintageSeriesDemo() {
  const common = {
    labels: VINTAGE_LABELS,
    formatPeriod: month,
    formatAt: day,
    formatValue: (value: number) => `${plain.format(value)}%`,
    formatDelta: (delta: number) => signed.format(delta),
    actionLabels: ACTIONS,
    onCopyImage: demoCopyImage,
    tableLabel: '发布值明细表',
    tableHead: ['统计期', '发布时刻', '值', '较上次', '较首次'],
    badge: '演示数据',
    source: '来源 / 演示数据（虚构，固定种子合成）',
  }
  return (
    <>
      <p className="gal-note">
        演示数据：虚构的月度同比，固定种子合成，不是任何真实统计。空心点是每期首次发布值（当时市场看到的），灰点是最新修订值，
        两点之间的细线长度就是修订幅度；下面一条小图是每期修订了多少。
      </p>
      <Row name="当时已知值 与 最新修订值">
        <div className="gal-wide" data-gallery-vintage="main" style={{ maxWidth: 880 }}>
          <VintageSeries {...common} observations={VINTAGES} />
        </div>
      </Row>
      <Row name="截至 2025-06-30 已知的（之后发布的修订与之后的期都不算）">
        <div className="gal-wide" data-gallery-vintage="asof" style={{ maxWidth: 880 }}>
          <VintageSeries {...common} observations={VINTAGES} asOf={ASOF} defaultMode="known" />
        </div>
      </Row>
    </>
  )
}
