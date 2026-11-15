# FlowSankey

资金从来源（央行、银行信贷、财政、海外……）经通道到用途（偿债、消费、投资、资产配置）再到受益方的桑基图，节点与流量由调用方给，列由节点的 column 定。悬停节点或链路出 LCD 读数：金额、占来源流出、占总量；点节点（或聚焦后 Enter / 空格）钉住它的全部上游与下游，其余压暗，再点或 Esc 取消。「交易流量」与「价格重估」分开：交易流量是实色带，价格重估（估值变了、没有资金移动）是斜纹带，占比与总量只算交易流量，右上有开关可以把重估整条拿掉；图例分开写。链路与节点是中性灰，不用橙与蓝，节点想着色由调用方给 color。排布用 d3-sankey 0.12.3（BSD-3-Clause，见 NOTICE），有环时不画、写 labels.cycle（先把回流拆成另一个节点）。需求稿是 issue #45，没有读到可对照的参照产品页面，待核对；演示数据全部虚构。

## Provide

`*` marks a required prop.

### FlowSankey

文字全由 props 传。图是 viewBox 960 宽的 svg，随容器缩放；每个节点是 role=button 的矩形，读屏名带流入与流出；图右上有表格视图、导出、全屏三件（表格视图总有，表里每条链路一行）。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `nodes` | `FlowNode[]` | — | { id, label, column?, color? }。column 全给才按它分列（从 0 起），否则由链路深度定；没有任何链路的节点不画。 |
| `links` | `FlowLink[]` | — | { id?, source, target, value, kind?: flow \| revaluation, note? }。value 不是正数或指向不存在节点的链路丢掉。kind 默认 flow。 |
| `labels` | `FlowSankeyLabels` | — | 全部文字：读屏名、两种链路的名字、读数行名、开关、空态与有环的提示。 |
| `columnLabels` | `string[]` | — | 每一列顶上的标题；不给不画。 |
| `formatValue / formatShare` | `(number) => string` | — | 金额（含单位）与占比（0.25）怎么写；占比默认一位小数的百分数。 |
| `height` | `number` | `420` | 图高（viewBox 单位）。 |
| `badge` | `ReactNode` | — | 图例行右端的小标，如「演示数据」。 |
| `actionLabels / tableLabel / tableHead / source / onExport / onFullscreen` | `ChartViewProps` | — | 同其他图：三个图工具的名字、表格视图的读屏名与表头（五列：链路、类型、金额、占来源流出、占总量）、来源一行、导出与全屏的回调。 |

### layoutFlow(nodes, links, options)

节点与链路 → 排布、占比、总量的纯函数（总量是没有交易流入的节点的交易流出之和）；返回 { ok: true, nodes, links, total, dropped, columns } 或 { ok: false, reason: empty | cycle }。

## Usage

```tsx

```

## States

- 没有选中：全部链路与节点正常亮度；悬停节点时它的上下游亮、其余压暗；悬停链路时只亮它与两端。
- 钉住节点后离开也保持高亮，直到再点同一个节点、点空白或按 Esc。
- 价格重估链路是斜纹，不进占比与总量；关掉开关后它整条不参与排布，图上只剩交易流量。
- 没有可画的链路写 labels.empty；有环写 labels.cycle，不抛错。

## Don't

- 不要把价格重估写成 kind: flow：它没有资金移动，会混进占比。
- 不要传环（A→B→A）：资金回流请记成另一个节点（例如「回流」）。
- 不要在件里写文字、也不要把演示数据当真实资金流向。

## Composition

```
FlowSankey
  Switch（显示价格重估）· 图右上三件（表格视图 · 导出 · 全屏）
  svg role=group
    pattern（斜纹）
    path × 链路
    rect role=button × 节点 · text 标签
  LcdTooltip（悬停读数）
  图例（交易流量 · 价格重估 · 小标）
```

## Keyboard

- `Tab`：进图，停在一个节点上
- `↑ / ↓`：同一列里上一个 / 下一个节点
- `← / →`：去连着的上一列 / 下一列里纵向最近的节点
- `Home / End`：第一个 / 最后一个节点
- `Enter / 空格`：钉住或取消钉住这个节点的上下游
- `Esc`：取消钉住
