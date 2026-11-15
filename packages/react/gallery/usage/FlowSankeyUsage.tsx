// SPDX-License-Identifier: MIT
import { FlowSankey, type FlowLink, type FlowNode } from '../../src/quant'

const NODES: FlowNode[] = [
  { id: 'cb', label: '央行', column: 0 },
  { id: 'credit', label: '银行信贷', column: 0 },
  { id: 'banks', label: '银行体系', column: 1 },
  { id: 'invest', label: '投资', column: 2 },
  { id: 'consume', label: '消费', column: 2 },
  { id: 'firms', label: '企业', column: 3 },
  { id: 'households', label: '居民', column: 3 },
]

const LINKS: FlowLink[] = [
  { source: 'cb', target: 'banks', value: 100 },
  { source: 'credit', target: 'banks', value: 200 },
  { source: 'banks', target: 'invest', value: 200 },
  { source: 'banks', target: 'consume', value: 100 },
  { source: 'invest', target: 'firms', value: 200 },
  { source: 'consume', target: 'households', value: 100 },
]

const LABELS = {
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

export function FlowSankeyUsage() {
  return (
    <div style={{ width: '100%', maxWidth: 880 }}>
      <FlowSankey
        nodes={NODES}
        links={LINKS}
        labels={LABELS}
        columnLabels={['来源', '通道', '用途', '受益方']}
        formatValue={(value) => String(value)}
        actionLabels={{ group: '图的操作', table: '表格视图', exportCsv: '导出 CSV', fullscreen: '全屏' }}
        tableLabel="资金流向表"
        tableHead={['链路', '类型', '金额', '占来源流出', '占总量']}
        badge="演示数据"
        source="来源 / 演示数据（虚构）"
      />
    </div>
  )
}
