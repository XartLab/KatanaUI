// SPDX-License-Identifier: MIT
// 盈亏归因（组件卡 PnLAttribution，2026-11-14 读 design/katana-console/project/components/PnLAttribution）：今天（或选中区间）的钱从哪来。
// 零轴水平条形：方向用位置表达（正在右、负在左，零轴 1px），条是 ink-200 的点阵纹理，不用红绿；只有右侧的数字与顶行合计用 pnl-up / pnl-down。
// 焦点项（focusKey，对应当前联动的品种）的条转强调色纹理。排序按 |贡献| 降序、正负分组，超过 7 项折「其他 ×n」，费用·税永远在最底一行。
// 刻度对称（±max）在页脚写出，不画网格、不画刻度数字。悬停或聚焦一行出 LCD tooltip（数值、占比、调用方给的明细）；右上角是表格视图、导出（回调由调用方给）。
// 不用瀑布图（卡明写：阅读要跟踪累计基线，认知负荷高）；#1917 第一版做过 WaterfallChart，是规格没对卡，已删。
// 维度切换（品种 / 账户 / 策略）由调用方用分段控件做，换 items 即可；条长过渡用 transition，行按新排序重排（不做逐行位移动画）。
// 数值语法照 precision-instrument.md §2.2：等宽数字、右对齐；文字都从 props 来。
import { useState, type KeyboardEvent } from 'react'
import { cn } from '../lib/cn'
import {
  ATTRIBUTION_MAX_ITEMS,
  attributionBar,
  attributionRows,
  attributionScale,
  type AttributionItem,
  type AttributionRow,
} from './attribution-model'
import { ChartActions, type ChartActionsLabels } from './chart-kit/chart-actions'
import { LcdTooltip } from './chart-kit/lcd-tooltip'

export type AttributionBarsProps = {
  items: readonly AttributionItem[]
  /** 整张图的读屏名。 */
  label: string
  /** 一个贡献写成什么字（右侧数字与 tooltip）；正负号由调用方定。 */
  formatValue: (value: number) => string
  /** 「其他 ×n」写成什么。 */
  otherLabel: (folded: number) => string
  /** 占比写成什么字（tooltip）。 */
  formatShare: (share: number) => string
  /** tooltip 里占比那一行的标签。 */
  shareLabel: string
  /** 合计：顶行右侧的 LCD 数字；tag 是「EST」「账户集合」之类的点阵小标。 */
  total?: { value: number; text: string; tag?: string }
  /** 当前联动的品种：它的条转强调色纹理。 */
  focusKey?: string
  /** 点击一行（写联动上下文）。 */
  onSelect?: (key: string) => void
  /** 页脚：项数说明、刻度（拿到 ±max）、来源或声明（例：研究账本不计入）。 */
  footer: { count: string; scale: (max: number) => string; note?: string }
  /** 图右上角三件的文字；导出与全屏的回调不给就不画。表格视图总有。 */
  actionLabels: ChartActionsLabels
  /** 表格视图的列头。 */
  tableHeads: { item: string; value: string; share: string }
  onExport?: () => void
  onFullscreen?: () => void
  maxItems?: number
  className?: string
}

export function AttributionBars({
  items,
  label,
  formatValue,
  otherLabel,
  formatShare,
  shareLabel,
  total,
  focusKey,
  onSelect,
  footer,
  actionLabels,
  tableHeads,
  onExport,
  onFullscreen,
  maxItems = ATTRIBUTION_MAX_ITEMS,
  className,
}: AttributionBarsProps) {
  const rows = attributionRows(items, maxItems)
  const scale = attributionScale(rows)
  const sum = rows.reduce((s, row) => s + Math.abs(row.value), 0)
  const [active, setActive] = useState<string | null>(null)
  const [table, setTable] = useState(false)
  const text = (row: AttributionRow) => (row.kind === 'other' ? otherLabel(row.folded) : row.label)
  const share = (row: AttributionRow) => (sum > 0 ? Math.abs(row.value) / sum : 0)
  const tone = (value: number) => (value > 0 ? 'up' : value < 0 ? 'down' : 'flat')
  const key = (row: AttributionRow) => (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Enter' && onSelect && row.kind === 'item') onSelect(row.key)
    if (event.key === 'Escape' && active !== null) setActive(null)
  }

  return (
    <figure className={cn('k-attr', className)} data-slot="attribution-bars" aria-label={label}>
      <div className="k-attr-top">
        {total && (
          <span className="k-attr-total" data-slot="attribution-total" data-tone={tone(total.value)}>
            {total.text}
            {total.tag && <small>{total.tag}</small>}
          </span>
        )}
        <ChartActions
          labels={actionLabels}
          tableView={table}
          onTableView={setTable}
          onExport={onExport}
          onFullscreen={onFullscreen}
        />
      </div>
      {table ? (
        <table className="k-attr-table" data-slot="attribution-table">
          <thead>
            <tr>
              <th>{tableHeads.item}</th>
              <th>{tableHeads.value}</th>
              <th>{tableHeads.share}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key}>
                <td>{text(row)}</td>
                <td>{formatValue(row.value)}</td>
                <td>{formatShare(share(row))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <ul className="k-attr-rows" role="list" aria-label={label} onPointerLeave={() => setActive(null)}>
          {rows.map((row) => {
            const bar = attributionBar(row.value, scale)
            const focused = row.key === focusKey
            return (
              <li
                key={row.key}
                className="k-attr-row"
                data-slot="attribution-row"
                data-key={row.key}
                data-kind={row.kind}
                data-active={active === row.key ? 'true' : undefined}
                tabIndex={0}
                onPointerEnter={() => setActive(row.key)}
                onFocus={() => setActive(row.key)}
                onBlur={() => setActive(null)}
                onKeyDown={key(row)}
                onClick={row.kind === 'item' && onSelect ? () => onSelect(row.key) : undefined}
              >
                <span className="k-attr-label">{text(row)}</span>
                <span className="k-attr-axis">
                  <i
                    className="k-attr-bar k-dotfill"
                    data-slot="attribution-bar"
                    data-focus={focused ? 'true' : undefined}
                    style={{ left: `${bar.left * 100}%`, width: `${bar.width * 100}%` }}
                  />
                </span>
                <span className="k-attr-value" data-slot="attribution-value" data-tone={tone(row.value)}>
                  {formatValue(row.value)}
                </span>
                {active === row.key && (
                  <LcdTooltip
                    className="k-attr-tip"
                    title={text(row)}
                    rows={[
                      { key: 'v', label: label, value: formatValue(row.value) },
                      { key: 's', label: shareLabel, value: formatShare(share(row)) },
                      ...row.detail.map((d, i) => ({ key: `d${i}`, label: d.label, value: d.value })),
                    ]}
                  />
                )}
              </li>
            )
          })}
        </ul>
      )}
      <div className="k-attr-foot">
        <span>{footer.count}</span>
        <span data-slot="attribution-scale">{footer.scale(scale)}</span>
        {footer.note && <span className="k-attr-note">{footer.note}</span>}
      </div>
    </figure>
  )
}
