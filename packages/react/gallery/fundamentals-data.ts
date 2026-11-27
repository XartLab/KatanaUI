// SPDX-License-Identifier: MIT
// 投研三件（KATANAview #2395）的演示数据：虚构公司、固定种子合成，不是任何真实公司的财报或行情。文档站页、usage 与组件截图共用。
import type { DocBlock } from '../src/blocks/doc-reader/doc-reader-model.ts'
import type { CompsMetric, CompsRow } from '../src/quant/comps-table.tsx'
import type { StatementItem, StatementPeriod, StatementValues } from '../src/quant/statement-model.ts'
import { seeded } from './research-data.ts'

// —— 利润表：一家虚构公司 8 个季度（单位：元），2026Q1 营业收入有一次更正 ——

export const DEMO_STATEMENT_ITEMS: StatementItem[] = [
  { id: 'revenue', label: '营业收入' },
  { id: 'cost', label: '营业成本' },
  { id: 'gross', label: '毛利', kind: 'subtotal' },
  { id: 'opex', label: '期间费用' },
  { id: 'selling', label: '销售费用', parent: 'opex' },
  { id: 'admin', label: '管理费用', parent: 'opex' },
  { id: 'rnd', label: '研发费用', parent: 'opex' },
  { id: 'operating', label: '营业利润', kind: 'subtotal' },
  { id: 'tax', label: '所得税' },
  { id: 'net', label: '净利润', kind: 'total' },
]

export const DEMO_STATEMENT_PERIODS: StatementPeriod[] = [
  '2024Q3',
  '2024Q4',
  '2025Q1',
  '2025Q2',
  '2025Q3',
  '2025Q4',
  '2026Q1',
  '2026Q2',
].map((id) => ({ id, label: id.replace('Q', ' Q') }))

export const DEMO_STATEMENT_VALUES: StatementValues = (() => {
  const rand = seeded(2395)
  const out: Record<string, Record<string, number | { value: number; revision: number; note: string }>> = {}
  const put = (item: string, period: string, value: number) => {
    out[item] = { ...out[item], [period]: Math.round(value) }
  }
  let revenue = 4.2e9
  for (const { id } of DEMO_STATEMENT_PERIODS) {
    revenue *= 1.03 + rand() * 0.06
    const cost = revenue * (0.58 + rand() * 0.04)
    const selling = revenue * (0.08 + rand() * 0.01)
    const admin = revenue * (0.05 + rand() * 0.01)
    const rnd = revenue * (0.07 + rand() * 0.02)
    const operating = revenue - cost - selling - admin - rnd
    const tax = operating * 0.15
    put('revenue', id, revenue)
    put('cost', id, cost)
    put('gross', id, revenue - cost)
    put('selling', id, selling)
    put('admin', id, admin)
    put('rnd', id, rnd)
    put('opex', id, selling + admin + rnd)
    put('operating', id, operating)
    put('tax', id, tax)
    put('net', id, operating - tax)
  }
  const first = out.revenue!['2026Q1'] as number
  out.revenue!['2026Q1'] = { value: first, revision: 2, note: '2026-05-20 更正公告' }
  return out
})()

// —— 同业对比：7 家虚构公司，第一家是本公司 ——

export const DEMO_COMPS_METRICS: CompsMetric[] = [
  { id: 'pe', label: 'PE', sub: 'TTM', group: 'valuation', better: 'lower', format: (v) => `${v.toFixed(1)}x` },
  { id: 'pb', label: 'PB', sub: 'MRQ', group: 'valuation', better: 'lower', format: (v) => `${v.toFixed(2)}x` },
  {
    id: 'evEbitda',
    label: 'EV/EBITDA',
    sub: 'TTM',
    group: 'valuation',
    better: 'lower',
    format: (v) => `${v.toFixed(1)}x`,
  },
  {
    id: 'revGrowth',
    label: '营收同比',
    sub: 'TTM',
    group: 'growth',
    better: 'higher',
    format: (v) => `${(v * 100).toFixed(1)}%`,
  },
  {
    id: 'epsGrowth',
    label: 'EPS 同比',
    sub: 'TTM',
    group: 'growth',
    better: 'higher',
    format: (v) => `${(v * 100).toFixed(1)}%`,
  },
  {
    id: 'gross',
    label: '毛利率',
    sub: 'TTM',
    group: 'profit',
    better: 'higher',
    format: (v) => `${(v * 100).toFixed(1)}%`,
  },
  { id: 'roe', label: 'ROE', sub: 'TTM', group: 'profit', better: 'higher', format: (v) => `${(v * 100).toFixed(1)}%` },
  {
    id: 'netDebt',
    label: '净负债率',
    sub: 'MRQ',
    group: 'profit',
    format: (v) => `${(v * 100).toFixed(0)}%`,
    width: 88,
  },
]

export const DEMO_COMPS_GROUPS = [
  { id: 'valuation', label: '估值' },
  { id: 'growth', label: '增长' },
  { id: 'profit', label: '盈利' },
]

export const DEMO_COMPS_ROWS: CompsRow[] = (() => {
  const rand = seeded(23952)
  const names: [string, string][] = [
    ['ALFA', '阿尔法精工'],
    ['BRVO', '布拉沃电子'],
    ['CHAR', '查理材料'],
    ['DLTA', '德尔塔科技'],
    ['ECHO', '回声半导体'],
    ['FXTR', '福克斯特'],
    ['GOLF', '高尔夫智能'],
  ]
  return names.map(([symbol, name], index) => ({
    id: symbol,
    symbol,
    name,
    subject: index === 0,
    values: {
      pe: 14 + rand() * 30,
      pb: 1.2 + rand() * 4,
      evEbitda: 8 + rand() * 18,
      revGrowth: -0.05 + rand() * 0.4,
      // 一家缺 EPS 同比（上年亏损，同比没有意义）：表里写「—」，不写 0。
      epsGrowth: index === 4 ? null : -0.2 + rand() * 0.8,
      gross: 0.2 + rand() * 0.35,
      roe: 0.04 + rand() * 0.2,
      netDebt: -0.3 + rand() * 0.9,
    },
  }))
})()

// —— 估值带：5 年周线的价格与 PE；中间有一段亏损（PE 为负），那一段带线断开 ——

export const DEMO_BAND = (() => {
  const rand = seeded(23953)
  const prices: number[] = []
  const pe: (number | null)[] = []
  const dates: string[] = []
  let price = 24
  let eps = 1.2
  let time = Date.UTC(2021, 10, 26)
  for (let i = 0; i < 260; i += 1) {
    price *= 1 + (rand() - 0.48) * 0.06
    eps *= 1 + (rand() - 0.45) * 0.03
    const lossStretch = i >= 120 && i < 132
    prices.push(Number(price.toFixed(2)))
    pe.push(lossStretch ? -(price / 0.4) : Number((price / eps).toFixed(2)))
    dates.push(new Date(time).toISOString().slice(0, 10))
    time += 7 * 86_400_000
  }
  return { prices, pe, dates }
})()

// —— 文档阅读器：一份虚构公司的年报摘录（标题 + 段落）；宿主从 PDF 抽块交进来，演示里直接写块 ——

export const DEMO_DOC_BLOCKS: DocBlock[] = [
  { id: 's1', kind: 'heading', level: 1, text: '第一节 重要提示' },
  {
    id: 'p1',
    kind: 'paragraph',
    text: '本报告所载财务数据未经审计。董事会及全体董事保证本报告内容的真实、准确、完整。',
  },
  { id: 's2', kind: 'heading', level: 1, text: '第二节 经营情况讨论与分析' },
  { id: 's2a', kind: 'heading', level: 2, text: '一、报告期内主要经营情况' },
  {
    id: 'p2',
    kind: 'paragraph',
    text: '报告期内公司实现营业收入 268.4 亿元，同比增长 18.6%；归属于母公司股东的净利润 32.1 亿元，同比增长 21.3%。',
  },
  { id: 'p3', kind: 'paragraph', text: '算力相关产品收入占比由上年的 22% 提升至 35%，传统产品收入同比下降 6.2%。' },
  { id: 's2b', kind: 'heading', level: 2, text: '二、资本开支计划' },
  {
    id: 'p4',
    kind: 'paragraph',
    text: '公司计划在未来两年投入资本开支约 60 亿元，主要用于新建产线与研发中心；其中 2027 年资本开支约 35 亿元。',
  },
  {
    id: 'p5',
    kind: 'paragraph',
    text: '资本开支的资金来源为自有资金与银行借款，公司将根据市场需求变化调整资本开支节奏。',
  },
  { id: 's3', kind: 'heading', level: 1, text: '第三节 重大合同' },
  {
    id: 'p6',
    kind: 'paragraph',
    text: '报告期内公司与客户 A 签订设备采购合同，合同金额 12.6 亿元，预计 2027 年第二季度交付。',
  },
]
