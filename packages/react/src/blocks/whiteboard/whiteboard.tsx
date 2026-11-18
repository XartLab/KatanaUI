// SPDX-License-Identifier: MIT
/**
 * Whiteboard: a controlled node-and-edge canvas on React Flow (notes, groups, metrics, cards, hypotheses), serialised as plain JSON.
 * 白板（#51）：研究面板的传导链、KATANAview #319「白板推演」共用的一块画布。
 * 底座 @xyflow/react（React Flow，MIT，https://github.com/xyflow/xyflow ，Copyright (c) 2019-2025 webkid GmbH）：画布、平移缩放、连线、框选、
 * 小地图、键盘移动节点都是它的；右键菜单的做法照它的 Context Menu 示例（MIT），菜单本身用我们的 ContextMenu。
 * 撤销重做、复制粘贴、辅助线吸附在 React Flow 官网是 Pro 示例（xyflow Pro License），没抄，自己写在 whiteboard-model.ts。
 * 受控：nodes / edges 由调用方给，每次改动 onChange 回整份新文档；选中、量到的尺寸、撤销历史是件内的界面状态，不进文档。
 */
import {
  Background,
  BackgroundVariant,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  ViewportPortal,
  useReactFlow,
  type Connection,
  type EdgeChangeset,
  type Node,
  type NodeChangeset,
} from '@xyflow/react'
import {
  ArrowDownFromLine,
  ArrowRightFromLine,
  ClipboardPaste,
  Copy,
  Map as MapIcon,
  Maximize,
  Redo2,
  StickyNote,
  Trash2,
  Undo2,
  GitBranch,
} from 'lucide-react'
import {
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from 'react'
import { cn } from '../../lib/cn.ts'
import { ContextMenu, ContextMenuContent, ContextMenuTrigger } from '../../primitives/context-menu.tsx'
import { RowActionMenuItems, type RowAction } from '../../quotes/row-actions.tsx'
import { Toolbar, ToolbarGroup, ToolButton, ToolSlot } from '../toolbar/toolbar.tsx'
import type { ChainStatus } from '../transmission-chain/transmission-chain-model.ts'
import {
  DEFAULT_SIZE,
  copySelection,
  getDownstream,
  layoutWhiteboard,
  parentsFirst,
  pasteClip,
  pushHistory,
  redoHistory,
  removeItems,
  snapToGuides,
  undoHistory,
  validEdges,
  type History,
  type WhiteboardCardNode,
  type WhiteboardClip,
  type WhiteboardDirection,
  type WhiteboardDoc,
  type WhiteboardEdge,
  type WhiteboardNode,
  type WhiteboardPoint,
} from './whiteboard-model.ts'
import {
  BoardCtx,
  EDGE_TYPES,
  NODE_TYPES,
  type BoardContext,
  type RfEdge,
  type WhiteboardLabels,
} from './whiteboard-nodes.tsx'

export type { WhiteboardLabels } from './whiteboard-nodes.tsx'

export type WhiteboardProps = {
  nodes: readonly WhiteboardNode[]
  edges: readonly WhiteboardEdge[]
  /** 每次改动（拖动、连线、删除、粘贴、布局、改字、撤销重做）回整份新文档；拖动中逐帧回，松手时记一步历史。 */
  onChange: (doc: WhiteboardDoc) => void
  labels: WhiteboardLabels
  /** 卡片节点的插槽里画什么。 */
  renderCard?: (node: WhiteboardCardNode) => ReactNode
  /** 选中变化（节点 id 列表）。 */
  onSelectionChange?: (nodeIds: string[]) => void
  /** 连接点朝向（文档的 layout，受控）：TB 从上到下（缺省）、LR 从左到右；点自动布局时随 onChange 回新值。 */
  layout?: WhiteboardDirection
  /** 小地图起始开着没有，默认关。 */
  defaultMinimap?: boolean
  className?: string
}

const STATUSES: readonly (ChainStatus | 'plain')[] = ['plain', 'supported', 'partial', 'contradicted', 'untested']
const PASTE_STEP = 32
/** 适应窗口时四周留白；上面多留出工具条的高度（36px），免得工具条盖住节点。 */
const FIT_PADDING = { top: '52px', right: '24px', bottom: '24px', left: '24px' } as const
const isMod = (event: KeyboardEvent) => event.metaKey || event.ctrlKey

type Rect = { x: number; y: number; width: number; height: number }

export function Whiteboard(props: WhiteboardProps) {
  return (
    <ReactFlowProvider>
      <Board {...props} />
    </ReactFlowProvider>
  )
}

function Board({
  nodes,
  edges,
  onChange,
  labels,
  renderCard,
  onSelectionChange,
  layout = 'TB',
  defaultMinimap = false,
  className,
}: WhiteboardProps) {
  const flow = useReactFlow()
  const uid = useId().replaceAll(':', '')
  const doc = useMemo<WhiteboardDoc>(
    () => ({ nodes: [...nodes], edges: validEdges({ nodes: [...nodes], edges: [...edges] }), layout }),
    [nodes, edges, layout],
  )
  // 最新的文档：调用方还没把上一次 onChange 送回来时（同一拍里的连续改动），以它为底。
  const latest = useRef(doc)
  useLayoutEffect(() => {
    latest.current = doc
  }, [doc])

  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set())
  const [selectedEdges, setSelectedEdges] = useState<ReadonlySet<string>>(new Set())
  const [anchor, setAnchor] = useState<string | null>(null)
  const [measured, setMeasured] = useState<ReadonlyMap<string, { width?: number; height?: number }>>(new Map())
  const direction = layout
  const [minimap, setMinimap] = useState(defaultMinimap)
  const [guides, setGuides] = useState<{ x?: number; y?: number }>({})
  // 历史放 ref 给事件处理读最新的，另存一份 state 给按钮的可用与否。
  const history = useRef<History>({ past: [], future: [] })
  const [shownHistory, setShownHistory] = useState<History>({ past: [], future: [] })
  const setHistory = (next: History) => {
    history.current = next
    setShownHistory(next)
  }
  const [hasClip, setHasClip] = useState(false)
  const before = useRef<WhiteboardDoc | null>(null)
  const clip = useRef<{ data: WhiteboardClip; pastes: number } | null>(null)
  const pointer = useRef<WhiteboardPoint | null>(null)
  const [menuTarget, setMenuTarget] = useState<{ kind: 'pane' | 'node' | 'edge'; id: string }>({ kind: 'pane', id: '' })

  const emit = (next: WhiteboardDoc, record?: WhiteboardDoc) => {
    if (record) {
      setHistory(pushHistory(history.current, record))
    }
    latest.current = next
    onChange(next)
  }
  const commit = (next: WhiteboardDoc) => emit(next, latest.current)

  const select = (ids: Iterable<string>, anchorId: string | null = null) => {
    const set = new Set(ids)
    setSelected(set)
    setSelectedEdges(new Set())
    setAnchor(anchorId ?? (set.size === 1 ? [...set][0]! : null))
    onSelectionChange?.([...set])
  }

  const uniqueId = (base: string) => {
    const taken = new Set([...latest.current.nodes.map((n) => n.id), ...latest.current.edges.map((e) => e.id)])
    let i = 1
    while (taken.has(`${base}-${i}`)) i += 1
    return `${base}-${i}`
  }

  const downstream = useMemo(
    () => (anchor && doc.nodes.some((n) => n.id === anchor) ? getDownstream(doc.edges, anchor) : null),
    [anchor, doc],
  )

  const sizeOf = (node: WhiteboardNode) => {
    const m = measured.get(node.id)
    return {
      width: node.width ?? m?.width ?? DEFAULT_SIZE[node.type].width,
      height: node.height ?? m?.height ?? DEFAULT_SIZE[node.type].height,
    }
  }

  const rfNodes = useMemo(
    () =>
      parentsFirst(doc.nodes).map(
        (n): Node =>
          ({
            id: n.id,
            type: n.type,
            position: n.position,
            data: n.data,
            width: n.width,
            height: n.height,
            parentId: n.parentId,
            selected: selected.has(n.id),
            measured: measured.get(n.id),
            zIndex: n.type === 'group' ? -1 : undefined,
            ariaLabel: n.type === 'note' ? n.data.text : n.data.title,
          }) as Node,
      ),
    [doc, selected, measured],
  )
  const rfEdges = useMemo(
    () =>
      doc.edges.map((e): RfEdge => ({
        id: e.id,
        type: 'board',
        source: e.source,
        target: e.target,
        selected: selectedEdges.has(e.id),
        data: { status: e.status, feedback: e.feedback, label: e.label },
      })),
    [doc, selectedEdges],
  )

  const onNodesChange = (changes: NodeChangeset<Node>) => {
    const list = changes.toArray()
    const cur = latest.current
    const byId = new Map(cur.nodes.map((n) => [n.id, n]))
    const moves = list.filter((c) => c.type === 'position' && c.position)
    // 辅助线吸附：只拖一个顶层节点时，贴别的顶层节点的边与中线。
    const dragging = moves.filter((c) => c.type === 'position' && c.dragging)
    if (dragging.length === 1 && dragging[0]!.type === 'position') {
      const change = dragging[0]
      const node = byId.get(change.id)
      if (node && !node.parentId && change.position) {
        const size = sizeOf(node)
        const others: Rect[] = cur.nodes
          .filter((n) => n.id !== node.id && !n.parentId && n.type !== 'group')
          .map((n) => ({ ...n.position, ...sizeOf(n) }))
        const snap = snapToGuides({ ...change.position, ...size }, others)
        change.position = { x: snap.x, y: snap.y }
        setGuides({ x: snap.guideX, y: snap.guideY })
      }
    } else if (guides.x !== undefined || guides.y !== undefined) setGuides({})

    const pos = new Map<string, WhiteboardPoint>()
    const size = new Map<string, { width?: number; height?: number }>()
    const dims = new Map<string, { width?: number; height?: number }>()
    let sel: Set<string> | null = null
    let resizeEnded = false
    for (const c of list) {
      if (c.type === 'position' && c.position) pos.set(c.id, c.position)
      if (c.type === 'dimensions' && c.dimensions) {
        dims.set(c.id, c.dimensions)
        if (c.resizing !== undefined || c.setAttributes) {
          size.set(c.id, c.dimensions)
          if (c.resizing && !before.current) before.current = cur
          if (c.resizing === false) resizeEnded = true
        }
      }
      if (c.type === 'select') {
        sel ??= new Set(selected)
        if (c.selected) sel.add(c.id)
        else sel.delete(c.id)
      }
    }
    if (dims.size) setMeasured((m) => new Map([...m, ...dims]))
    if (sel) {
      const next = sel
      setSelected(next)
      setAnchor((a) => (next.size === 1 ? [...next][0]! : a && next.has(a) ? a : null))
      onSelectionChange?.([...next])
    }
    if (pos.size || size.size) {
      const next: WhiteboardDoc = {
        ...cur,
        nodes: cur.nodes.map((n) => {
          const p = pos.get(n.id)
          const s = size.get(n.id)
          if (!p && !s) return n
          return {
            ...n,
            ...(p ? { position: { x: Math.round(p.x), y: Math.round(p.y) } } : null),
            ...(s
              ? { width: Math.round(s.width ?? n.width ?? 0), height: Math.round(s.height ?? n.height ?? 0) }
              : null),
          }
        }),
      }
      // 拖动与拖角改大小在开始时记下了 before，松手时记一步；其余（键盘方向键挪节点）一下记一步。
      if (resizeEnded && before.current) {
        emit(next, before.current)
        before.current = null
      } else emit(next, before.current ? undefined : cur)
    }
  }

  const onEdgesChange = (changes: EdgeChangeset<RfEdge>) => {
    let sel: Set<string> | null = null
    for (const c of changes.toArray())
      if (c.type === 'select') {
        sel ??= new Set(selectedEdges)
        if (c.selected) sel.add(c.id)
        else sel.delete(c.id)
      }
    if (sel) setSelectedEdges(sel)
  }

  const dragStart = () => {
    before.current = latest.current
  }
  const dragStop = () => {
    setGuides({})
    if (before.current && before.current !== latest.current) {
      setHistory(pushHistory(history.current, before.current))
    }
    before.current = null
  }

  const onConnect = (c: Connection) => {
    if (!c.source || !c.target || c.source === c.target) return
    const cur = latest.current
    commit({
      ...cur,
      edges: [...cur.edges, { id: uniqueId(`e-${c.source}-${c.target}`), source: c.source, target: c.target }],
    })
  }

  const undo = () => {
    const r = undoHistory(history.current, latest.current)
    if (!r) return
    setHistory(r.history)
    emit(r.doc)
  }
  const redo = () => {
    const r = redoHistory(history.current, latest.current)
    if (!r) return
    setHistory(r.history)
    emit(r.doc)
  }
  const removeSelected = (nodeIds: ReadonlySet<string> = selected, edgeIds: ReadonlySet<string> = selectedEdges) => {
    if (!nodeIds.size && !edgeIds.size) return
    commit(removeItems(latest.current, nodeIds, edgeIds))
    select([])
  }
  const copy = (ids: ReadonlySet<string> = selected) => {
    if (!ids.size) return
    clip.current = { data: copySelection(latest.current, ids), pastes: 0 }
    setHasClip(true)
  }
  const paste = (at?: WhiteboardPoint) => {
    const c = clip.current
    if (!c || !c.data.nodes.length) return
    c.pastes += 1
    const top = c.data.nodes.filter((n) => !n.parentId || !c.data.nodes.some((p) => p.id === n.parentId))
    const left = Math.min(...top.map((n) => n.position.x))
    const upper = Math.min(...top.map((n) => n.position.y))
    const offset = at ? { x: at.x - left, y: at.y - upper } : { x: PASTE_STEP * c.pastes, y: PASTE_STEP * c.pastes }
    const made = new Set<string>()
    const r = pasteClip(latest.current, c.data, offset, (old) => {
      let id = uniqueId(old.replace(/-\d+$/, ''))
      while (made.has(id)) id = `${id}x`
      made.add(id)
      return id
    })
    commit(r.doc)
    select(r.ids)
  }
  const duplicate = (id: string) => {
    copy(new Set([id]))
    paste()
  }
  const addNote = (at: WhiteboardPoint) => {
    const id = uniqueId('note')
    const cur = latest.current
    commit({
      ...cur,
      nodes: [
        ...cur.nodes,
        { id, type: 'note', position: { x: Math.round(at.x), y: Math.round(at.y) }, data: { text: labels.newNote } },
      ],
    })
    select([id])
  }
  const fit = () => void flow.fitView({ padding: FIT_PADDING, duration: 0 })
  const relayout = (dir: WhiteboardDirection) => {
    commit(layoutWhiteboard(latest.current, dir, sizeOf))
    requestAnimationFrame(() => fit())
  }
  const selectDownstream = (id: string) => {
    const down = getDownstream(latest.current.edges, id)
    select([id, ...down.nodes], id)
  }
  const updateData = (id: string, data: Record<string, unknown>) => {
    const cur = latest.current
    commit({
      ...cur,
      nodes: cur.nodes.map((n) => (n.id === id ? ({ ...n, data: { ...n.data, ...data } } as WhiteboardNode) : n)),
    })
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement
    if (target.closest('input, textarea, [contenteditable="true"], [role="menu"]')) return
    const key = event.key.toLowerCase()
    if (isMod(event) && key === 'z') {
      if (event.shiftKey) redo()
      else undo()
    } else if (isMod(event) && key === 'y') redo()
    else if (isMod(event) && key === 'c') copy()
    else if (isMod(event) && key === 'v') paste()
    else if (isMod(event) && key === 'd') {
      copy()
      paste()
    } else if (key === 'delete' || key === 'backspace') removeSelected()
    else return
    event.preventDefault()
  }

  // 右键菜单：落在节点、边的标签、边上，还是空白处；菜单键与 Shift+F10 在聚焦的节点上也开（照 RowContextMenu）。
  const onContextMenu = (event: MouseEvent<HTMLDivElement>) => {
    const el = event.target as Element
    pointer.current = flow.screenToFlowPosition({ x: event.clientX, y: event.clientY })
    const node = el.closest<HTMLElement>('.react-flow__node')?.dataset.id
    const edge =
      el.closest<HTMLElement>('[data-wb-edge]')?.dataset.wbEdge ??
      el.closest<HTMLElement>('.react-flow__edge')?.dataset.id
    if (node) {
      setMenuTarget({ kind: 'node', id: node })
      if (!selected.has(node)) select([node])
    } else if (edge) setMenuTarget({ kind: 'edge', id: edge })
    else setMenuTarget({ kind: 'pane', id: '' })
  }
  const onMenuKey = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!(event.key === 'ContextMenu' || (event.key === 'F10' && event.shiftKey))) return onKeyDown(event)
    const el = (event.target as Element).closest<HTMLElement>('.react-flow__node, .react-flow__edge')
    if (!el) return
    event.preventDefault()
    const box = el.getBoundingClientRect()
    el.dispatchEvent(
      new globalThis.MouseEvent('contextmenu', {
        bubbles: true,
        cancelable: true,
        clientX: box.left + Math.min(24, box.width / 2),
        clientY: box.bottom,
      }),
    )
  }
  const at = () => pointer.current ?? { x: 0, y: 0 }
  const menuItems: RowAction[] =
    menuTarget.kind === 'node'
      ? [
          {
            key: 'duplicate',
            label: labels.duplicate,
            icon: <Copy aria-hidden />,
            onSelect: () => duplicate(menuTarget.id),
          },
          { key: 'copy', label: labels.copy, icon: <Copy aria-hidden />, onSelect: () => copy() },
          {
            key: 'downstream',
            label: labels.selectDownstream,
            icon: <GitBranch aria-hidden />,
            onSelect: () => selectDownstream(menuTarget.id),
          },
          {
            key: 'delete',
            label: labels.delete,
            icon: <Trash2 aria-hidden />,
            onSelect: () => removeSelected(new Set([...selected, menuTarget.id])),
          },
        ]
      : menuTarget.kind === 'edge'
        ? [
            {
              key: 'delete',
              label: labels.delete,
              icon: <Trash2 aria-hidden />,
              onSelect: () => removeSelected(new Set(), new Set([menuTarget.id])),
            },
          ]
        : [
            { key: 'add-note', label: labels.addNote, icon: <StickyNote aria-hidden />, onSelect: () => addNote(at()) },
            {
              key: 'paste',
              label: labels.paste,
              icon: <ClipboardPaste aria-hidden />,
              disabled: !hasClip,
              onSelect: () => paste(at()),
            },
            {
              key: 'layout-tb',
              label: labels.layoutTB,
              icon: <ArrowDownFromLine aria-hidden />,
              onSelect: () => relayout('TB'),
            },
            {
              key: 'layout-lr',
              label: labels.layoutLR,
              icon: <ArrowRightFromLine aria-hidden />,
              onSelect: () => relayout('LR'),
            },
            { key: 'fit', label: labels.fit, icon: <Maximize aria-hidden />, onSelect: fit },
          ]

  const markerId = (status: ChainStatus | 'plain') => `k-wb-${uid}-arrow-${status}`
  const ctx: BoardContext = {
    labels,
    direction,
    markerId,
    renderCard,
    updateData,
    duplicate,
    remove: (id) => removeSelected(new Set([id]), new Set()),
    selectDownstream,
    downstream: downstream && (downstream.nodes.size || downstream.edges.size) ? downstream : null,
  }

  return (
    <BoardCtx value={ctx}>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            className={cn('k-wb', className)}
            role="group"
            aria-label={labels.board}
            data-testid="wb"
            data-direction={direction}
            tabIndex={-1}
            onContextMenu={onContextMenu}
            onKeyDown={onMenuKey}
            onPointerDown={(event) => {
              // 画布的拖拽会拦下默认的聚焦：点进来时把焦点收进件里，快捷键（撤销、粘贴……）才收得到。
              const host = event.currentTarget
              if (!host.contains(document.activeElement)) host.focus({ preventScroll: true })
            }}
          >
            <svg className="k-wb-defs" width="0" height="0" aria-hidden>
              <defs>
                {STATUSES.map((status) => (
                  <marker
                    key={status}
                    id={markerId(status)}
                    className="k-wb-arrow"
                    data-status={status}
                    viewBox="0 0 10 10"
                    refX="9"
                    refY="5"
                    markerWidth="9"
                    markerHeight="9"
                    markerUnits="userSpaceOnUse"
                    orient="auto-start-reverse"
                  >
                    <path d="M0,1 L10,5 L0,9 z" />
                  </marker>
                ))}
              </defs>
            </svg>
            <ReactFlow
              nodes={rfNodes}
              edges={rfEdges}
              nodeTypes={NODE_TYPES}
              edgeTypes={EDGE_TYPES}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeDragStart={dragStart}
              onNodeDragStop={dragStop}
              onSelectionDragStart={dragStart}
              onSelectionDragStop={dragStop}
              deleteKeyCode={null}
              fitView
              fitViewOptions={{ padding: FIT_PADDING }}
              minZoom={0.2}
              maxZoom={3}
              proOptions={{ hideAttribution: true }}
            >
              <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
              {minimap ? <MiniMap pannable zoomable ariaLabel={labels.minimap} /> : null}
              <ViewportPortal>
                {guides.x !== undefined ? (
                  <i className="k-wb-guide is-v" style={{ transform: `translate(${guides.x}px, -50000px)` }} />
                ) : null}
                {guides.y !== undefined ? (
                  <i className="k-wb-guide is-h" style={{ transform: `translate(-50000px, ${guides.y}px)` }} />
                ) : null}
              </ViewportPortal>
            </ReactFlow>
            <Toolbar label={labels.toolbar} className="k-wb-toolbar">
              <ToolbarGroup side="left">
                <ToolSlot tool="undo">
                  <ToolButton label={labels.undo} keys="Ctrl+Z" disabled={!shownHistory.past.length} onClick={undo}>
                    <Undo2 aria-hidden />
                  </ToolButton>
                </ToolSlot>
                <ToolSlot tool="redo">
                  <ToolButton
                    label={labels.redo}
                    keys="Ctrl+Shift+Z"
                    disabled={!shownHistory.future.length}
                    onClick={redo}
                  >
                    <Redo2 aria-hidden />
                  </ToolButton>
                </ToolSlot>
                <ToolSlot tool="layout-tb" separator>
                  <ToolButton label={labels.layoutTB} pressed={direction === 'TB'} onClick={() => relayout('TB')}>
                    <ArrowDownFromLine aria-hidden />
                  </ToolButton>
                </ToolSlot>
                <ToolSlot tool="layout-lr">
                  <ToolButton label={labels.layoutLR} pressed={direction === 'LR'} onClick={() => relayout('LR')}>
                    <ArrowRightFromLine aria-hidden />
                  </ToolButton>
                </ToolSlot>
                <ToolSlot tool="fit" separator>
                  <ToolButton label={labels.fit} onClick={fit}>
                    <Maximize aria-hidden />
                  </ToolButton>
                </ToolSlot>
                <ToolSlot tool="minimap">
                  <ToolButton label={labels.minimap} pressed={minimap} onClick={() => setMinimap((m) => !m)}>
                    <MapIcon aria-hidden />
                  </ToolButton>
                </ToolSlot>
              </ToolbarGroup>
            </Toolbar>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent aria-label={labels.menu}>
          <RowActionMenuItems items={menuItems} />
        </ContextMenuContent>
      </ContextMenu>
    </BoardCtx>
  )
}
