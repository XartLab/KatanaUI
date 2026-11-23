// SPDX-License-Identifier: MIT
/**
 * Options chain in T layout: the strike in the middle, calls on the left, puts on the right, configurable columns per wing, the at-the-money row
 * highlighted, the in-the-money zone shaded, an expiry switch and a click on any quote cell reported to the caller.
 * 期权 T 型报价（#104 账户四件之一，照 KATANAview 设计稿 OptionsChain 的版式：行权价居中、左认购右认沽、平值行强调、实值侧轻微底色；
 * 设计稿「不用涨跌色，认购认沽靠位置区分」这一条沿用）：每翼的列可配（买价、卖价、最新、IV、Delta、持仓量），认购翼镜像排，
 * 配置里排第一的字段两翼都贴着行权价；平值按标的价算（离得最近的行权价），实值区是认购在平值之下、认沽在平值之上。
 * 点任一格回调 onQuoteSelect(strike, side, field)，件不下单；到期日是调用方传的选项，切换只通知（rows 由调用方换）。
 * 键盘：格子是方向键走的单一 Tab 停靠点（roving tabindex），Enter 或空格选中。
 */
import { useRef, useState, type KeyboardEvent } from 'react'
import { cn } from '../../lib/cn.ts'
import { ToggleGroup, ToggleGroupItem } from '../../primitives/toggle-group.tsx'
import {
  DEFAULT_FIELDS,
  atmStrike,
  formatOptionField,
  isItm,
  sortedRows,
  wingFields,
  type OptionField,
  type OptionQuote,
  type OptionRow,
  type OptionSide,
} from './options-model.ts'

export type { OptionField, OptionQuote, OptionRow, OptionSide } from './options-model.ts'

/** One expiry the caller offers. */
export type OptionExpiry = {
  id: string
  /** Text on the switch button (「11-29」). */
  label: string
  /** Small text after the label (「7 天」). */
  note?: string
}

/** Texts of OptionsChain (the package ships no text). */
export type OptionsChainLabels = {
  /** Accessible name of the chain. 报价表的读屏名。 */
  region: string
  /** Accessible name of the expiry switch. 到期日切换的读屏名。 */
  expiry: string
  /** Name before the underlying price (「标的」). */
  underlying: string
  call: string
  put: string
  strike: string
  fields: Record<OptionField, string>
  /** Text of the at-the-money marker on the strike (「平值」). */
  atm: string
  /** Accessible name of a quote cell (「64000 认购 买价 1,250.00」). */
  cell: (strike: number, side: OptionSide, field: OptionField, text: string) => string
  /** Text when there are no rows. */
  empty: string
}

export type OptionsChainProps = {
  /** Rows of the selected expiry, any order (sorted by strike here). */
  rows: readonly OptionRow[]
  /** Underlying price: decides the at-the-money row and the in-the-money zone. */
  underlyingPrice: number
  /** Expiries to switch between. */
  expiries: readonly OptionExpiry[]
  /** The selected expiry id. */
  expiry: string
  /** Called with the id of the expiry the user picked; the caller swaps `rows`. */
  onExpiryChange?: (id: string) => void
  /** Columns of each wing, in the order they are listed from the strike outward on the put side; defaults to bid, ask, last, IV, delta, open interest. */
  fields?: readonly OptionField[]
  /** Called when a quote cell is pressed (click, Enter or Space). */
  onQuoteSelect?: (strike: number, side: OptionSide, field: OptionField) => void
  /** How a cell value is written; defaults to prices with two decimals, IV with one and a percent sign, delta with two. */
  formatValue?: (value: number | null | undefined, field: OptionField) => string
  /** How the underlying price and strikes are written; defaults to the plain number. */
  formatStrike?: (value: number) => string
  /** Texts. */
  labels: OptionsChainLabels
  /** Extra class name on the root. */
  className?: string
}

type Cell = { side: OptionSide; field: OptionField; quote: OptionQuote | undefined }

const plain = (value: number) => String(value)

export function OptionsChain({
  rows,
  underlyingPrice,
  expiries,
  expiry,
  onExpiryChange,
  fields = DEFAULT_FIELDS,
  onQuoteSelect,
  formatValue = (value, field) => formatOptionField(field, value),
  formatStrike = plain,
  labels,
  className,
}: OptionsChainProps) {
  const sorted = sortedRows(rows)
  const atm = atmStrike(
    sorted.map((row) => row.strike),
    underlyingPrice,
  )
  const callFields = wingFields('call', fields)
  const putFields = wingFields('put', fields)
  const width = fields.length
  const [active, setActive] = useState<[number, number]>([0, 0])
  const grid = useRef<HTMLDivElement>(null)
  const cellsOf = (row: OptionRow): Cell[] => [
    ...callFields.map((field): Cell => ({ side: 'call', field, quote: row.call })),
    ...putFields.map((field): Cell => ({ side: 'put', field, quote: row.put })),
  ]
  // 单一 Tab 停靠点：方向键在格子间走；越界夹在表内。
  const move = (event: KeyboardEvent<HTMLElement>, r: number, c: number) => {
    const last = [sorted.length - 1, width * 2 - 1] as const
    const next: Record<string, [number, number]> = {
      ArrowUp: [r - 1, c],
      ArrowDown: [r + 1, c],
      ArrowLeft: [r, c - 1],
      ArrowRight: [r, c + 1],
      Home: [r, 0],
      End: [r, last[1]],
    }
    const target = next[event.key]
    if (!target) return
    event.preventDefault()
    const to: [number, number] = [Math.min(Math.max(target[0], 0), last[0]), Math.min(Math.max(target[1], 0), last[1])]
    setActive(to)
    grid.current?.querySelector<HTMLElement>(`[data-r="${to[0]}"][data-c="${to[1]}"]`)?.focus()
  }
  const template = `repeat(${width}, minmax(56px, 1fr)) minmax(84px, auto) repeat(${width}, minmax(56px, 1fr))`
  return (
    <section className={cn('k-opt', className)} data-slot="options-chain">
      <div className="k-opt-bar">
        <ToggleGroup
          size="sm"
          aria-label={labels.expiry}
          value={expiry}
          onValueChange={(next) => {
            if (next) onExpiryChange?.(next)
          }}
        >
          {expiries.map((item) => (
            <ToggleGroupItem key={item.id} value={item.id} data-expiry={item.id}>
              {item.label}
              {item.note ? <span className="k-opt-note">{item.note}</span> : null}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <span className="k-opt-underlying" data-slot="options-underlying">
          <span className="k-opt-underlying-name">{labels.underlying}</span> {formatStrike(underlyingPrice)}
        </span>
      </div>
      {sorted.length === 0 ? (
        <p className="k-opt-empty" role="status">
          {labels.empty}
        </p>
      ) : (
        <div className="k-opt-scroll">
          <div ref={grid} className="k-opt-grid" role="grid" aria-label={labels.region} aria-rowcount={sorted.length}>
            <div className="k-opt-row k-opt-head" role="row" style={{ gridTemplateColumns: template }}>
              <span className="k-opt-wing" role="columnheader" style={{ gridRow: 1, gridColumn: `1 / ${width + 1}` }}>
                {labels.call}
              </span>
              <span
                className="k-opt-strike-head"
                role="columnheader"
                style={{ gridRow: '1 / 3', gridColumn: width + 1 }}
              >
                {labels.strike}
              </span>
              <span
                className="k-opt-wing"
                role="columnheader"
                style={{ gridRow: 1, gridColumn: `${width + 2} / ${width * 2 + 2}` }}
              >
                {labels.put}
              </span>
              {[...callFields, ...putFields].map((field, index) => (
                <span
                  key={`${index}-${field}`}
                  className="k-opt-field"
                  role="columnheader"
                  style={{ gridRow: 2, gridColumn: index < width ? index + 1 : index + 2 }}
                >
                  {labels.fields[field]}
                </span>
              ))}
            </div>
            {sorted.map((row, r) => {
              const isAtm = row.strike === atm
              const cells = cellsOf(row)
              return (
                <div
                  key={row.strike}
                  className="k-opt-row"
                  role="row"
                  aria-rowindex={r + 1}
                  data-strike={row.strike}
                  data-atm={isAtm ? 'true' : undefined}
                  style={{ gridTemplateColumns: template }}
                >
                  {cells.map((cell, c) => {
                    const value = cell.quote?.[cell.field]
                    const text = formatValue(value, cell.field)
                    const itm = isItm(cell.side, row.strike, underlyingPrice)
                    const column = c < width ? c + 1 : c + 2
                    const here = active[0] === r && active[1] === c
                    return (
                      <div
                        key={`${cell.side}-${cell.field}`}
                        role="gridcell"
                        className="k-opt-cell"
                        data-side={cell.side}
                        data-field={cell.field}
                        data-itm={itm ? 'true' : undefined}
                        style={{ gridColumn: column }}
                      >
                        <button
                          type="button"
                          className="k-opt-quote"
                          data-slot="option-quote"
                          data-r={r}
                          data-c={c}
                          tabIndex={here ? 0 : -1}
                          aria-disabled={value === null || value === undefined ? true : undefined}
                          aria-label={labels.cell(row.strike, cell.side, cell.field, text)}
                          onFocus={() => setActive([r, c])}
                          onKeyDown={(event) => move(event, r, c)}
                          onClick={() => {
                            if (value !== null && value !== undefined)
                              onQuoteSelect?.(row.strike, cell.side, cell.field)
                          }}
                        >
                          {text}
                        </button>
                      </div>
                    )
                  })}
                  <div
                    role="rowheader"
                    className="k-opt-strike"
                    data-slot="option-strike"
                    style={{ gridColumn: width + 1, gridRow: 1 }}
                  >
                    {formatStrike(row.strike)}
                    {isAtm ? <span className="k-opt-atm">{labels.atm}</span> : null}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </section>
  )
}
