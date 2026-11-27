# FileTree

策略目录、回测产物这类有文件夹也有文件的层级：行首是文件夹 / 文件图标、行尾可挂徽标；文件夹展开时子级高度弹出来、箭头转 90 度，可画纵向引导线。纯分类的树用 TreeView。

## Provide

`*` marks a required prop.

### FileTree

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `items` * | `readonly FileTreeItem[]` | — | The entries to show. |
| `label` * | `string` | — | What screen readers call this tree (required). |
| `defaultExpanded` | `readonly string[]` | `[]` | Folder ids expanded at first (uncontrolled). |
| `expanded` | `readonly string[]` | — | Folder ids expanded now (controlled). |
| `onExpandedChange` | `(expanded: string[]) => void` | — | Called with the expanded folder ids when they change. |
| `selected` | `string` | — | Selected item id (controlled). |
| `onSelectedChange` | `(id: string) => void` | — | Called with the id of the row the user picked. |
| `indent` | `number` | `14` | Indent per level in px. |
| `showLines` | `boolean` | `true` | Draw a vertical guide line for each nested level. |
| `className` | `string` | — | Extra classes for the root element. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { FileTree, type FileTreeItem } from '@katana-ui/react'

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
```

## States

- 文件夹收起：关闭的文件夹图标，箭头朝右。
- 文件夹展开：打开的图标、箭头朝下，子级高度弹出。
- 选中的行有底色；键盘焦点的行画焦点环。
- 有 badge 的行：行尾写改动标记或大小。

## Don't

- 不要拿它放几千个节点：它不做虚拟化。
- 不要放没有文件语义的分类（品种分类用 TreeView）。

## Composition

```
FileTree
  div role=tree
    div role=treeitem（一行）
    div role=group（展开的子级）
```

## Keyboard

- `↑ ↓`：上下走
- `→`：展开，已展开则进入第一个子级
- `←`：收起，已收起则回父级
- `Home / End`：到首、末行
- `Enter / Space`：选中，文件夹同时开合
