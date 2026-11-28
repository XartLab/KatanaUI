// SPDX-License-Identifier: MIT
/**
 * Data-driven tree on the UI SDK Tree: expand, collapse, single or multiple selection.
 * 选中照统一约定是 value / defaultValue / onValueChange（G6，旧名 selectedKeys / defaultSelectedKeys / onSelectionChange 留一个版本）。
 */
import { Tree, TreeGroup, TreeItem, TreeItemIndicator, TreeItemLabel } from '@ui-sdk/react/tree'
import { ChevronRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '../lib/cn.ts'

// 功能参照 Arc Tree view（uiarc.dev，2026-11-14 读：可展开收起的层级列表），实现原创；外观在 theme/tree-view.css。
// 用途：数据集目录、品种分类树（DatasetCatalog 的缺口）。行为底座是 UI SDK 的 Tree（@ui-sdk/react/tree，Apache-2.0，#263 从 react-aria 换来；tree 角色、方向键 ↑↓ 走、→ 展开 / 进子级、← 收起 / 回父级、
// Home / End、打字跳到以它开头的项、单选 / 多选与展开状态的受控与非受控），焦点与选中都不自己写。文字全由调用方传（label），包里没有语言。

export type TreeNode = {
  id: string
  label: string
  /** 字前面的图标。 */
  icon?: ReactNode
  /** 字后面的数量（子项数、命中数），等宽数字。 */
  count?: number
  disabled?: boolean
  /** 有子项（包括空数组以外的）就能展开。 */
  children?: readonly TreeNode[]
}

export type TreeViewProps = {
  items: readonly TreeNode[]
  /** 整棵树的读屏名。 */
  label: string
  /** 选择方式，默认单选；none 只展开收起，点行不选。 */
  selectionMode?: 'none' | 'single' | 'multiple'
  /** 选中的 id（受控）。 */
  value?: readonly string[]
  /** 选中的 id 初值（不受控）。 */
  defaultValue?: readonly string[]
  /** 选中变了：给出整份 id。 */
  onValueChange?: (value: string[]) => void
  /** @deprecated Use `value`; kept for one version. */
  selectedKeys?: readonly string[]
  /** @deprecated Use `defaultValue`; kept for one version. */
  defaultSelectedKeys?: readonly string[]
  /** @deprecated Use `onValueChange`; kept for one version. */
  onSelectionChange?: (keys: string[]) => void
  expandedKeys?: readonly string[]
  defaultExpandedKeys?: readonly string[]
  onExpandedChange?: (keys: string[]) => void
  /** 双击或按 Enter 激活一行（打开这个数据集之类）。给了它，点行是「选中这一行」（多选要按 Ctrl / Shift）；不给，点行是「切换选中」。 */
  onAction?: (id: string) => void
  className?: string
}

const only = (event: { target: EventTarget; currentTarget: EventTarget }) => event.target === event.currentTarget

function renderNode(node: TreeNode, onAction?: (id: string) => void) {
  const hasChildren = (node.children?.length ?? 0) > 0
  return (
    <TreeItem
      key={node.id}
      value={node.id}
      label={node.label}
      disabled={node.disabled}
      className="k-tree-item"
      // 双击或 Enter「激活」这一行（UI SDK 自己的 onAction 单击就触发，不合我们的约定）；子项的事件会冒上来，只认本行。
      onKeyDown={(event) => {
        if (!only(event)) return
        // Enter 只激活，不选中（给了 onAction 时；迁移前的 react-aria 是这样，UI SDK 的 Enter 还会选中，所以拦下它自己的那份）。
        if (event.key === 'Enter' && onAction && !node.disabled) {
          event.preventDefault()
          onAction(node.id)
        }
        // → 在已展开的分支上不动（迁移前的写法；UI SDK 照 APG 会走进第一个子项）。写在项上：UI SDK 的方向键在项上处理，根上的拦不住。
        if (event.key === 'ArrowRight' && hasChildren && event.currentTarget.getAttribute('aria-expanded') === 'true')
          event.preventDefault()
      }}
    >
      <TreeItemLabel
        className="k-tree-row"
        onDoubleClick={onAction ? () => !node.disabled && onAction(node.id) : undefined}
      >
        {hasChildren ? (
          <TreeItemIndicator className="k-tree-chevron">
            <ChevronRight size={14} aria-hidden />
          </TreeItemIndicator>
        ) : (
          <span className="k-tree-chevron" aria-hidden="true" />
        )}
        {node.icon && <span className="k-tree-icon">{node.icon}</span>}
        <span className="k-tree-label">{node.label}</span>
        {node.count !== undefined && <span className="k-tree-count">{node.count}</span>}
      </TreeItemLabel>
      {hasChildren && <TreeGroup>{node.children!.map((child) => renderNode(child, onAction))}</TreeGroup>}
    </TreeItem>
  )
}

export function TreeView({
  items,
  label,
  selectionMode = 'single',
  selectedKeys,
  defaultSelectedKeys,
  onSelectionChange,
  value = selectedKeys,
  defaultValue = defaultSelectedKeys,
  onValueChange = onSelectionChange,
  expandedKeys,
  defaultExpandedKeys,
  onExpandedChange,
  onAction,
  className,
}: TreeViewProps) {
  // UI SDK 的值：单选是一个 id 或 null，多选是 id 数组，none 没有值；对外一律是 id 数组。
  const single = (ids: readonly string[]) => ids[0] ?? null
  const shape = (ids: readonly string[]) => (selectionMode === 'multiple' ? [...ids] : single(ids))
  const common = {
    'aria-label': label,
    className: cn('k-tree', className),
    // 点行是选中这一行；展开收起交给箭头与方向键（原来就是这样，UI SDK 默认点分支也展开）。
    expandOnPress: false,
    // 禁用的行不接焦点（迁移前的 react-aria 方向键跳过它；UI SDK 默认让它们留在路上）。
    focusableWhenDisabled: false,
    activation: onAction ? ('automatic' as const) : ('manual' as const),
    expanded: expandedKeys ? [...expandedKeys] : undefined,
    defaultExpanded: defaultExpandedKeys ? [...defaultExpandedKeys] : undefined,
    onExpandedChange: onExpandedChange ? (keys: string[]) => onExpandedChange(keys) : undefined,
    children: items.map((node) => renderNode(node, onAction)),
  }
  const toIds = (next: string | string[] | null) => (next === null ? [] : Array.isArray(next) ? next : [next])
  if (selectionMode === 'multiple')
    return (
      <Tree
        {...common}
        mode="multiple"
        value={value ? [...value] : undefined}
        defaultValue={defaultValue ? [...defaultValue] : undefined}
        onValueChange={onValueChange ? (next) => onValueChange(toIds(next)) : undefined}
      />
    )
  if (selectionMode === 'none') return <Tree {...common} mode="none" />
  return (
    <Tree
      {...common}
      value={value ? (shape(value) as string | null) : undefined}
      defaultValue={defaultValue ? (shape(defaultValue) as string | null) : undefined}
      onValueChange={onValueChange ? (next) => onValueChange(toIds(next)) : undefined}
    />
  )
}
