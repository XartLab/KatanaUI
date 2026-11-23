# Whiteboard

研究面板的传导链与 KATANAview #319「白板推演」共用的一块画布（#51）：节点有便签、分组框、指标 / 序列（标题 + 当前值 + 小折线，用 Sparkline）、卡片（插槽，调用方画）、假说（状态与证据计数）；边有普通、带验证状态（与 TransmissionChain 同一套线型 + 图标 + 色）、反馈边（点线 + 回环图标）。拖拽、从连接点拖出连线、框选、Delete 删除、撤销重做、复制粘贴、拖动时对齐吸附（左 / 中 / 右、上 / 中 / 下差 6px 以内贴上并画辅助线）、自动布局（dagre，TB / LR，只排顶层节点，反馈边不参与定层）、适应窗口、小地图开关、右键菜单、键盘可达。选中一个节点，沿边能到的下游节点与边加亮、其余淡到 35%；getDownstream(edges, id) 给同一份名单，「改一个指标只重算下游」由调用方按名单算。受控：nodes / edges 进、onChange 回整份新文档，纯 JSON，存哪由调用方管。底座 @xyflow/react（React Flow 13，MIT），布局 @dagrejs/dagre 3.1.3（MIT）；不用 tldraw（许可证不是开源许可，生产要密钥）。自动布局、自定义节点与边、右键菜单、节点工具条照 React Flow 官网的免费示例（MIT）；它的撤销重做、复制粘贴、辅助线是 Pro 示例（xyflow Pro License），没用，这几项是自己写的。页上的数值、折线与证据条数是演示数据。

## Provide

`*` marks a required prop.

### Whiteboard

受控件：文档由调用方存；选中、量到的尺寸、撤销历史是件内的界面状态，不进文档。高度由外层给。包里没有语言，文字都由 labels 传。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `nodes` | `WhiteboardNode[]` | — | { id, type: note \| group \| metric \| card \| hypothesis, position: { x, y }, width?, height?, parentId?, data }。data：note { text }；group { title }（要给 width、height）；metric { title, value（写好的字）, unit?, series?: number[] }；card { title, slot? }；hypothesis { title, status, support?, oppose? }。 |
| `edges` | `WhiteboardEdge[]` | — | { id, source, target, status?: untested \| supported \| contradicted \| partial, feedback?, label? }。不给 status 是普通边；指向不存在节点的边、自环与重复 id 被丢掉。 |
| `onChange` | `(doc: WhiteboardDoc) => void` | — | 每次改动回整份新文档 { nodes, edges, layout }；拖动中逐帧回，松手记一步撤销历史。 |
| `labels` | `WhiteboardLabels` | — | 工具条、菜单、状态名、计数与小折线读屏名的全部文字。 |
| `renderCard` | `(node: WhiteboardCardNode) => ReactNode` | — | 卡片节点的插槽里画什么（按 data.slot 分）。 |
| `onSelectionChange` | `(nodeIds: string[]) => void` | — | 选中的节点变了。 |
| `layout` | `'TB' \| 'LR'` | — | 连接点朝向（文档的 layout 字段，受控）：缺省 TB；点自动布局时 onChange 回的文档带新的 layout，存下来，打开时按它还原。 |
| `defaultMinimap` | `boolean` | — | 小地图起始开着没有，默认关。 |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { Whiteboard, type WhiteboardDoc, type WhiteboardLabels } from '@katana-ui/react/blocks'

// 演示数据：节点、数值与折线都是编的。
const START: WhiteboardDoc = {
  nodes: [
    {
      id: 'rate',
      type: 'metric',
      position: { x: 0, y: 0 },
      data: { title: '政策利率', value: '1.40', unit: '%', series: [1.8, 1.7, 1.6, 1.5, 1.5, 1.4] },
    },
    {
      id: 'credit',
      type: 'hypothesis',
      position: { x: 0, y: 140 },
      data: { title: '降息推高信用扩张', status: 'partial', support: 2, oppose: 1 },
    },
    { id: 'note', type: 'note', position: { x: 260, y: 140 }, data: { text: '双击改字' } },
  ],
  edges: [{ id: 'e1', source: 'rate', target: 'credit', status: 'partial' }],
}

const LABELS: WhiteboardLabels = {
  board: '白板',
  toolbar: '白板工具',
  undo: '撤销',
  redo: '重做',
  layoutTB: '自动布局：从上到下',
  layoutLR: '自动布局：从左到右',
  fit: '适应窗口',
  minimap: '小地图',
  copy: '复制',
  paste: '粘贴',
  duplicate: '复制一份',
  delete: '删除',
  addNote: '加便签',
  menu: '白板菜单',
  selectDownstream: '选中下游',
  newNote: '新便签',
  feedback: '反馈',
  status: { untested: '未检验', supported: '有证据支持', contradicted: '证据反对', partial: '部分成立' },
  counts: (support, oppose) => `支 ${support} 反 ${oppose}`,
  series: (title) => `${title}的走势`,
}

export function WhiteboardUsage() {
  const [doc, setDoc] = useState(START)
  return (
    <div style={{ width: '100%', height: 360 }}>
      <Whiteboard nodes={doc.nodes} edges={doc.edges} layout={doc.layout} onChange={setDoc} labels={LABELS} />
    </div>
  )
}
```

## States

- 选中一个节点：它的下游节点亮边加选中底色、下游边加粗，其余淡到 35%；选中多个时不标下游。
- 拖动：离别的节点的边或中线 6px 以内贴上，画一条辅助线；松手记一步历史。
- 键盘焦点：节点四角画橙色角括号（橙色只给这里）；选中是中性的亮边。
- 分组框选中：四角与四边出改大小的把手，组内节点跟着框拖。

## Don't

- 不要在件里算指标：改了一个指标，用 getDownstream 拿到下游名单，在调用方重算再传回来。
- 不要用橙色或蓝色画节点与边的状态：状态用涨色、跌色、琥珀、灰加图标与文字。
- 不要把演示数据当研究结论。

## Composition

```
Whiteboard
  ReactFlow（@xyflow/react）：点阵背景、节点 × 5 种（带连接点与选中时的节点工具条）、边（路径 + 状态标签）、辅助线、小地图
  Toolbar：撤销、重做 | 自动布局 TB、LR | 适应窗口、小地图
  ContextMenu：节点（复制一份、复制、选中下游、删除）/ 边（删除）/ 空白（加便签、粘贴、布局、适应）
```

## Keyboard

- `Tab`：在工具条、节点、边间移动
- `方向键`：挪动选中的节点
- `Delete / Backspace`：删除选中的节点与边
- `Ctrl+Z / Ctrl+Shift+Z（Ctrl+Y）`：撤销 / 重做
- `Ctrl+C / Ctrl+V / Ctrl+D`：复制 / 粘贴 / 复制一份
- `菜单键 / Shift+F10`：在聚焦的节点或边上开右键菜单
- `滚轮 / 拖动空白`：缩放 / 平移
