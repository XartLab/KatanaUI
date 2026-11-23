// SPDX-License-Identifier: MIT
// 改自 SmoothUI file-tree（https://github.com/educlopez/smoothui ，MIT，© 2024 Eduardo Calvo）
import { ChevronRight, File, Folder, FolderOpen } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { cn } from '../lib/cn.ts'
import { focusRingInset } from '../lib/focus.ts'
import { snappy } from '../lib/motion.ts'

// 文件树：策略目录、回测产物、数据集这类有文件夹也有文件的层级（纯分类的树用 TreeView）。
// 跟 TreeView 的分工：这里行首是文件夹 / 文件图标，行尾可挂徽标（改动状态、大小），文件夹展开时子级高度弹出来、箭头转 90 度（原件的 height + rotate 弹簧，弹簧换我们的 snappy），
// 可画纵向引导线。键盘按 WAI-ARIA tree：↑ ↓ 走、→ 展开 / 进入、← 收起 / 回父级、Home / End、Enter 与 Space 选中。文字全由调用方传。

export type FileTreeItem = {
  id: string
  /** Shown name; also the typed-ahead text. */
  name: string
  type: 'file' | 'folder'
  /** Only folders have children. */
  children?: readonly FileTreeItem[]
  /** Replaces the default folder / file icon. */
  icon?: ReactNode
  /** Shown at the end of the row, e.g. a change mark or a size. */
  badge?: ReactNode
}

export type FileTreeProps = {
  /** The entries to show. */
  items: readonly FileTreeItem[]
  /** What screen readers call this tree (required). */
  label: string
  /** Folder ids expanded at first (uncontrolled). */
  defaultExpanded?: readonly string[]
  /** Folder ids expanded now (controlled). */
  expanded?: readonly string[]
  /** Called with the expanded folder ids when they change. */
  onExpandedChange?: (expanded: string[]) => void
  /** Selected item id (controlled). */
  selected?: string
  /** Called with the id of the row the user picked. */
  onSelectedChange?: (id: string) => void
  /** Indent per level in px. */
  indent?: number
  /** Draw a vertical guide line for each nested level. */
  showLines?: boolean
  /** Extra classes for the root element. */
  className?: string
}

type Flat = { item: FileTreeItem; level: number; parentId: string | null }

const isOpenable = (item: FileTreeItem) => item.type === 'folder' && (item.children?.length ?? 0) > 0

function flatten(
  nodes: readonly FileTreeItem[],
  open: ReadonlySet<string>,
  level: number,
  parentId: string | null,
): Flat[] {
  return nodes.flatMap((item) => [
    { item, level, parentId },
    ...(isOpenable(item) && open.has(item.id) ? flatten(item.children!, open, level + 1, item.id) : []),
  ])
}

type RowProps = {
  node: FileTreeItem
  level: number
  indent: number
  showLines: boolean
  open: ReadonlySet<string>
  selectedId: string | undefined
  focusedId: string | undefined
  toggle: (id: string) => void
  select: (id: string) => void
  onKeyDown: (event: KeyboardEvent<HTMLDivElement>, id: string) => void
  register: (id: string, el: HTMLDivElement | null) => void
}

function Row(props: RowProps) {
  const { node, level, indent, showLines, open, selectedId, focusedId, toggle, select, onKeyDown, register } = props
  const folder = node.type === 'folder'
  const isOpen = isOpenable(node) && open.has(node.id)
  const selected = selectedId === node.id
  const icon =
    node.icon ??
    (folder ? (
      isOpen ? (
        <FolderOpen size={14} className="text-(--accent)" />
      ) : (
        <Folder size={14} className="text-(--accent)" />
      )
    ) : (
      <File size={14} className={selected ? 'text-ink' : 'text-ink-3'} />
    ))
  return (
    <div role="none">
      <div
        ref={(el) => register(node.id, el)}
        role="treeitem"
        aria-level={level + 1}
        aria-expanded={folder ? isOpen : undefined}
        aria-selected={selected}
        tabIndex={focusedId === node.id ? 0 : -1}
        data-slot="file-tree-row"
        className={cn(
          'k-text-body flex h-[26px] cursor-pointer items-center gap-1.5 rounded-[6px] pr-2 text-ink-2 select-none',
          'transition-colors duration-100',
          selected ? 'bg-alpha-white-6 text-ink' : 'hover:bg-alpha-white-3',
          focusRingInset,
        )}
        style={{ paddingLeft: 4 + level * indent }}
        onClick={() => {
          select(node.id)
          if (folder) toggle(node.id)
        }}
        onKeyDown={(event) => onKeyDown(event, node.id)}
      >
        <span className="flex size-4 shrink-0 items-center justify-center">
          {folder ? (
            <motion.span animate={{ rotate: isOpen ? 90 : 0 }} transition={snappy} className="flex text-ink-3">
              <ChevronRight size={13} />
            </motion.span>
          ) : null}
        </span>
        <span className="flex shrink-0 items-center">{icon}</span>
        <span className="min-w-0 flex-1 truncate">{node.name}</span>
        {node.badge ? <span className="k-text-micro shrink-0 text-ink-3 tabular-nums">{node.badge}</span> : null}
      </div>
      <AnimatePresence initial={false}>
        {isOpen ? (
          <motion.div
            key="children"
            role="group"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ ...snappy, restDelta: 0.001 }}
            className="relative overflow-hidden"
          >
            {showLines ? (
              <span
                aria-hidden="true"
                className="absolute top-0 bottom-0 w-px bg-line"
                style={{ left: 4 + level * indent + 8 }}
              />
            ) : null}
            {node.children!.map((child) => (
              <Row key={child.id} {...props} node={child} level={level + 1} />
            ))}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

export function FileTree({
  items,
  label,
  defaultExpanded = [],
  expanded,
  onExpandedChange,
  selected,
  onSelectedChange,
  indent = 14,
  showLines = true,
  className,
}: FileTreeProps) {
  const [innerOpen, setInnerOpen] = useState<readonly string[]>(defaultExpanded)
  const [innerSelected, setInnerSelected] = useState<string | undefined>(undefined)
  const [focused, setFocused] = useState<string | undefined>(undefined)
  const rows = useRef(new Map<string, HTMLDivElement>())
  const openIds = expanded ?? innerOpen
  const open = useMemo(() => new Set(openIds), [openIds])
  const selectedId = selected ?? innerSelected
  const flat = useMemo(() => flatten(items, open, 0, null), [items, open])
  const focusedId =
    focused && flat.some((entry) => entry.item.id === focused) ? focused : (selectedId ?? flat[0]?.item.id)

  const setOpen = (next: string[]) => {
    setInnerOpen(next)
    onExpandedChange?.(next)
  }
  const toggle = (id: string, force?: boolean) => {
    const isOpen = open.has(id)
    const want = force ?? !isOpen
    if (want === isOpen) return
    setOpen(want ? [...openIds, id] : openIds.filter((x) => x !== id))
  }
  const select = (id: string) => {
    setInnerSelected(id)
    setFocused(id)
    onSelectedChange?.(id)
  }
  const focusRow = (id: string | undefined) => {
    if (!id) return
    setFocused(id)
    rows.current.get(id)?.focus()
  }
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>, id: string) => {
    const index = flat.findIndex((entry) => entry.item.id === id)
    const entry = flat[index]
    if (!entry) return
    const { item, parentId } = entry
    const go = (target: string | undefined) => {
      event.preventDefault()
      focusRow(target)
    }
    switch (event.key) {
      case 'ArrowDown':
        return go(flat[index + 1]?.item.id)
      case 'ArrowUp':
        return go(flat[index - 1]?.item.id)
      case 'Home':
        return go(flat[0]?.item.id)
      case 'End':
        return go(flat.at(-1)?.item.id)
      case 'ArrowRight':
        if (isOpenable(item)) {
          if (!open.has(id)) {
            event.preventDefault()
            toggle(id, true)
          } else go(item.children![0]?.id)
        }
        return
      case 'ArrowLeft':
        if (isOpenable(item) && open.has(id)) {
          event.preventDefault()
          toggle(id, false)
        } else if (parentId) go(parentId)
        return
      case 'Enter':
      case ' ':
        event.preventDefault()
        select(id)
        if (item.type === 'folder') toggle(id)
    }
  }

  return (
    <div role="tree" aria-label={label} data-slot="file-tree" className={cn('flex flex-col gap-px', className)}>
      {items.map((node) => (
        <Row
          key={node.id}
          node={node}
          level={0}
          indent={indent}
          showLines={showLines}
          open={open}
          selectedId={selectedId}
          focusedId={focusedId}
          toggle={toggle}
          select={select}
          onKeyDown={onKeyDown}
          register={(rid, el) => {
            if (el) rows.current.set(rid, el)
            else rows.current.delete(rid)
          }}
        />
      ))}
    </div>
  )
}
