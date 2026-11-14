// SPDX-License-Identifier: MIT
// 盈亏归因（组件卡 PnLAttribution，2026-11-14 读 design/katana-console/project/components/PnLAttribution；版式照 SeriesExplorer 的工作台加工业文档风，
// 清单照参照图的 BILL OF MODULES）：今天（或选中区间）的钱从哪来。顶行是工作台的 Toolbar（标题、维度与区间的分段、表格 / 导出），
// 标题下一行点阵元信息；清单：列头点阵小字加实线，每行编号（强调色点阵字）、标签、零轴横条（正在右、负在左，条是 ink-200 的纹理，焦点项强调色）、
// 数值（无衬线 tabular 右对齐，只有数值用涨跌色）、占比；已平仓的行整行删除线降墨色，下面一行点阵脚注；右侧是左边 2px 强调色竖条的合计读数。
// 排序按 |贡献| 降序、正负分组，超过 7 项折「其他 ×n」，费用·税永远在最底、不着色。点阵字只给装饰性的标签（pixel.md：整数字号、不加字距）。
// 不用瀑布图（卡明写：阅读要跟踪累计基线，认知负荷高）。文字都从 props 来。切维度时按位置对应行，条长用 transition 过渡。
import { DownloadIcon, ExpandIcon, TableIcon } from 'lucide-react'
import { useState, type KeyboardEvent } from 'react'
import { cn } from '../../lib/cn'
import { ToggleGroup, ToggleGroupItem } from '../../primitives/toggle-group'
import { LcdTooltip } from '../../quant/chart-kit/lcd-tooltip'
import { Toolbar, ToolbarGroup, ToolButton } from '../toolbar/toolbar'
import {
  ATTRIBUTION_MAX_ITEMS,
  attributionBar,
  attributionRows,
  attributionScale,
  type AttributionItem,
  type AttributionRow,
} from './attribution-model'

export type AttributionChoice = { key: string; label: string }

export type AttributionBarsProps = {
  items: readonly AttributionItem[]
  /** 标题（英文部分宽体大写）。 */
  title: string
  /** 标题下一行的元信息（点阵小字，例「归因 · 今日 · 账户 A B · CNY · 刻度 ±80 000」）；不给不画。 */
  meta?: string
  /** 整张图的读屏名。 */
  label: string
  /** 维度切换（品种 / 账户 / 策略 / 资产类别）；换维度由调用方换 items。 */
  dimensions?: { label: string; options: readonly AttributionChoice[]; value: string; onChange: (key: string) => void }
  /** 区间切换。 */
  ranges?: { label: string; options: readonly AttributionChoice[]; value: string; onChange: (key: string) => void }
  /** 一个贡献写成什么字（行尾数字与 tooltip）；正负号由调用方定。 */
  formatValue: (value: number) => string
  /** 「其他 ×n」写成什么。 */
  otherLabel: (folded: number) => string
  /** 占比写成什么字。 */
  formatShare: (share: number) => string
  /** tooltip 里占比那一行的标签。 */
  shareLabel: string
  /** 右侧合计读数：每个一块，左边 2px 强调色竖条；value 决定数字的涨跌色。 */
  readouts?: readonly { key: string; label: string; text: string; value?: number }[]
  /** 当前联动的品种：它的条转强调色纹理。 */
  focusKey?: string
  /** 点击一行（写联动上下文）。 */
  onSelect?: (key: string) => void
  /** 列头（点阵小字）：编号、项、贡献、占比；表格视图也用。 */
  heads: { index: string; item: string; value: string; share: string }
  /** 页脚：项数说明、刻度（拿到 ±max）、来源（点阵 SOURCE 行）与声明（例：研究账本不计入）。 */
  footer: { count: string; scale: (max: number) => string; source?: string; note?: string }
  /** 右上角工具的读屏名；导出与全屏的回调不给就不画。表格视图总有。 */
  actionLabels: { group: string; table: string; exportCsv: string; fullscreen: string }
  onExport?: () => void
  onFullscreen?: () => void
  maxItems?: number
  className?: string
}

const pad = (n: number) => String(n).padStart(2, '0')

export function AttributionBars({
  items,
  title,
  meta,
  label,
  dimensions,
  ranges,
  formatValue,
  otherLabel,
  formatShare,
  shareLabel,
  readouts,
  focusKey,
  onSelect,
  heads,
  footer,
  actionLabels,
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
  const segment = (spec: NonNullable<AttributionBarsProps['ranges']>) => (
    <ToggleGroup variant="sm" aria-label={spec.label} value={spec.value} onValueChange={spec.onChange}>
      {spec.options.map((option) => (
        <ToggleGroupItem key={option.key} value={option.key}>
          {option.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
  const closedRows = rows.map((row, i) => ({ row, i })).filter(({ row }) => row.closed !== null)

  return (
    <figure className={cn('k-attr', className)} data-slot="attribution-bars" aria-label={label}>
      <div className="k-attr-head">
        <Toolbar label={actionLabels.group}>
          <ToolbarGroup side="left">
            <h4 className="k-attr-title" data-slot="attribution-title">
              {title}
            </h4>
          </ToolbarGroup>
          <ToolbarGroup side="right">
            {dimensions && segment(dimensions)}
            {ranges && segment(ranges)}
            <ToolButton label={actionLabels.table} pressed={table} onClick={() => setTable(!table)}>
              <TableIcon size={16} aria-hidden="true" />
            </ToolButton>
            {onExport === undefined ? null : (
              <ToolButton label={actionLabels.exportCsv} onClick={onExport}>
                <DownloadIcon size={16} aria-hidden="true" />
              </ToolButton>
            )}
            {onFullscreen === undefined ? null : (
              <ToolButton label={actionLabels.fullscreen} onClick={onFullscreen}>
                <ExpandIcon size={16} aria-hidden="true" />
              </ToolButton>
            )}
          </ToolbarGroup>
        </Toolbar>
      </div>
      {meta && (
        <p className="k-attr-meta" data-slot="attribution-meta">
          {meta}
        </p>
      )}
      <div className="k-attr-body">
        <div className="k-attr-main">
          {table ? (
            <table className="k-attr-table" data-slot="attribution-table">
              <thead>
                <tr>
                  <th>{heads.index}</th>
                  <th>{heads.item}</th>
                  <th>{heads.value}</th>
                  <th>{heads.share}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={row.key}>
                    <td>{pad(i + 1)}</td>
                    <td>{text(row)}</td>
                    <td>{formatValue(row.value)}</td>
                    <td>{formatShare(share(row))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <>
              <div className="k-attr-cols" aria-hidden="true" data-slot="attribution-heads">
                <span>{heads.index}</span>
                <span>{heads.item}</span>
                <span />
                <span>{heads.value}</span>
                <span>{heads.share}</span>
              </div>
              <ul className="k-attr-rows" role="list" aria-label={label} onPointerLeave={() => setActive(null)}>
                {rows.map((row, i) => {
                  const bar = attributionBar(row.value, scale)
                  const focused = row.key === focusKey
                  return (
                    <li
                      // 按位置当 key：切维度时同一位置的条长从旧值过渡到新值，而不是整行换掉。
                      key={i}
                      className="k-attr-row"
                      data-slot="attribution-row"
                      data-key={row.key}
                      data-kind={row.kind}
                      data-closed={row.closed === null ? undefined : 'true'}
                      data-active={active === row.key ? 'true' : undefined}
                      tabIndex={0}
                      onPointerEnter={() => setActive(row.key)}
                      onFocus={() => setActive(row.key)}
                      onBlur={() => setActive(null)}
                      onKeyDown={key(row)}
                      onClick={row.kind === 'item' && onSelect ? () => onSelect(row.key) : undefined}
                    >
                      <span className="k-attr-index" data-slot="attribution-index">
                        {row.kind === 'fee' ? '–' : pad(i + 1)}
                      </span>
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
                      <span className="k-attr-share">{formatShare(share(row))}</span>
                      {active === row.key && (
                        <LcdTooltip
                          className="k-attr-tip"
                          title={text(row)}
                          rows={[
                            { key: 'v', label: label, value: formatValue(row.value) },
                            { key: 's', label: shareLabel, value: formatShare(share(row)) },
                            ...row.detail.map((d, n) => ({ key: `d${n}`, label: d.label, value: d.value })),
                          ]}
                        />
                      )}
                    </li>
                  )
                })}
              </ul>
              {closedRows.map(({ row, i }) => (
                <p key={row.key} className="k-attr-foot-note" data-slot="attribution-closed-note">
                  {pad(i + 1)} {row.closed}
                </p>
              ))}
            </>
          )}
        </div>
        {readouts && readouts.length > 0 && (
          <aside className="k-attr-aside" data-slot="attribution-readouts">
            {readouts.map((readout) => (
              <div key={readout.key} className="k-attr-readout" data-slot="attribution-readout">
                <span className="k-attr-readout-label">{readout.label}</span>
                <span
                  className="k-attr-readout-value"
                  data-tone={readout.value === undefined ? undefined : tone(readout.value)}
                >
                  {readout.text}
                </span>
              </div>
            ))}
          </aside>
        )}
      </div>
      <div className="k-attr-foot">
        <span>{footer.count}</span>
        <span data-slot="attribution-scale">{footer.scale(scale)}</span>
        {footer.note && <span className="k-attr-note">{footer.note}</span>}
      </div>
      {footer.source && (
        <p className="k-attr-source" data-slot="attribution-source">
          {footer.source}
        </p>
      )}
    </figure>
  )
}
