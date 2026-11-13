// SPDX-License-Identifier: MIT
// 数据表（DataGrid）的纯逻辑：排序状态、行选择与键盘移动、复制与导出的文字。原在应用的 panels/kit/data-table-model.ts（#1869 搬进包），
// 排序设置存成面板设置里的哪种字是应用的事，留在应用；这里只有不带存储的部分。
// 键位与右键菜单的出处：ATAS X 8.0.15 Tables 四张表，2026-10-11 实测（#232）：Copy (Ctrl+C)、Save to file… (Ctrl+S)、Reset (Ctrl+R)。

/** 排序：哪一列、是不是倒序；null 是不排。 */
export type SortSpec = { id: string; desc: boolean }

export type Selection = { selected: ReadonlySet<string>; anchor: string | null; cursor: string | null }
export const EMPTY_SELECTION: Selection = { selected: new Set(), anchor: null, cursor: null }

/** order 是现在显示的顺序（排序之后）。Shift 选一段，Ctrl / Cmd 点选加减，普通点击只选这一行。 */
export function clickSelection(
  order: readonly string[],
  current: Selection,
  id: string,
  { range, toggle }: { range: boolean; toggle: boolean },
): Selection {
  const anchor = current.anchor ?? current.cursor
  if (range && anchor !== null && order.includes(anchor)) {
    const [from, to] = [order.indexOf(anchor), order.indexOf(id)].sort((a, b) => a - b)
    return { selected: new Set(order.slice(from, to + 1)), anchor, cursor: id }
  }
  if (toggle) {
    const selected = new Set(current.selected)
    if (selected.has(id)) selected.delete(id)
    else selected.add(id)
    return { selected, anchor: id, cursor: id }
  }
  return { selected: new Set([id]), anchor: id, cursor: id }
}

/** 键盘移动：上下一行、到头到尾；没有所在行时从第一行（往上是最后一行）开始。 */
export function moveCursor(
  order: readonly string[],
  cursor: string | null,
  to: 'up' | 'down' | 'first' | 'last',
): string | null {
  if (order.length === 0) return null
  if (to === 'first') return order[0]
  if (to === 'last') return order[order.length - 1]
  const index = cursor === null ? -1 : order.indexOf(cursor)
  if (index < 0) return to === 'down' ? order[0] : order[order.length - 1]
  return order[Math.max(0, Math.min(order.length - 1, index + (to === 'down' ? 1 : -1)))]
}

/** 以 = + - @ 开头的格子会被表格软件当公式：前面补一个单引号；纯数字（含负数）不算，原样留着。 */
const guard = (cell: string): string =>
  /^[=+\-@\t\r]/.test(cell) && !/^[+-]?\d+(\.\d+)?$/.test(cell) ? `'${cell}` : cell
const quoted = (cell: string): string => (/[",\n\r]/.test(cell) ? `"${cell.replace(/"/g, '""')}"` : cell)

/** 导出的 CSV：表头加每行显示出来的字（跟屏幕上看到的一样，隐私模式下是遮住的）。 */
export function tableCsv(header: readonly string[], rows: readonly (readonly string[])[]): string {
  return [header, ...rows].map((row) => row.map((cell) => quoted(guard(cell))).join(',')).join('\n') + '\n'
}

/** 复制到剪贴板的文字：制表符分列，粘到表格软件里正好分开。 */
export function tableTsv(header: readonly string[], rows: readonly (readonly string[])[]): string {
  const clean = (cell: string) => cell.replace(/[\t\r\n]+/g, ' ')
  return [header, ...rows].map((row) => row.map(clean).join('\t')).join('\n')
}

const PLAIN_DECIMAL = /^-?\d+(\.\d+)?$/

/**
 * 十进制字符串按数值比，不转 JS 数字（金额、价格、数量的位数可以超过双精度）：只认普通写法（没有指数、千分位、空白）。
 * 有一边不是数就把它当没有：有数的排在后面。
 */
export function compareDecimal(a: unknown, b: unknown): number {
  const left = typeof a === 'string' && PLAIN_DECIMAL.test(a) ? a : null
  const right = typeof b === 'string' && PLAIN_DECIMAL.test(b) ? b : null
  if (left === null || right === null) return left !== null ? 1 : right !== null ? -1 : 0
  const [ln, rn] = [left.startsWith('-'), right.startsWith('-')]
  const [lAbs, rAbs] = [splitDecimal(left), splitDecimal(right)]
  const lZero = isZero(lAbs)
  const rZero = isZero(rAbs)
  if (lZero && rZero) return 0
  const lNeg = ln && !lZero
  const rNeg = rn && !rZero
  if (lNeg !== rNeg) return lNeg ? -1 : 1
  const magnitude = compareMagnitude(lAbs, rAbs)
  return lNeg ? -magnitude : magnitude
}

type Parts = { whole: string; fraction: string }
function splitDecimal(value: string): Parts {
  const [whole, fraction = ''] = value.replace(/^-/, '').split('.')
  return { whole: whole.replace(/^0+(?=\d)/, ''), fraction: fraction.replace(/0+$/, '') }
}
const isZero = ({ whole, fraction }: Parts): boolean => whole === '0' && fraction === ''
function compareMagnitude(a: Parts, b: Parts): number {
  if (a.whole.length !== b.whole.length) return a.whole.length < b.whole.length ? -1 : 1
  if (a.whole !== b.whole) return a.whole < b.whole ? -1 : 1
  if (a.fraction === b.fraction) return 0
  return a.fraction < b.fraction ? -1 : 1
}
