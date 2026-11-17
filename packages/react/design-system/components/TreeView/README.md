# TreeView

可展开收起的层级列表：数据集目录、品种分类树用它。方向键走、→ 展开、← 收起，单选或多选，展开与选中都可受控。功能参照 Arc，实现原创。

## Provide

`*` marks a required prop.

### TreeView

底座是 react-aria-components 的 Tree（角色 treegrid）：焦点、键盘、选中、展开都是它的。树数据用 items 传，一层层 children。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `items` | `{ id: string; label: string; icon?: ReactNode; count?: number; disabled?: boolean; children?: TreeNode[] }[]` | — | 树。id 在整棵树里唯一；有 children 才能展开；count 写在字后。 |
| `label` | `string` | — | 整棵树的读屏名。 |
| `selectionMode` | `'none' \| 'single' \| 'multiple'` | `'single'` | none 只展开收起，点行不选。 |
| `value / defaultValue` | `string[]` | — | 选中的 id，受控 / 非受控（旧名 selectedKeys / defaultSelectedKeys 留一个版本）。 |
| `onValueChange` | `(value: string[]) => void` | — | 选中变了（旧名 onSelectionChange）。 |
| `expandedKeys / defaultExpandedKeys` | `string[]` | — | 展开的 id，受控 / 非受控。 |
| `onExpandedChange` | `(keys: string[]) => void` | — | 展开变了。 |
| `onAction` | `(id: string) => void` | — | 激活一行（Enter 或双击）：打开这个数据集之类。给了它，点行是「选中这一行」（多选按 Ctrl / Shift 加减），方向键走到哪选到哪；不给，点行是切换选中，方向键只移焦点。 |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { TreeView, type TreeNode } from '@katana-ui/react'

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
```

## States

- 默认、悬停、选中（8% 白底）、键盘焦点（焦点环画在行内）、禁用（40% 不透明度）。
- 展开的行箭头转 90 度。
- 缩进按层级 16px 一档。

## Don't

- 不要拿它画很深很大的树（几千个节点）：它不做虚拟滚动。大目录先在数据层折叠。
- 不要在包里放图标集：图标由调用方传 icon。
- 不要拿它当导航菜单：菜单用 DropdownMenu 或工具条。

## Composition

```
TreeView
  Tree（react-aria）
    TreeItem × n（递归）
      行：箭头按钮、图标、字、数量
```

## Keyboard

- `↑ ↓`：上下走一行
- `→`：收起的行展开；已展开则进第一个子项
- `← `：展开的行收起；否则回父级
- `Home / End`：第一行 / 最后一行
- `空格`：选中（单选换掉，多选切换）
- `Enter`：激活（onAction）
- `打字`：跳到以它开头的行
