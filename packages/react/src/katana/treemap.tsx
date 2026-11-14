// SPDX-License-Identifier: MIT
// 矩形树图：一格一项，颜色按涨跌分七档（跟涨跌配色走），格子够大写名字和数，点组头下钻，底部色例。
// 画法从应用的分析视图 TreemapView 提来（#1884，调用方零改动；原来照 TradingView 股票市场热图，#443）。
// 工具条（大小、颜色、分组的下拉、返回钮）是应用的事，从 toolbar 传进来；排布在 treemap-model.ts，调用方先排好再传 blocks。
import type { ReactNode } from 'react'
import { colorStep, TREEMAP_H, TREEMAP_W, type TreemapBlock } from './treemap-model.ts'

/** 格子多小就不写字（排布单位的宽、高）。 */
const MIN_TEXT_W = 48
const MIN_TEXT_H = 28

const pct = (value: number, total: number) => `${(value / total) * 100}%`

export type TreemapClasses = Partial<
  Record<'root' | 'bar' | 'plot' | 'group' | 'head' | 'cell' | 'name' | 'value' | 'legend', string>
>

export type TreemapProps<T> = {
  blocks: readonly TreemapBlock<T>[]
  /** 画组头（可点下钻）；下钻之后不画。 */
  heads?: boolean
  /** 一格上写什么：名字、数的文字、颜色用的涨跌数（null 是没有数）。 */
  describe: (data: T) => { name: string; text: string; change: number | null }
  /** 色例两端是多少（小数）。 */
  limit?: number
  /** 色例上每一档写的字（−3 到 +3）。 */
  legendText: (step: number) => string
  toolbar?: ReactNode
  onGroup?: (name: string) => void
  onItem?: (data: T) => void
  classes?: TreemapClasses
}

const join = (base: string, extra?: string) => (extra ? `${base} ${extra}` : base)
const STEPS = [-3, -2, -1, 0, 1, 2, 3]

export function Treemap<T>({
  blocks,
  heads = false,
  describe,
  limit = 0.03,
  legendText,
  toolbar,
  onGroup,
  onItem,
  classes = {},
}: TreemapProps<T>) {
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
              const step = colorStep(change, limit)
              const big = cell.x1 - cell.x0 >= MIN_TEXT_W && cell.y1 - cell.y0 >= MIN_TEXT_H
              return (
                <div
                  key={i}
                  className={`${join('k-treemap-cell', classes.cell)} is-step${step === null ? 'na' : step}${onItem ? ' is-link' : ''}`}
                  style={{
                    left: pct(cell.x0, TREEMAP_W),
                    top: pct(cell.y0, TREEMAP_H),
                    width: pct(cell.x1 - cell.x0, TREEMAP_W),
                    height: pct(cell.y1 - cell.y0, TREEMAP_H),
                  }}
                  title={`${name} ${text}`}
                  role={onItem ? 'button' : undefined}
                  tabIndex={onItem ? 0 : undefined}
                  aria-label={`${name} ${text}`}
                  onClick={onItem ? () => onItem(cell.data) : undefined}
                  onKeyDown={
                    onItem
                      ? (event) => {
                          if (event.key === 'Enter') onItem(cell.data)
                        }
                      : undefined
                  }
                >
                  {big && (
                    <>
                      <span className={join('k-treemap-name', classes.name)}>{name}</span>
                      <span className={join('k-treemap-value', classes.value)}>{text}</span>
                    </>
                  )}
                </div>
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
