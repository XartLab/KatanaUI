// SPDX-License-Identifier: MIT
// 组件卡 FlowGauges（design/katana-console/project/components/FlowGauges，#1929）：订单流四个仪表排成一行。
// 口径照卡里引的 ATAS 8.0.12 Widgets 帮助页（Market Pressure、Price Change、DOM Pressure、Delta Divergence；只看它们读什么、给什么范围，2026-11-14 读卡内的引用，页面本身待核对）。
// 这个包只收算好的数与区间，怎么算（窗口、逐笔方向、档位）不在这里：算法在应用的 Worker 里，包里不放。
// 压力不是盈亏：零轴居中的条用 series-1（正）/ series-2（负），不用涨跌色；方向同时靠左右位置与带符号的数字，不只靠颜色。
// 窗口不足就是 N/A，不填零（value 传 null、或矩阵那一行给 null）；无逐笔方向的估算值标「估算」，且灰显。不做声音、不做闪烁：这是读数，不是告警。
import type { ReactNode } from 'react'

/** 零轴居中的两个量：Market Pressure 与 Price Change，−100…+100。 */
export type FlowSignedGauge = {
  kind: 'pressure' | 'priceChange'
  id: string
  /** 点阵小标题（含周期，如 MARKET PRESSURE · 1m）。 */
  title: string
  /** −100 到 +100；窗口不足传 null（显示 N/A，条不画）。 */
  value: number | null
  /** 已格式化的数（如 +62、−18）。 */
  valueText: string
  /** 一行说明（口径、窗口）。 */
  note?: ReactNode
  /** 无逐笔方向、数是估出来的：灰显并标估算。 */
  estimated?: boolean
}

/** 前 N 档挂单：从最优价往外，每档的量。 */
export type FlowDomGauge = {
  kind: 'dom'
  id: string
  title: string
  /** 买盘各档的量；两边都空就是 N/A。 */
  bids: readonly number[]
  asks: readonly number[]
  /** 读屏用的整句（如「买盘 71%，卖盘 29%」）：柱子本身对读屏是空的。 */
  summary: string
  note?: ReactNode
}

export type FlowCellState = 'off' | 'on' | 'ok' | 'warn'

/** 多周期 Delta 与价格背离：每行一个周期，一行若干格 LED；cells 为 null 是 N/A（数据不足）。 */
export type FlowDivergenceGauge = {
  kind: 'divergence'
  id: string
  title: string
  rows: readonly {
    /** 周期（5s、1m……）。 */
    window: string
    cells: readonly FlowCellState[] | null
    /** 读屏与悬停用的整句（这一行各格是什么意思，由调用方写）。 */
    summary: string
  }[]
  note?: ReactNode
}

export type FlowGaugeData = FlowSignedGauge | FlowDomGauge | FlowDivergenceGauge

export type FlowGaugesProps = {
  gauges: readonly FlowGaugeData[]
  /** 整行的读屏名。 */
  label: string
  /** 没有数的位置写什么，默认 N/A。 */
  naText?: string
  /** 估算标记的字，默认 est.。 */
  estimateText?: string
  className?: string
}

/** 零轴居中的条：正数从中线往右、负数往左，各占半宽；越界贴边，null 与非有限数不画。返回 left、width（百分数）。纯函数。 */
export function signedSpan(value: number | null, limit = 100): { left: number; width: number } | null {
  if (value === null || !Number.isFinite(value) || limit <= 0) return null
  const half = (Math.min(limit, Math.abs(value)) / limit) * 50
  return value >= 0 ? { left: 50, width: half } : { left: 50 - half, width: half }
}

/** 挂单柱的高度（百分数）：按两边最大的一档排，最大的 100。两边都没有量返回 null（N/A）。纯函数。 */
export function depthHeights(
  bids: readonly number[],
  asks: readonly number[],
): { bids: number[]; asks: number[] } | null {
  const all = [...bids, ...asks].filter((size) => Number.isFinite(size) && size > 0)
  if (all.length === 0) return null
  const top = Math.max(...all)
  const scale = (sizes: readonly number[]) => sizes.map((size) => (size > 0 ? (size / top) * 100 : 0))
  return { bids: scale(bids), asks: scale(asks) }
}

function Signed({ gauge, naText, estimateText }: { gauge: FlowSignedGauge; naText: string; estimateText: string }) {
  const span = signedSpan(gauge.value)
  const negative = gauge.value !== null && gauge.value < 0
  return (
    <>
      <span className={`k-flow-value${span ? '' : ' is-na'}`}>
        {span ? gauge.valueText : naText}
        {span && gauge.estimated ? <small className="k-flow-est">{estimateText}</small> : null}
      </span>
      <span
        className="k-flow-zero"
        role={span ? 'meter' : 'img'}
        aria-label={span ? gauge.title : `${gauge.title} ${naText}`}
        aria-valuemin={span ? -100 : undefined}
        aria-valuemax={span ? 100 : undefined}
        aria-valuenow={span ? (gauge.value as number) : undefined}
        aria-valuetext={span ? gauge.valueText : undefined}
      >
        {span && (
          <i
            className={negative ? 'is-neg' : 'is-pos'}
            style={{ left: `${span.left}%`, width: `${span.width}%` }}
            aria-hidden="true"
          />
        )}
      </span>
    </>
  )
}

function Dom({ gauge, naText }: { gauge: FlowDomGauge; naText: string }) {
  const heights = depthHeights(gauge.bids, gauge.asks)
  if (!heights) return <span className="k-flow-value is-na">{naText}</span>
  return (
    <span className="k-flow-depth" role="img" aria-label={gauge.summary}>
      {heights.bids.map((h, i) => (
        <i key={`b${i}`} className="is-bid" style={{ height: `${h}%` }} />
      ))}
      {heights.asks.map((h, i) => (
        <i key={`a${i}`} className="is-ask" style={{ height: `${h}%` }} />
      ))}
    </span>
  )
}

function Divergence({ gauge, naText }: { gauge: FlowDivergenceGauge; naText: string }) {
  return (
    <span className="k-flow-matrix">
      {gauge.rows.map((row) => (
        <span className="k-flow-matrix-row" key={row.window} role="img" aria-label={`${row.window}: ${row.summary}`}>
          <span className="k-flow-window">{row.window}</span>
          {row.cells === null ? (
            <span className="k-flow-na">{naText}</span>
          ) : (
            row.cells.map((cell, i) => <i key={i} className={`k-flow-led is-${cell}`} />)
          )}
        </span>
      ))}
    </span>
  )
}

export function FlowGauges({ gauges, label, naText = 'N/A', estimateText = 'est.', className }: FlowGaugesProps) {
  return (
    <div className={`k-flow${className ? ` ${className}` : ''}`} role="group" aria-label={label}>
      {gauges.map((gauge) => (
        <section
          className="k-flow-cell-box"
          key={gauge.id}
          data-kind={gauge.kind}
          data-estimated={
            gauge.kind === 'pressure' || gauge.kind === 'priceChange' ? gauge.estimated || undefined : undefined
          }
          aria-label={gauge.title}
        >
          <span className="k-flow-title">{gauge.title}</span>
          {gauge.kind === 'dom' ? (
            <Dom gauge={gauge} naText={naText} />
          ) : gauge.kind === 'divergence' ? (
            <Divergence gauge={gauge} naText={naText} />
          ) : (
            <Signed gauge={gauge} naText={naText} estimateText={estimateText} />
          )}
          {gauge.note ? <span className="k-flow-note">{gauge.note}</span> : null}
        </section>
      ))}
    </div>
  )
}
