// SPDX-License-Identifier: MIT
import { ChevronRight } from 'lucide-react'
import type { CSSProperties, ReactNode } from 'react'
import {
  Button as AriaButton,
  Collection,
  Tree,
  TreeItem,
  TreeItemContent,
  type Selection,
} from 'react-aria-components'
import { cn } from '../lib/cn'

// 功能参照 Arc Tree view（uiarc.dev，2026-11-14 读：可展开收起的层级列表），实现原创；外观在 theme/tree-view.css。
// 用途：数据集目录、品种分类树（DatasetCatalog 的缺口）。行为底座是 react-aria-components 的 Tree（treegrid 角色、方向键 ↑↓ 走、→ 展开 / 进子级、← 收起 / 回父级、
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
  selectedKeys?: readonly string[]
  defaultSelectedKeys?: readonly string[]
  onSelectionChange?: (keys: string[]) => void
  expandedKeys?: readonly string[]
  defaultExpandedKeys?: readonly string[]
  onExpandedChange?: (keys: string[]) => void
  /** 双击或按 Enter 激活一行（打开这个数据集之类）。给了它，点行是「选中这一行」（多选要按 Ctrl / Shift）；不给，点行是「切换选中」。 */
  onAction?: (id: string) => void
  className?: string
}

const toKeys = (keys: Selection | Set<unknown>): string[] => (keys === 'all' ? [] : [...keys].map(String))

function renderNode(node: TreeNode, onAction?: (id: string) => void) {
  const hasChildren = (node.children?.length ?? 0) > 0
  return (
    <TreeItem
      id={node.id}
      textValue={node.label}
      isDisabled={node.disabled}
      hasChildItems={hasChildren}
      className="k-tree-item"
      onAction={onAction ? () => onAction(node.id) : undefined}
    >
      <TreeItemContent>
        {({ isExpanded, level }) => (
          <div
            className="k-tree-row"
            data-expanded={isExpanded || undefined}
            style={{ '--k-tree-level': level - 1 } as CSSProperties}
          >
            {hasChildren ? (
              <AriaButton slot="chevron" className="k-tree-chevron">
                <ChevronRight size={14} aria-hidden />
              </AriaButton>
            ) : (
              <span className="k-tree-chevron" aria-hidden="true" />
            )}
            {node.icon && <span className="k-tree-icon">{node.icon}</span>}
            <span className="k-tree-label">{node.label}</span>
            {node.count !== undefined && <span className="k-tree-count">{node.count}</span>}
          </div>
        )}
      </TreeItemContent>
      <Collection items={node.children ?? []}>{(child) => renderNode(child, onAction)}</Collection>
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
  expandedKeys,
  defaultExpandedKeys,
  onExpandedChange,
  onAction,
  className,
}: TreeViewProps) {
  return (
    <Tree
      aria-label={label}
      className={cn('k-tree', className)}
      items={items}
      dependencies={[onAction]}
      selectionMode={selectionMode}
      selectionBehavior={onAction ? 'replace' : 'toggle'}
      selectedKeys={selectedKeys ? new Set(selectedKeys) : undefined}
      defaultSelectedKeys={defaultSelectedKeys ? new Set(defaultSelectedKeys) : undefined}
      onSelectionChange={onSelectionChange ? (keys) => onSelectionChange(toKeys(keys)) : undefined}
      expandedKeys={expandedKeys ? new Set(expandedKeys) : undefined}
      defaultExpandedKeys={defaultExpandedKeys ? new Set(defaultExpandedKeys) : undefined}
      onExpandedChange={onExpandedChange ? (keys) => onExpandedChange(toKeys(keys)) : undefined}
    >
      {(node) => renderNode(node, onAction)}
    </Tree>
  )
}
