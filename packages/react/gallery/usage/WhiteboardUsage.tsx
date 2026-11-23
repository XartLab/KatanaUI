// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { Whiteboard, type WhiteboardDoc, type WhiteboardLabels } from '../../src/blocks'

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
