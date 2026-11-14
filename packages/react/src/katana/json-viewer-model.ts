// SPDX-License-Identifier: MIT
// JSON 查看器（JsonViewer）的数据模型（纯函数，组件与单测共用）：把任意值建成一棵带稳定 id 的节点树，查找命中的节点与要展开的祖先。
// id 是从根起的路径（`$/orders/0/price`，键名用 encodeURIComponent 转义），同一个值重建出来 id 不变，展开状态才跟得住。

export type JsonKind = 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null' | 'more'

export type JsonNode = {
  id: string
  /** 键名（对象的键或数组下标）；根是 null。 */
  key: string | null
  kind: JsonKind
  /** 叶子的显示文字（字符串带引号）；容器是空串。more 节点是空串，数量在 hidden。 */
  text: string
  /** 容器的子项总数（含没画出来的）。 */
  size: number
  children: JsonNode[]
  /** more 节点：被截掉的子项数。 */
  hidden: number
}

/** 一个容器最多画多少个子项，多出的折成一行「还有 N 项」。200：没有出处，是让一次展开最多出几百行 DOM 的估计，待定（有真实的大消息时再测）。 */
export const MAX_CHILDREN = 200

const leaf = (id: string, key: string | null, kind: JsonKind, text: string): JsonNode => ({
  id,
  key,
  kind,
  text,
  size: 0,
  children: [],
  hidden: 0,
})

/** 建树。undefined、函数、symbol 等不是 JSON 的值按「看得见的字」处理，不抛错；循环引用画成 [Circular]。 */
export function buildNodes(value: unknown, maxChildren = MAX_CHILDREN): JsonNode {
  const seen = new WeakSet<object>()
  const build = (v: unknown, id: string, key: string | null): JsonNode => {
    if (v === null) return leaf(id, key, 'null', 'null')
    if (v === undefined) return leaf(id, key, 'null', 'undefined')
    if (typeof v === 'string') return leaf(id, key, 'string', JSON.stringify(v))
    if (typeof v === 'number') return leaf(id, key, 'number', String(v))
    if (typeof v === 'bigint') return leaf(id, key, 'number', `${v}n`)
    if (typeof v === 'boolean') return leaf(id, key, 'boolean', String(v))
    if (typeof v !== 'object') return leaf(id, key, 'string', typeof v === 'symbol' ? v.toString() : '[Function]')
    if (v instanceof Date)
      return leaf(id, key, 'string', JSON.stringify(Number.isNaN(v.getTime()) ? 'Invalid Date' : v.toISOString()))
    if (seen.has(v)) return leaf(id, key, 'string', '[Circular]')
    seen.add(v)
    const isArray = Array.isArray(v)
    const entries: [string, unknown][] = isArray ? v.map((item, i) => [String(i), item]) : Object.entries(v)
    const shown = entries.slice(0, maxChildren).map(([k, item]) => build(item, `${id}/${encodeURIComponent(k)}`, k))
    const hidden = entries.length - shown.length
    if (hidden > 0) shown.push({ ...leaf(`${id}/…`, null, 'more', ''), hidden })
    seen.delete(v)
    return { id, key, kind: isArray ? 'array' : 'object', text: '', size: entries.length, children: shown, hidden: 0 }
  }
  return build(value, '$', null)
}

/** 容器收起时写的概要：对象 {3}，数组 [5]。 */
export const summary = (node: JsonNode): string => (node.kind === 'array' ? `[${node.size}]` : `{${node.size}}`)

/** 前 depth 层展开：depth 为 1 是只开根，2 是根与它的子容器。 */
export function expandedToDepth(root: JsonNode, depth: number): Set<string> {
  const open = new Set<string>()
  const walk = (node: JsonNode, level: number) => {
    if (level >= depth || node.children.length === 0) return
    open.add(node.id)
    for (const child of node.children) walk(child, level + 1)
  }
  walk(root, 0)
  return open
}

/** 查找：键名或叶子的字里含 query（不分大小写）的节点；祖先要展开才看得见命中。query 为空什么都不命中。 */
export function findMatches(root: JsonNode, query: string): { hits: Set<string>; ancestors: Set<string> } {
  const hits = new Set<string>()
  const ancestors = new Set<string>()
  const needle = query.trim().toLowerCase()
  if (needle === '') return { hits, ancestors }
  const walk = (node: JsonNode, path: string[]): void => {
    const own =
      node.kind !== 'more' &&
      ((node.key ?? '').toLowerCase().includes(needle) ||
        (node.children.length === 0 && node.text.toLowerCase().includes(needle)))
    if (own) {
      hits.add(node.id)
      for (const id of path) ancestors.add(id)
    }
    for (const child of node.children) walk(child, [...path, node.id])
  }
  walk(root, [])
  return { hits, ancestors }
}

/** 把一段字按 query 切成 [字, 是否命中] 的片（高亮用）；query 为空整段不命中。 */
export function splitHits(text: string, query: string): [string, boolean][] {
  const needle = query.trim().toLowerCase()
  if (needle === '') return [[text, false]]
  const lower = text.toLowerCase()
  const parts: [string, boolean][] = []
  let from = 0
  for (let at = lower.indexOf(needle); at !== -1; at = lower.indexOf(needle, from)) {
    if (at > from) parts.push([text.slice(from, at), false])
    parts.push([text.slice(at, at + needle.length), true])
    from = at + needle.length
  }
  if (from < text.length) parts.push([text.slice(from), false])
  return parts
}
