// SPDX-License-Identifier: MIT
import { ChevronRight, Search } from 'lucide-react'
import { useId, useMemo, useState, type CSSProperties } from 'react'
import { Button as AriaButton, Collection, Tree, TreeItem, TreeItemContent } from 'react-aria-components'
import { cn } from '../lib/cn'
import {
  buildNodes,
  expandedToDepth,
  findMatches,
  MAX_CHILDREN,
  splitHits,
  summary,
  type JsonNode,
} from './json-viewer-model'

// 功能参照 Arc JSON viewer（uiarc.dev，2026-11-14 读：折叠加搜索），实现原创；外观在 theme/json-viewer.css。
// 用途：原始消息、Agent 调用结果、连接调试。行为底座是 react-aria-components 的 Tree（treegrid 角色，↑↓ 走，→ 展开，← 收起），
// 查找：键名与叶子的字里含查询词的节点高亮，祖先自动展开；查找期间命中的祖先保持展开（收不掉），清空查询后恢复你自己展开的样子。
// 只读：不编辑、不复制（要复制用 CodeBlock 的复制钮）。

export type JsonViewerLabels = {
  /** 查找框的读屏名与占位。 */
  search: string
  /** 命中数：「3 处命中」「没有命中」。 */
  matches: (count: number) => string
  /** 被截掉的子项：「还有 120 项」。 */
  more: (count: number) => string
}

export type JsonViewerProps = {
  /** 要看的值（通常是 JSON.parse 的结果）；不是 JSON 的值（undefined、日期、循环引用）也不会抛错。 */
  value: unknown
  /** 整棵树的读屏名。 */
  label: string
  labels: JsonViewerLabels
  /** 一开始展开几层：1 只开根（默认），2 连根的子容器。 */
  defaultExpandDepth?: number
  /** 一个容器最多画多少个子项，多出的折成一行「还有 N 项」。 */
  maxChildren?: number
  className?: string
}

function Highlighted({ text, query }: { text: string; query: string }) {
  return splitHits(text, query).map(([part, hit], i) =>
    hit ? (
      <mark key={i} className="k-json-hit">
        {part}
      </mark>
    ) : (
      part
    ),
  )
}

function renderNode(node: JsonNode, query: string, labels: JsonViewerLabels, hits: ReadonlySet<string>) {
  const container = node.kind === 'object' || node.kind === 'array'
  return (
    <TreeItem
      id={node.id}
      textValue={node.key ?? summary(node)}
      hasChildItems={container && node.children.length > 0}
      className="k-json-item"
    >
      <TreeItemContent>
        {({ isExpanded, level }) => (
          <div
            className="k-json-row"
            data-kind={node.kind}
            data-expanded={isExpanded || undefined}
            data-hit={hits.has(node.id) || undefined}
            style={{ '--k-json-level': level - 1 } as CSSProperties}
          >
            {container && node.children.length > 0 ? (
              <AriaButton slot="chevron" className="k-json-chevron">
                <ChevronRight size={12} aria-hidden />
              </AriaButton>
            ) : (
              <span className="k-json-chevron" aria-hidden="true" />
            )}
            {node.kind === 'more' ? (
              <span className="k-json-more">{labels.more(node.hidden)}</span>
            ) : (
              <>
                {node.key !== null && (
                  <span className="k-json-key">
                    <Highlighted text={node.key} query={query} />
                  </span>
                )}
                {node.key !== null && <span className="k-json-colon">:</span>}
                {container ? (
                  <span className="k-json-summary">{summary(node)}</span>
                ) : (
                  <span className="k-json-value">
                    <Highlighted text={node.text} query={query} />
                  </span>
                )}
              </>
            )}
          </div>
        )}
      </TreeItemContent>
      <Collection items={node.children}>{(child) => renderNode(child, query, labels, hits)}</Collection>
    </TreeItem>
  )
}

export function JsonViewer({
  value,
  label,
  labels,
  defaultExpandDepth = 1,
  maxChildren = MAX_CHILDREN,
  className,
}: JsonViewerProps) {
  const root = useMemo(() => buildNodes(value, maxChildren), [value, maxChildren])
  const [state, setState] = useState(() => ({ root, open: expandedToDepth(root, defaultExpandDepth) }))
  // 换了要看的值：展开状态跟着重来（在渲染里调整，不用 effect）。
  if (state.root !== root) setState({ root, open: expandedToDepth(root, defaultExpandDepth) })
  const [query, setQuery] = useState('')
  const searchId = useId()
  const { hits, ancestors } = useMemo(() => findMatches(root, query), [root, query])
  const searching = query.trim() !== ''
  const expanded = searching ? new Set([...state.open, ...ancestors]) : state.open

  return (
    <div className={cn('k-json', className)}>
      <label className="k-json-search" htmlFor={searchId}>
        <Search size={13} aria-hidden />
        <input
          id={searchId}
          type="search"
          className="k-json-input"
          aria-label={labels.search}
          placeholder={labels.search}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <span className="k-json-count" role="status">
          {searching ? labels.matches(hits.size) : ''}
        </span>
      </label>
      <Tree
        aria-label={label}
        className="k-json-tree"
        items={[root]}
        // 行的内容读 query、hits、labels：RAC 的动态集合按 item 缓存行，这些变了要告诉它。
        dependencies={[query, hits, labels]}
        selectionMode="none"
        expandedKeys={expanded}
        onExpandedChange={(keys) => {
          // 查找期间被强制展开的祖先不记进用户的展开状态：清空查询后回到用户自己展开的样子。
          const next = new Set([...keys].map(String))
          if (searching) for (const id of ancestors) if (!state.open.has(id)) next.delete(id)
          setState({ root, open: next })
        }}
      >
        {(node) => renderNode(node, query, labels, hits)}
      </Tree>
    </div>
  )
}
