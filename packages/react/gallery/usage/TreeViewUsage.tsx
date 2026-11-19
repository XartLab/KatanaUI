// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { TreeView, type TreeNode } from '../../src/index'

const TREE_ITEMS: readonly TreeNode[] = [
  {
    id: 'cn',
    label: 'A 股',
    count: 3,
    children: [
      {
        id: 'cn-main',
        label: '主板',
        count: 2,
        children: [
          { id: 'cn-sh', label: '沪市' },
          { id: 'cn-sz', label: '深市' },
        ],
      },
      { id: 'cn-star', label: '科创板' },
    ],
  },
  { id: 'hk', label: '港股', count: 1, children: [{ id: 'hk-main', label: '主板' }] },
  {
    id: 'crypto',
    label: '加密',
    count: 2,
    children: [
      { id: 'crypto-spot', label: '现货' },
      { id: 'crypto-perp', label: '永续', disabled: true },
    ],
  },
  { id: 'misc', label: '未分类' },
]

export function TreeViewUsage() {
  const [selected, setSelected] = useState<string[]>(['cn-sh'])
  const [opened, setOpened] = useState('无')
  return (
    <>
      <div className="gal-tree" style={{ width: 240 }}>
        <TreeView
          label="品种分类"
          items={TREE_ITEMS}
          defaultExpandedKeys={['cn', 'cn-main']}
          value={selected}
          onValueChange={setSelected}
          onAction={setOpened}
        />
      </div>
      <output data-gallery-tree>{selected.join(',') || '无'}</output>
      <output data-gallery-tree-open>{opened}</output>
    </>
  )
}
