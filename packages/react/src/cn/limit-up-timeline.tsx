// SPDX-License-Identifier: MIT
import { useState, type CSSProperties } from 'react'
import { cn } from '../lib/cn.ts'
import { ToggleGroup, ToggleGroupItem } from '../primitives/toggle-group.tsx'
import { BoardMark } from './board-mark.tsx'
import { formatCnAmount } from './format.ts'
import { cnLabelsZh, type TimelineLabels } from './labels.ts'
import { StreakBadge } from './streak-badge.tsx'
import type { CnPhase } from './session.ts'
import {
  filterByTheme,
  groupStations,
  phaseSummary,
  snakeRows,
  themeCounts,
  type TimelineItem,
  type TimelineOrder,
} from './timeline-model.ts'
import { DASH } from './value.ts'

// 涨停时间线（#110，信息结构取自复盘吧看盘工作台的「涨停路线图」，样子是 Graphite 的）：蛇形时刻轴，按分钟聚合封板时刻成站点（时间胶囊 14:49），
// 一行 perRow 站，奇数行左到右、偶数行右到左，行尾拐弯，箭头指向较新的时刻，行尾标「越来越早」；站点下挂小卡（名称、连板徽标、题材、成交额，20cm 等标板块）；
// 站点按时段着色（集合竞价 / 早盘 / 午盘 / 尾盘，颜色只读 token），顶上有排序（最新在前 / 最早在前）、时段图例（站数与只数）、题材 chip 筛。
// 午休与 09:25–09:30 不占宽度：站点等距排，不按时间比例拉开。包里不带文案语言与数据源；没有封板时刻的票不上轴，只在一行字里报数。

export type LimitUpTimelineProps = {
  /**
   * The limit-up stocks with their first-seal time; the timeline groups them by minute.
   * 涨停的票与首次封板时刻；时间线按分钟聚合。
   */
  items: readonly TimelineItem[]
  /**
   * Sort order (controlled): latest first or earliest first.
   * 排序（受控）：最新在前 / 最早在前。
   */
  order?: TimelineOrder
  /**
   * Initial sort order when uncontrolled; latest first by default.
   * 不受控时的初始排序；默认最新在前。
   */
  defaultOrder?: TimelineOrder
  /**
   * Called with the new order.
   * 排序变化时的回调。
   */
  onOrderChange?: (order: TimelineOrder) => void
  /**
   * The theme filter (controlled); null means all themes.
   * 题材筛选（受控）；null 是全部。
   */
  theme?: string | null
  /**
   * Initial theme filter when uncontrolled; all themes by default.
   * 不受控时的初始题材筛选；默认全部。
   */
  defaultTheme?: string | null
  /**
   * Called with the new theme filter.
   * 题材筛选变化时的回调。
   */
  onThemeChange?: (theme: string | null) => void
  /**
   * How many stations fit in one row of the snake; 7 by default.
   * 蛇形一行放几站；默认 7。
   */
  perRow?: number
  /**
   * Called when a stock card is picked; without it the cards are plain.
   * 点个股小卡的回调；不给小卡就是普通块。
   */
  onSelect?: (item: TimelineItem) => void
  /**
   * Text pack; the Simplified Chinese default is used when omitted.
   * 文案；不传用简体中文默认。
   */
  labels?: TimelineLabels
  /** Extra class names. */
  className?: string
}

const PHASES: readonly CnPhase[] = ['auction', 'morning', 'afternoon', 'late']

export function LimitUpTimeline({
  items,
  order: orderProp,
  defaultOrder = 'latest',
  onOrderChange,
  theme: themeProp,
  defaultTheme = null,
  onThemeChange,
  perRow = 7,
  onSelect,
  labels = cnLabelsZh.timeline,
  className,
}: LimitUpTimelineProps) {
  const [orderState, setOrderState] = useState<TimelineOrder>(defaultOrder)
  const [themeState, setThemeState] = useState<string | null>(defaultTheme)
  const order = orderProp ?? orderState
  const theme = themeProp === undefined ? themeState : themeProp
  const chips = themeCounts(items)
  const shown = filterByTheme(items, theme)
  const { stations, untimed } = groupStations(shown, order)
  const summary = phaseSummary(stations)
  const rows = snakeRows(stations, perRow)
  const size = Math.max(1, Math.floor(perRow))

  const pickTheme = (next: string | null) => {
    setThemeState(next)
    onThemeChange?.(next)
  }

  return (
    <section className={cn('k-tl', className)} data-slot="limit-up-timeline" aria-label={labels.region}>
      <header className="k-tl-head">
        <h3 className="k-tl-title">{labels.title}</h3>
        <span className="k-tl-summary" data-slot="timeline-summary">
          {labels.summary(
            stations.reduce((sum, station) => sum + station.items.length, 0),
            stations.length,
          )}
        </span>
      </header>
      <div className="k-tl-bar">
        <div className="k-tl-field">
          <span className="k-tl-field-label">{labels.sort.label}</span>
          <ToggleGroup
            variant="sm"
            aria-label={labels.sort.label}
            value={order}
            onValueChange={(next) => {
              const value = next as TimelineOrder
              setOrderState(value)
              onOrderChange?.(value)
            }}
          >
            <ToggleGroupItem value="latest">{labels.sort.latestFirst}</ToggleGroupItem>
            <ToggleGroupItem value="earliest">{labels.sort.earliestFirst}</ToggleGroupItem>
          </ToggleGroup>
        </div>
        <ul className="k-tl-legend" data-slot="timeline-legend">
          {PHASES.map((phase) => (
            <li key={phase} data-phase={phase}>
              <i aria-hidden="true" />
              <span>{labels.phases[phase]}</span>
              <b>{labels.phaseCount(summary[phase].stations, summary[phase].stocks)}</b>
            </li>
          ))}
        </ul>
        {chips.length > 0 && (
          <div className="k-tl-chips" role="group" aria-label={labels.themeFilter} data-slot="timeline-chips">
            <button type="button" className="k-tl-chip" aria-pressed={theme === null} onClick={() => pickTheme(null)}>
              {labels.allThemes}
            </button>
            {chips.map((chip) => (
              <button
                key={chip.name}
                type="button"
                className="k-tl-chip"
                aria-pressed={theme === chip.name}
                onClick={() => pickTheme(chip.name)}
              >
                {labels.themeChip(chip.name, chip.count)}
              </button>
            ))}
          </div>
        )}
      </div>
      {untimed.length > 0 && (
        <p className="k-tl-untimed" data-slot="timeline-untimed">
          {labels.noTime(untimed.length)}
        </p>
      )}
      {stations.length === 0 ? (
        <p className="k-tl-empty" data-slot="timeline-empty">
          {labels.empty}
        </p>
      ) : (
        <div className="k-tl-rows" style={{ '--tl-cols': size } as CSSProperties}>
          {rows.map((row, position) => {
            const first = row.sequence[0]!
            const last = row.sequence[row.sequence.length - 1]!
            // 箭头指向较新的时刻：最新在前时，较新在序列的前面；最早在前时在后面。
            const towardsNewer = (order === 'earliest') === (row.flow === 'ltr') ? 'right' : 'left'
            const missing = size - row.display.length
            return (
              <div
                key={row.index}
                className="k-tl-row"
                data-slot="timeline-row"
                data-flow={row.flow}
                data-last={position === rows.length - 1 ? 'true' : undefined}
              >
                <span className="k-tl-range">{labels.rowRange(row.index, first.key, last.key)}</span>
                <span className="k-tl-hint" aria-hidden="true">
                  {row.flow === 'ltr' ? '' : '← '}
                  {order === 'latest' ? labels.towardsEarlier : labels.towardsLater}
                  {row.flow === 'ltr' ? ' →' : ''}
                </span>
                {row.display.length >= 2 && (
                  <i
                    className="k-tl-arrow"
                    data-dir={towardsNewer}
                    aria-hidden="true"
                    style={{
                      left: `${(((row.flow === 'rtl' ? missing : 0) + Math.floor(row.display.length / 2)) / size) * 100}%`,
                    }}
                  />
                )}
                <ol className="k-tl-stations">
                  {row.display.map((station, slot) => (
                    <li
                      key={station.key}
                      className="k-tl-station"
                      data-slot="timeline-station"
                      data-key={station.key}
                      data-phase={station.phase}
                      style={row.flow === 'rtl' ? { gridColumnStart: missing + slot + 1 } : undefined}
                    >
                      <span className="k-tl-time" title={labels.station(station.key, station.items.length)}>
                        {station.key}
                      </span>
                      <span className="k-tl-track" aria-hidden="true">
                        <i />
                      </span>
                      <ul className="k-tl-cards">
                        {station.items.map((item) => {
                          const body = (
                            <>
                              <span className="k-tl-card-line">
                                <b className="k-tl-card-name">{item.name}</b>
                                {item.board ? <BoardMark kind={item.board} /> : null}
                              </span>
                              <span className="k-tl-card-line">
                                <StreakBadge streak={item.streak} />
                                <span className="k-tl-card-theme">{item.themes?.[0] ?? DASH}</span>
                                <span className="k-tl-card-amount">{formatCnAmount(item.amount)}</span>
                              </span>
                            </>
                          )
                          return (
                            <li key={item.code} data-slot="timeline-card" data-code={item.code}>
                              {onSelect ? (
                                <button type="button" className="k-tl-card" onClick={() => onSelect(item)}>
                                  {body}
                                </button>
                              ) : (
                                <div className="k-tl-card">{body}</div>
                              )}
                            </li>
                          )
                        })}
                      </ul>
                    </li>
                  ))}
                </ol>
                {position < rows.length - 1 && <i className="k-tl-turn" aria-hidden="true" />}
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
