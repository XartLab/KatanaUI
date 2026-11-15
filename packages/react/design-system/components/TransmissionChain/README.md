# TransmissionChain

研究「谁创造资金 → 谁先取得购买力 → 经过什么通道 → 用于什么 → 谁获得收入与利润 → 哪类资产拥有收益权」这类传导框架的有向图：节点是传导环节，边是传导关系，每条边有验证状态（未检验 / 有证据支持 / 证据反对 / 部分成立）与证据计数，边上的标签写状态图标与「支 n 反 n」。点边，右侧出这条判断的失败条件与证据列表（每条证据有立场，并标来源类别：学者观点 / 政策与资金变化 / 数据 / 财报）；点节点，列出它的上下游边，不挨着的边淡出。支持沿链回到上游的反馈边（如资产价格经抵押品与再融资回到信用）。布局用 dagre（MIT，一层一层排，环由它先反转再还原），滚轮缩放、拖动平移、一键适应。状态色：支持 = 涨色、反对 = 跌色、部分 = 琥珀点划线、未检验 = 灰虚线，状态另有图标与状态字，不只靠颜色；橙色不画数据，不用蓝。画法参照 TradingView 的缩放与平移手感；证据行与数据类型同 HypothesisLedger（HypothesisEvidence，样式用它的 k-hl-ev）。演示数据（状态与证据条数）是编的，页上与证据行都写明。

## Provide

`*` marks a required prop.

### TransmissionChain

件只画、只回调：节点、边、证据与全部文字由调用方传，件不认识任何应用或研究框架；高度由外层给。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `nodes` | `ChainNode[]` | — | { id, label, note? }：传导环节。没有节点写 labels.notConnected，不补样本。 |
| `edges` | `ChainEdge[]` | — | { id, from, to, status: untested \| supported \| contradicted \| partial, label?, feedback?, failureCondition?, evidence?: HypothesisEvidence[]（kind、source、href、publishedAt、summary、stance: support \| oppose） }。证据计数由 evidence 数出来，不另传；指向不存在节点的边、自环与重复 id 被丢掉。 |
| `labels` | `TransmissionChainLabels` | — | 全部文字（状态名、立场名、来源类别、各区标题、提示与 counts / edgeName 函数）。包里没有语言。 |
| `direction` | `'LR' \| 'TB'` | — | 布局方向，默认从上到下（链长时横排会宽到缩得看不清）；LR 从左到右。 |
| `defaultSelected / onSelect` | `ChainSelection` | — | 起始选中（{ kind: edge \| node, id }）与选中变化的回调；选中的 id 不存在时当作没选。 |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { TransmissionChain, type ChainEdge, type ChainNode, type TransmissionChainLabels } from '@katana-ui/react/blocks'

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
```

## States

- 没有节点：写 labels.notConnected。
- 边没有证据：右侧写 labels.noEvidence，标签上不写计数。
- 边没有失败条件：右侧写 labels.noFailureCondition（琥珀提示），不替调用方编。
- 选中节点：不挨着它的节点与边淡出到 30%。
- 反馈边：data-feedback，布局时权重很低，不参与定层，画出来绕回上游。

## Don't

- 不要用橙色或蓝色画状态：状态用涨色、跌色、琥珀、灰加图标与文字。
- 不要把演示数据当研究结论。
- 不要在件里写文字或判断状态：状态由调用方按证据定，件只显示。

## Composition

```
TransmissionChain
  画布：svg（dagre 布局）× 边（路径、箭头、标签）+ 节点；缩放 / 适应按钮；状态图例
  详情：边（状态、失败条件、证据行）或节点（上下游边）
```

## Keyboard

- `Tab`：在缩放按钮、边、节点间移动
- `Enter / Space`：选中当前的边或节点
- `滚轮 / 拖动`：缩放（以指针为中心）/ 平移
