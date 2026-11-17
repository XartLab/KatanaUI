// SPDX-License-Identifier: MIT
// 矩形树图：一格一项，颜色按涨跌分七档（跟涨跌配色走），格子够大写名字和数，点组头下钻，底部色例。
// 画法从应用的分析视图 TreemapView 提来（#1884，调用方零改动；原来照 TradingView 股票市场热图，#443）。
// 实时刷新：颜色走 CSS transition（--dur-flash 线性），格子换位与改大小走 left / top / width / height 的 transition（--dur-reorder，缓动 --ease-snappy），涨跌方向翻了的格子闪一次新方向的涨跌色（同 MarketHeatmap 的规则：同一格 1 秒内最多一次）。
// 换位的过渡要认得是同一格：传 cellKey（默认按序号，序号不稳时过渡会张冠李戴）。
// 工具条（大小、颜色、分组的下拉、返回钮）是应用的事，从 toolbar 传进来；排布在 treemap-model.ts，调用方先排好再传 blocks。
import type { CSSProperties, ReactNode } from 'react'
import { useValueFlash } from '../lib/live.ts'
import { pct } from '../lib/num.ts'
import { colorStep, TREEMAP_H, TREEMAP_W, type TreemapBlock } from './treemap-model.ts'

/** 格子多小就不写字（排布单位的宽、高）。 */
const MIN_TEXT_W = 48
const MIN_TEXT_H = 28

export type TreemapClasses = Partial<
  Record<'root' | 'bar' | 'plot' | 'group' | 'head' | 'cell' | 'name' | 'value' | 'legend', string>
>

export type TreemapProps<T> = {
  /** The result of layoutTreemap. */
  blocks: readonly TreemapBlock<T>[]
  /**
   * Draw group headers (clickable to drill down); pass false after drilling down.
   * 画组头（可点下钻）；下钻之后不画。
   */
  heads?: boolean
  /**
   * What to write on a cell: the name, the text of the number, and the change used for color (null means none).
   * 一格上写什么：名字、数的文字、颜色用的涨跌数（null 是没有数）。
   */
  describe: (data: T) => { name: string; text: string; change: number | null }
  /**
   * Where the color scale ends (as a decimal); changes are cut at plus or minus limit into seven steps from -3 to +3.
   * 色例两端是多少（小数）。
   */
  limit?: number
  /**
   * Text for each step of the color scale (-3 to +3).
   * 色例上每一档写的字（−3 到 +3）。
   */
  legendText: (step: number) => string
  /** A row above the cells. */
  toolbar?: ReactNode
  /**
   * A stable key per cell (a symbol code, say), so a cell that moves or resizes keeps its identity and glides to the new place; the index is used when omitted.
   * 每格的稳定标识（品种代码之类）：格子换位、改大小时认得是同一格、平滑过去；不给就按序号。
   */
  cellKey?: (data: T) => string
  /** Called when a group header is clicked. */
  onGroup?: (name: string) => void
  /** Called when a cell is clicked; when given, cells are focusable buttons that trigger on Enter. */
  onSelect?: (data: T) => void
  /** Deprecated: use onSelect. @deprecated Use onSelect. */
  onItem?: (data: T) => void
  /** Extra class names per part. */
  classes?: TreemapClasses
}

const join = (base: string, extra?: string) => (extra ? `${base} ${extra}` : base)
const STEPS = [-3, -2, -1, 0, 1, 2, 3]

type CellProps = {
  step: number | null
  /** 涨跌的符号（−1、0、1）：翻了方向才闪。 */
  sign: number
  className: string
  style: CSSProperties
  name: string
  text: string
  big: boolean
  nameClass: string
  valueClass: string
  onItem?: () => void
}

function Cell({ step, sign, className, style, name, text, big, nameClass, valueClass, onItem }: CellProps) {
  // 平（0）不算方向：从涨到平、从平到涨都不闪，只有涨与跌之间翻了才闪。
  const turned = useValueFlash(sign === 0 ? null : sign)
  return (
    <div
      className={`${className} is-step${step === null ? 'na' : step}${onItem ? ' is-link' : ''}`}
      style={style}
      title={`${name} ${text}`}
      role={onItem ? 'button' : undefined}
      tabIndex={onItem ? 0 : undefined}
      aria-label={`${name} ${text}`}
      onClick={onItem}
      onKeyDown={
        onItem
          ? (event) => {
              if (event.key === 'Enter') onItem()
            }
          : undefined
      }
    >
      {big && (
        <>
          <span className={nameClass}>{name}</span>
          <span className={valueClass}>{text}</span>
        </>
      )}
      {turned.flash && (
        // 盖在格子上的一层，不换格子自己的 key：换 key 会让格子重新挂载、丢掉位置的过渡。
        <i key={turned.key} className="k-treemap-flash k-live-flash" data-flash={turned.flash} aria-hidden="true" />
      )}
    </div>
  )
}

export function Treemap<T>({
  blocks,
  heads = false,
  describe,
  limit = 0.03,
  legendText,
  toolbar,
  onGroup,
  onSelect,
  onItem: legacyOnItem,
  cellKey,
  classes = {},
}: TreemapProps<T>) {
  const onItem = onSelect ?? legacyOnItem
  return (
    <figure className={join('k-treemap', classes.root)}>
      {toolbar && <div className={join('k-treemap-bar', classes.bar)}>{toolbar}</div>}
      <div className={join('k-treemap-plot', classes.plot)}>
        {blocks.map((block) => (
          <div key={block.name} className={join('k-treemap-group', classes.group)}>
            {heads && (
              <button
                type="button"
                className={join('k-treemap-head', classes.head)}
                style={{
                  left: pct(block.x0, TREEMAP_W),
                  top: pct(block.y0, TREEMAP_H),
                  width: pct(block.x1 - block.x0, TREEMAP_W),
                }}
                onClick={onGroup ? () => onGroup(block.name) : undefined}
              >
                {block.name}
              </button>
            )}
            {block.cells.map((cell, i) => {
              const { name, text, change } = describe(cell.data)
              const big = cell.x1 - cell.x0 >= MIN_TEXT_W && cell.y1 - cell.y0 >= MIN_TEXT_H
              return (
                <Cell
                  key={cellKey ? cellKey(cell.data) : i}
                  step={colorStep(change, limit)}
                  sign={change === null || !Number.isFinite(change) ? 0 : Math.sign(change)}
                  className={join('k-treemap-cell', classes.cell)}
                  style={{
                    left: pct(cell.x0, TREEMAP_W),
                    top: pct(cell.y0, TREEMAP_H),
                    width: pct(cell.x1 - cell.x0, TREEMAP_W),
                    height: pct(cell.y1 - cell.y0, TREEMAP_H),
                  }}
                  name={name}
                  text={text}
                  big={big}
                  nameClass={join('k-treemap-name', classes.name)}
                  valueClass={join('k-treemap-value', classes.value)}
                  onItem={onItem ? () => onItem(cell.data) : undefined}
                />
              )
            })}
          </div>
        ))}
      </div>
      <ol className={join('k-treemap-legend', classes.legend)} aria-hidden="true">
        {STEPS.map((step) => (
          <li key={step} className={`is-step${step}`}>
            {legendText(step)}
          </li>
        ))}
      </ol>
    </figure>
  )
}
