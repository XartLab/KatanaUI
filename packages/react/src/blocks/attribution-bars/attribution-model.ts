// SPDX-License-Identifier: MIT
// 盈亏归因的排序与折叠（纯函数）。照组件卡 PnLAttribution（2026-11-14 读）：
//   按 |贡献| 降序，正负分两组：正组在上、负组在下，组内各自降序；超过 maxItems 项的折进「其他 ×n」；费用·税永远单独一行放最底；
//   刻度对称（±max），max 取最大 |值| 向上取到一位有效数字（卡里的例子 73,920 写 ±80,000）。
// 「其他」的数是被折进去的几项的净和，它放在自己符号那一组的最后；净和为 0 放正组。

export type AttributionItem = {
  key: string
  /** 标签（代码、名称或账户短码，由调用方拼好）。 */
  label: string
  value: number
  /** fee：费用·税，永远单独一行放最底，不参与折叠。 */
  kind?: 'item' | 'fee'
  /** 已平仓：名称后的点阵小标签文字（例「已平 09-18」），这一行整行删除线、降墨色。 */
  closed?: string
  /** 悬停 tooltip 里多写的几行（持仓数、所属账户……），文字由调用方给。 */
  detail?: readonly { label: string; value: string }[]
}

export type AttributionRow = {
  key: string
  label: string
  value: number
  kind: 'item' | 'other' | 'fee'
  /** other 行：被折进去的项数。 */
  folded: number
  closed: string | null
  detail: readonly { label: string; value: string }[]
}

/** 一行不折叠最多放几项：7，照卡（工作记忆的 7 ± 2），含「其他」一行。 */
export const ATTRIBUTION_MAX_ITEMS = 7

export function attributionRows(
  items: readonly AttributionItem[],
  maxItems: number = ATTRIBUTION_MAX_ITEMS,
  otherKey = '__other',
): AttributionRow[] {
  const fee = items.filter((item) => item.kind === 'fee')
  const rest = items.filter((item) => item.kind !== 'fee').sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
  const fold = rest.length > maxItems
  const named = fold ? rest.slice(0, maxItems - 1) : rest
  const folded = fold ? rest.slice(maxItems - 1) : []
  const row = (item: AttributionItem): AttributionRow => ({
    key: item.key,
    label: item.label,
    value: item.value,
    kind: 'item',
    folded: 0,
    closed: item.closed ?? null,
    detail: item.detail ?? [],
  })
  const other: AttributionRow | null = fold
    ? {
        key: otherKey,
        label: '',
        value: folded.reduce((sum, item) => sum + item.value, 0),
        kind: 'other',
        folded: folded.length,
        closed: null,
        detail: [],
      }
    : null
  const up = named.filter((item) => item.value >= 0).map(row)
  const down = named.filter((item) => item.value < 0).map(row)
  if (other) (other.value >= 0 ? up : down).push(other)
  return [...up, ...down, ...fee.map((item) => ({ ...row(item), kind: 'fee' as const }))]
}

/** 对称刻度的 max：最大 |值| 向上取到一位有效数字（待定：卡里只有一个例子，没有写规则）；全 0 返回 1。 */
export function attributionScale(rows: readonly AttributionRow[]): number {
  const max = rows.reduce((m, row) => Math.max(m, Math.abs(row.value)), 0)
  if (!(max > 0)) return 1
  const unit = 10 ** Math.floor(Math.log10(max))
  return Math.ceil(max / unit - 1e-9) * unit
}

/** 一行的条：从零轴（0.5）往右或往左，起点与宽度都是整条宽的比例。 */
export function attributionBar(value: number, scale: number): { left: number; width: number } {
  const width = Math.min(0.5, (Math.abs(value) / scale) * 0.5)
  return { left: value >= 0 ? 0.5 : 0.5 - width, width }
}
