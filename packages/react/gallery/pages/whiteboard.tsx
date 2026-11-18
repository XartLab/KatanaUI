// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { getDownstream, Whiteboard, type WhiteboardDoc, type WhiteboardLabels } from '../../src/blocks/index.ts'

// 白板的演示（#51）：一张「降息 → 信用 → 地产 → 资产价格」的推演图。指标的数值与折线、假说的状态与证据条数都是演示数据（编的，不是研究结论），页上写明。
// 右侧读数显示当前文档的节点数与边数、选中节点的下游（getDownstream），e2e 读它们。

const START: WhiteboardDoc = {
  nodes: [
    { id: 'frame', type: 'group', position: { x: -24, y: -40 }, width: 448, height: 168, data: { title: '输入指标' } },
    {
      id: 'rate',
      type: 'metric',
      parentId: 'frame',
      position: { x: 24, y: 40 },
      data: { title: '政策利率', value: '1.40', unit: '%', series: [1.8, 1.75, 1.7, 1.6, 1.55, 1.5, 1.4] },
    },
    {
      id: 'spread',
      type: 'metric',
      parentId: 'frame',
      position: { x: 232, y: 40 },
      data: { title: '信用利差', value: '86', unit: 'bp', series: [120, 112, 108, 101, 95, 90, 86] },
    },
    {
      id: 'credit',
      type: 'hypothesis',
      position: { x: 40, y: 200 },
      data: { title: '降息推高信用扩张', status: 'supported', support: 3, oppose: 0 },
    },
    {
      id: 'house',
      type: 'hypothesis',
      position: { x: 40, y: 340 },
      data: { title: '信用流向地产', status: 'partial', support: 1, oppose: 1 },
    },
    { id: 'price', type: 'card', position: { x: 40, y: 480 }, data: { title: '资产价格', slot: 'price' } },
    {
      id: 'memo',
      type: 'note',
      position: { x: 320, y: 220 },
      data: { text: '演示数据：数值、折线与证据条数是编的。' },
    },
    {
      id: 'fx',
      type: 'hypothesis',
      position: { x: 320, y: 360 },
      data: { title: '资金外流压汇率', status: 'untested' },
    },
  ],
  edges: [
    { id: 'e1', source: 'rate', target: 'credit', status: 'supported', label: '降息' },
    { id: 'e2', source: 'spread', target: 'credit' },
    { id: 'e3', source: 'credit', target: 'house', status: 'partial' },
    { id: 'e4', source: 'house', target: 'price', status: 'contradicted' },
    { id: 'e5', source: 'credit', target: 'fx', status: 'untested' },
    { id: 'e6', source: 'price', target: 'credit', feedback: true, label: '抵押品' },
  ],
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

export function WhiteboardDemo() {
  const [doc, setDoc] = useState(START)
  const [picked, setPicked] = useState<string[]>([])
  const down = picked.length === 1 ? [...getDownstream(doc.edges, picked[0]!).nodes] : []
  return (
    <div className="gal-stack" style={{ width: '100%' }}>
      <p className="gal-note">
        演示数据：「降息 → 信用 → 地产 →
        资产价格」的推演，指标数值、折线与证据条数都是编的，不是研究结论。资产价格到信用是反馈边。
        拖动、从节点边上的点拖出连线、框选、Delete 删除、Ctrl+Z / Ctrl+Shift+Z 撤销重做、Ctrl+C / Ctrl+V
        复制粘贴、右键出菜单。
      </p>
      <div style={{ height: 560 }} data-testid="wb-frame">
        <Whiteboard
          nodes={doc.nodes}
          edges={doc.edges}
          onChange={setDoc}
          onSelectionChange={setPicked}
          labels={LABELS}
          defaultMinimap
          renderCard={(node) =>
            node.data.slot === 'price' ? <span className="gal-note">插槽：调用方画（这里是一行字）</span> : null
          }
        />
      </div>
      <p className="gal-note" data-testid="wb-readout">
        节点 <b data-testid="wb-node-count">{doc.nodes.length}</b> · 边{' '}
        <b data-testid="wb-edge-count">{doc.edges.length}</b> · 下游{' '}
        <b data-testid="wb-downstream">{down.join(',') || '—'}</b>
      </p>
    </div>
  )
}
