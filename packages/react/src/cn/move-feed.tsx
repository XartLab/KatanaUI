// SPDX-License-Identifier: MIT
import { useId, useState } from 'react'
import { cn } from '../lib/cn.ts'
import { Checkbox } from '../primitives/checkbox.tsx'
import { cnLabelsZh, type MoveFeedLabels } from './labels.ts'
import {
  clockText,
  filterBySymbol,
  filterMoves,
  freshIds,
  moveTone,
  moveValue,
  sortFeed,
  toggleType,
  typeCounts,
  type MoveItem,
  type MoveTypeDef,
} from './move-feed-model.ts'

// 异动时间流（#110，盘口异动的看盘流，样子是 Graphite 的）：一行一条，时间 · 名称 · 类型胶囊 · 数值；新的从顶上进（按时间从新到旧排，新来的那一行淡入一下）。
// 类型胶囊按涨 / 跌 / 量 / 板着色（涨跌读 --pnl-up / --pnl-down 跟 data-updown，量是中性强调，板是警示色）；顶上一排类型多选筛（点一个只看它，再点取消，一个都没选是全部）。
// 点行触发 onSelect（联动个股页、K 线）；selectedId 标出当前联动的那一行。不带数据：条目由调用方给；文字走 labels，类型名也走 labels.types。

export type MoveFeedProps = {
  /**
   * The moves, in any order; the feed sorts them newest first and animates rows that were not there on the last render.
   * 异动条目（次序随意）；流里按时间从新到旧排，新出现的行淡入。
   */
  items: readonly MoveItem[]
  /**
   * Own move types (key, label, tone) on top of the built-in ones; a type with the same key overrides the built-in one.
   * 自定义的异动类型（key、字、色调），盖掉随包的同名类型。
   */
  types?: readonly MoveTypeDef[]
  /**
   * Selected type keys (controlled); empty means all types.
   * 选中的类型（受控）；空是全部。
   */
  selectedTypes?: readonly string[]
  /**
   * Initial selected types when uncontrolled; none by default.
   * 不受控时的初始选中；默认一个都没选。
   */
  defaultSelectedTypes?: readonly string[]
  /**
   * Called with the new selected types.
   * 选中的类型变化时的回调。
   */
  onSelectedTypesChange?: (types: string[]) => void
  /**
   * The symbol on screen (`BTC-USDT-SWAP`). Giving it adds the 「只看当前品种」 switch; rows are matched on `item.symbol` (then `code`, then `name`), ignoring case.
   * 当前看的品种；给了才有「只看当前品种」开关，按行的 symbol（再 code、再 name）比，不分大小写。
   */
  currentSymbol?: string | null
  /**
   * Show only rows of `currentSymbol` (controlled). Without a `currentSymbol`, or without `labels.onlyCurrent`, the switch is absent and nothing is filtered.
   * 只看当前品种（受控）；没给 currentSymbol、或 labels.onlyCurrent 缺省，就没有开关、也不筛。
   */
  onlyCurrent?: boolean
  /**
   * Initial state of the switch when uncontrolled; off by default.
   * 不受控时开关的初始状态；默认关。
   */
  defaultOnlyCurrent?: boolean
  /**
   * Called with the new state of the switch.
   * 开关变化时的回调。
   */
  onOnlyCurrentChange?: (onlyCurrent: boolean) => void
  /**
   * Called when a row is picked; without it the rows are plain.
   * 点行的回调；不给行就是普通行。
   */
  onSelect?: (item: MoveItem) => void
  /**
   * The id of the row currently linked elsewhere (highlighted).
   * 当前联动的那一行的 id（高亮）。
   */
  selectedId?: string | null
  /**
   * The most rows drawn; 200 by default.
   * 最多画几行；默认 200。
   */
  limit?: number
  /**
   * Height of the scrolling list in px; 320 by default.
   * 列表高度（px），超出滚动；默认 320。
   */
  height?: number
  /**
   * Text pack; the Simplified Chinese default is used when omitted.
   * 文案；不传用简体中文默认。
   */
  labels?: MoveFeedLabels
  /** Extra class names. */
  className?: string
}

export function MoveFeed({
  items,
  types,
  selectedTypes: selectedProp,
  defaultSelectedTypes = [],
  onSelectedTypesChange,
  currentSymbol,
  onlyCurrent: onlyCurrentProp,
  defaultOnlyCurrent = false,
  onOnlyCurrentChange,
  onSelect,
  selectedId = null,
  limit = 200,
  height = 320,
  labels = cnLabelsZh.moveFeed,
  className,
}: MoveFeedProps) {
  const [selectedState, setSelectedState] = useState<readonly string[]>(defaultSelectedTypes)
  const selected = selectedProp ?? selectedState
  const labelOf = (type: string) => types?.find((def) => def.key === type)?.label ?? labels.types[type] ?? type
  const [onlyState, setOnlyState] = useState(defaultOnlyCurrent)
  // 开关要有字才画；没字就没有开关，也不按品种筛（用户没法关它）。
  const hasCurrent =
    typeof currentSymbol === 'string' && currentSymbol.trim() !== '' && labels.onlyCurrent !== undefined
  const only = hasCurrent && (onlyCurrentProp ?? onlyState)
  const scoped = only ? filterBySymbol(items, currentSymbol) : items
  const checkId = useId()
  const chips = typeCounts(scoped, types)
  const shown = sortFeed(filterMoves(scoped, selected)).slice(0, Math.max(0, Math.floor(limit)))

  // 新出现的行：和上一轮的 id 比。首次渲染没有「新」，免得一开页整屏都在闪。
  // 用渲染期 setState（React 认可的派生写法）而不是读 ref，渲染里不碰 ref。
  const [seen, setSeen] = useState(() => ({ ids: new Set(items.map((item) => item.id)), fresh: new Set<string>() }))
  if (items.length !== seen.ids.size || items.some((item) => !seen.ids.has(item.id))) {
    setSeen({ ids: new Set(items.map((item) => item.id)), fresh: freshIds(seen.ids, items) })
  }
  const fresh = seen.fresh

  const toggle = (type: string | null) => {
    const next = type === null ? [] : toggleType(selected, type)
    setSelectedState(next)
    onSelectedTypesChange?.(next)
  }

  return (
    <section className={cn('k-move', className)} data-slot="move-feed" aria-label={labels.region}>
      <header className="k-move-head">
        <div className="k-move-chips" role="group" aria-label={labels.filter} data-slot="move-filter">
          <button
            type="button"
            className="k-move-chip"
            aria-pressed={selected.length === 0}
            onClick={() => toggle(null)}
          >
            {labels.all}
          </button>
          {chips.map(({ type, count }) => (
            <button
              key={type}
              type="button"
              className="k-move-chip"
              data-type={type}
              data-tone={moveTone(type, types)}
              aria-pressed={selected.includes(type)}
              onClick={() => toggle(type)}
            >
              {labels.typeChip(labelOf(type), count)}
            </button>
          ))}
        </div>
        {hasCurrent && (
          <span className="k-move-only" data-slot="move-only-current">
            <Checkbox
              id={checkId}
              checked={only}
              onCheckedChange={(next) => {
                setOnlyState(next === true)
                onOnlyCurrentChange?.(next === true)
              }}
            />
            <label htmlFor={checkId}>{labels.onlyCurrent}</label>
          </span>
        )}
        <span className="k-move-summary" data-slot="move-summary">
          {labels.summary(filterMoves(scoped, selected).length)}
        </span>
      </header>
      {shown.length === 0 ? (
        <p className="k-move-empty" role="status">
          {labels.empty}
        </p>
      ) : (
        <ul className="k-move-list" style={{ maxHeight: height }} data-slot="move-list">
          {shown.map((item) => {
            const tone = moveTone(item.type, types)
            const value = moveValue(item)
            const time = clockText(item.time)
            const type = labelOf(item.type)
            const cells = (
              <>
                <span className="k-move-time">{time}</span>
                <span className="k-move-name">
                  {item.name}
                  {item.code && <span className="k-move-code">{item.code}</span>}
                </span>
                <span className="k-move-type" data-slot="move-type" data-tone={tone}>
                  {type}
                </span>
                <span className="k-move-value" data-slot="move-value" data-direction={value.direction}>
                  {value.text}
                </span>
              </>
            )
            const aria = labels.row(time, item.name, type, value.text)
            return (
              <li
                key={item.id}
                className="k-move-item"
                data-slot="move-row"
                data-id={item.id}
                data-type={item.type}
                data-fresh={fresh.has(item.id) || undefined}
                data-selected={selectedId === item.id || undefined}
              >
                {onSelect ? (
                  <button
                    type="button"
                    className="k-move-row"
                    aria-label={aria}
                    aria-pressed={selectedId === null ? undefined : selectedId === item.id}
                    onClick={() => onSelect(item)}
                  >
                    {cells}
                  </button>
                ) : (
                  <div className="k-move-row">{cells}</div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
