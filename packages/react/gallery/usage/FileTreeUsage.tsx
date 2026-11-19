// SPDX-License-Identifier: MIT
import { FileTree, type FileTreeItem } from '../../src/index'

const items: FileTreeItem[] = [
  {
    id: 'strategies',
    name: 'strategies',
    type: 'folder',
    children: [
      { id: 'momentum', name: 'momentum.py', type: 'file', badge: 'M' },
      { id: 'meanrev', name: 'mean_reversion.py', type: 'file' },
    ],
  },
  { id: 'readme', name: 'README.md', type: 'file' },
]

export function FileTreeUsage() {
  return <FileTree label="Strategy files" items={items} defaultExpanded={['strategies']} />
}
