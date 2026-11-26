// SPDX-License-Identifier: MIT
/**
 * Node and edge renderers of Whiteboard (note, group, metric, card, hypothesis; plain / status / feedback edges).
 * 白板的节点与边（#51）。自定义节点、边的写法照 React Flow 文档的 Custom Nodes / Custom Edges / Edge Label Renderer / Node Toolbar
 * 示例（https://reactflow.dev/examples ，xyflow/web 仓库，MIT，Copyright (c) 2019-2025 webkid GmbH，2026-11-18 读），皮换成我们的。
 */
import {
  BaseEdge,
  EdgeLabelRenderer,
  Handle,
  NodeResizer,
  NodeToolbar,
  Position,
  getBezierPath,
  type Edge,
  type EdgeProps,
  type Node,
  type NodeProps,
} from '@xyflow/react'
import { Copy, GitBranch, Repeat, Trash2 } from 'lucide-react'
import { createContext, use, useState, type ReactNode } from 'react'
import { Sparkline } from '../../quotes/sparkline.tsx'
import { STATUS_ICON } from '../transmission-chain/transmission-chain-detail.tsx'
import type { ChainStatus } from '../transmission-chain/transmission-chain-model.ts'
import type {
  WhiteboardCardNode,
  WhiteboardDirection,
  WhiteboardEdge,
  WhiteboardGroupNode,
  WhiteboardHypothesisNode,
  WhiteboardMetricNode,
  WhiteboardNode,
  WhiteboardNoteNode,
} from './whiteboard-model.ts'

export type WhiteboardLabels = {
  /** 整块画布的读屏名。 */
  board: string
  /** 工具条的读屏名。 */
  toolbar: string
  undo: string
  redo: string
  layoutTB: string
  layoutLR: string
  fit: string
  minimap: string
  copy: string
  paste: string
  duplicate: string
  delete: string
  addNote: string
  /** 右键菜单的读屏名。 */
  menu: string
  /** 「选中下游」：节点工具条与右键菜单里。 */
  selectDownstream: string
  /** 新便签的默认字。 */
  newNote: string
  feedback: string
  status: Record<ChainStatus, string>
  /** 假说节点的证据计数：「支 3 反 1」。 */
  counts: (support: number, oppose: number) => string
  /** 指标节点小折线的读屏名。 */
  series: (title: string) => string
}

/** 节点组件拿宿主的东西：文字、卡片插槽、改数据、节点工具条的动作。 */
export type BoardContext = {
  labels: WhiteboardLabels
  direction: WhiteboardDirection
  markerId: (status: ChainStatus | 'plain') => string
  renderCard?: (node: WhiteboardCardNode) => ReactNode
  updateData: (id: string, data: Record<string, unknown>) => void
  duplicate: (id: string) => void
  remove: (id: string) => void
  selectDownstream: (id: string) => void
  /** 当前选中的节点只有一个时，它的下游（高亮用）。 */
  downstream: { nodes: ReadonlySet<string>; edges: ReadonlySet<string> } | null
}
export const BoardCtx = createContext<BoardContext | null>(null)
const useBoard = () => use(BoardCtx)!

type Rf<N extends WhiteboardNode> = Node<N['data'], N['type']>

function Handles() {
  const { direction } = useBoard()
  return (
    <>
      <Handle type="target" position={direction === 'LR' ? Position.Left : Position.Top} />
      <Handle type="source" position={direction === 'LR' ? Position.Right : Position.Bottom} />
    </>
  )
}

/** 选中的节点上方的小工具条：复制一份、选中下游、删除（照 React Flow 的 Node Toolbar 示例）。 */
function Tools({ id, selected }: { id: string; selected: boolean }) {
  const board = useBoard()
  return (
    <NodeToolbar isVisible={selected} position={Position.Top} className="k-wb-node-tools">
      <button
        type="button"
        aria-label={board.labels.duplicate}
        title={board.labels.duplicate}
        onClick={() => board.duplicate(id)}
      >
        <Copy aria-hidden />
      </button>
      <button
        type="button"
        aria-label={board.labels.selectDownstream}
        title={board.labels.selectDownstream}
        onClick={() => board.selectDownstream(id)}
      >
        <GitBranch aria-hidden />
      </button>
      <button
        type="button"
        aria-label={board.labels.delete}
        title={board.labels.delete}
        onClick={() => board.remove(id)}
      >
        <Trash2 aria-hidden />
      </button>
    </NodeToolbar>
  )
}

function Shell({
  id,
  selected,
  kind,
  children,
  status,
}: {
  id: string
  selected: boolean
  kind: string
  children: ReactNode
  status?: ChainStatus
}) {
  const { downstream } = useBoard()
  const mark = downstream ? (downstream.nodes.has(id) ? 'downstream' : selected ? 'source' : 'dim') : undefined
  return (
    <div className="k-wb-node" data-kind={kind} data-status={status} data-mark={mark} data-wb-target={id}>
      <Tools id={id} selected={selected} />
      <Handles />
      {children}
    </div>
  )
}

export function NoteNode({ id, data, selected }: NodeProps<Rf<WhiteboardNoteNode>>) {
  const board = useBoard()
  const [editing, setEditing] = useState(false)
  return (
    <Shell id={id} selected={selected} kind="note">
      {editing ? (
        <textarea
          className="k-wb-note-edit nodrag nowheel"
          defaultValue={data.text}
          autoFocus
          aria-label={board.labels.addNote}
          onBlur={(event) => {
            setEditing(false)
            if (event.currentTarget.value !== data.text) board.updateData(id, { text: event.currentTarget.value })
          }}
          onKeyDown={(event) => {
            event.stopPropagation()
            // 组字时的 Esc 是取消候选词，不是收起便签（失焦会把写了一半的拼音存进去）。
            if (event.nativeEvent.isComposing || event.keyCode === 229) return
            if (event.key === 'Escape') event.currentTarget.blur()
          }}
        />
      ) : (
        <p className="k-wb-note-text" onDoubleClick={() => setEditing(true)}>
          {data.text}
        </p>
      )}
    </Shell>
  )
}

export function GroupNode({ id, data, selected }: NodeProps<Rf<WhiteboardGroupNode>>) {
  return (
    <div className="k-wb-group" data-wb-target={id}>
      <NodeResizer
        isVisible={selected}
        minWidth={160}
        minHeight={96}
        lineClassName="k-wb-resize-line"
        handleClassName="k-wb-resize-handle"
      />
      <span className="k-wb-group-title">{data.title}</span>
    </div>
  )
}

export function MetricNode({ id, data, selected }: NodeProps<Rf<WhiteboardMetricNode>>) {
  const { labels } = useBoard()
  return (
    <Shell id={id} selected={selected} kind="metric">
      <span className="k-wb-title">{data.title}</span>
      <span className="k-wb-metric-row">
        <b className="k-wb-value">
          {data.value}
          {data.unit ? <small>{data.unit}</small> : null}
        </b>
        {data.series ? (
          <span className="k-wb-spark">
            <Sparkline values={data.series} label={labels.series(data.title)} variant="line" />
          </span>
        ) : null}
      </span>
    </Shell>
  )
}

export function CardNode(props: NodeProps<Rf<WhiteboardCardNode>>) {
  const { renderCard } = useBoard()
  const { id, data, selected } = props
  const node: WhiteboardCardNode = {
    id,
    type: 'card',
    position: { x: props.positionAbsoluteX, y: props.positionAbsoluteY },
    data,
  }
  return (
    <Shell id={id} selected={selected} kind="card">
      <span className="k-wb-title">{data.title}</span>
      <div className="k-wb-slot nodrag">{renderCard?.(node)}</div>
    </Shell>
  )
}

export function HypothesisNode({ id, data, selected }: NodeProps<Rf<WhiteboardHypothesisNode>>) {
  const { labels } = useBoard()
  const Icon = STATUS_ICON[data.status]
  return (
    <Shell id={id} selected={selected} kind="hypothesis" status={data.status}>
      <span className="k-wb-title">{data.title}</span>
      <span className="k-wb-hyp-meta">
        <span className="k-wb-badge" data-status={data.status}>
          <Icon aria-hidden width={12} height={12} />
          {labels.status[data.status]}
        </span>
        <span className="k-wb-count">{labels.counts(data.support ?? 0, data.oppose ?? 0)}</span>
      </span>
    </Shell>
  )
}

export const NODE_TYPES = {
  note: NoteNode,
  group: GroupNode,
  metric: MetricNode,
  card: CardNode,
  hypothesis: HypothesisNode,
}

export type RfEdgeData = Pick<WhiteboardEdge, 'status' | 'feedback' | 'label'>
export type RfEdge = Edge<RfEdgeData, 'board'>

/** 一种边画三种：普通（中性实线）、带状态（与 TransmissionChain 同一套线型 + 图标 + 色）、反馈（点线 + 回环图标）。 */
export function BoardEdge({
  id,
  data,
  selected,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
}: EdgeProps<RfEdge>) {
  const board = useBoard()
  const [path, labelX, labelY] = getBezierPath({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition })
  const status = data?.status
  const Icon = status ? STATUS_ICON[status] : data?.feedback ? Repeat : null
  const text = [data?.label, status ? board.labels.status[status] : data?.feedback ? board.labels.feedback : '']
    .filter(Boolean)
    .join(' · ')
  const mark = board.downstream ? (board.downstream.edges.has(id) ? 'downstream' : 'dim') : undefined
  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        className="k-wb-edge-line"
        markerEnd={`url(#${board.markerId(status ?? 'plain')})`}
        interactionWidth={16}
        data-status={status ?? 'plain'}
        data-feedback={data?.feedback ? 'true' : undefined}
        data-mark={mark}
        data-selected={selected ? 'true' : undefined}
      />
      {Icon || data?.label ? (
        <EdgeLabelRenderer>
          <span
            className="k-wb-edge-chip nodrag nopan"
            data-status={status ?? 'plain'}
            data-feedback={data?.feedback ? 'true' : undefined}
            data-mark={mark}
            data-wb-edge={id}
            style={{ transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)` }}
          >
            {Icon ? <Icon aria-hidden width={12} height={12} /> : null}
            {text}
          </span>
        </EdgeLabelRenderer>
      ) : null}
    </>
  )
}

export const EDGE_TYPES = { board: BoardEdge }
