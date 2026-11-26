// SPDX-License-Identifier: MIT
/**
 * Plots of the six derivatives cards: one spec per kind (panels, legend, tooltip rows, latest values) and the shared plot area that draws any spec.
 * 六张卡的画法：每种卡出一份 spec（面板、图例、悬停行、最新值），共用的绘图区按 spec 画；图都画在 viewBox 里，文字与十字线是叠上去的 HTML（同 SmallMultiples）。
 * 不加图表依赖：比例尺与路径用 lib/chart/series-geometry，轴与网格用 chart-kit，悬停窗用 LcdTooltip，扫读用 useScrubber（←→ 一格、Shift 三格、Home / End、Esc）。
 * 颜色只读语义 token：涨跌 --pnl-up / --pnl-down（随 data-updown 互换，颜色写在 theme/derivatives.css 里，按 data-tone 取），线用 series-1 / series-2，成交量柱是中性热度档。
 */
import type { CSSProperties, ReactNode } from 'react'
import { PlotGrid, PlotYAxis } from '../../lib/chart/chart-kit/plot-axes.tsx'
import { LcdTooltip, type LcdTooltipRow } from '../../lib/chart/chart-kit/lcd-tooltip.tsx'
import { formatCompactNumber } from '../../lib/chart/format/index.ts'
import { extent as extentOf } from '../../lib/num.ts'
import { linePath, makePlot, pct, PLOT_W, type Plot } from '../../lib/chart/series-geometry.ts'
import { useScrubber } from '../../lib/use-scrubber.ts'
import { formatRate } from '../funding-rate/funding-model.ts'
import type { DerivativesLabels } from './derivatives-labels.ts'
import {
  alignedAxes,
  basisOf,
  dataAxis,
  formatPercentTick,
  lastFinite,
  longShare,
  longShortRatioOf,
  orNull,
  signedBars,
  symmetricAxis,
  timeLabelIndexes,
  type AxisSpec,
  type DerivativesData,
  type DerivativesKind,
} from './derivatives-model.ts'

/** Number writers of the cards; every one has a default so a card works with no props but its data. */
export type DerivativesFormats = {
  /** Volumes and open interest (axis, tooltip); defaults to an English compact number (`1.20 M`). */
  formatAmount: (value: number) => string
  /** Prices and basis; defaults to thousands separators with at most two decimals. */
  formatPrice: (value: number) => string
  /** A bucket time in milliseconds; defaults to UTC `MM-DD HH:mm`. */
  formatTime: (time: number) => string
}

const priceFormatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 })

export const defaultFormats = (formatTime: (time: number) => string): DerivativesFormats => ({
  formatAmount: (value) => formatCompactNumber(value),
  formatPrice: (value) => priceFormatter.format(value),
  formatTime,
})

type Panel = {
  key: string
  /** Height in px. */
  height: number
  left: AxisSpec
  leftFormat: (value: number) => string
  right?: AxisSpec
  rightFormat?: (value: number) => string
  draw: (left: Plot, right: Plot | undefined) => ReactNode
}

type KeyShape = 'line' | 'bar'
/** A tooltip row whose value is already text (the live region reads it too). */
type TipRow = LcdTooltipRow & { value: string }

export type PlotSpec = {
  count: number
  times: readonly number[]
  panels: readonly Panel[]
  legend: readonly { key: string; label: string; color: string; shape: KeyShape }[]
  rows: (index: number) => TipRow[]
  /** Latest values in words, for the accessible name. */
  latest: string
}

const PAD = 6

/** Plot of a panel over `count` buckets with the given axis; ticks come from the axis (shared with the other side), not recomputed. */
function plotOf(count: number, axis: AxisSpec, height: number): Plot {
  const plot = makePlot(count, axis.domain, { height, padTop: PAD, padBottom: PAD, band: true, exact: true })
  return { ...plot, ticks: axis.ticks.map((value) => ({ value, y: plot.yAt(value) })) }
}

type Bar = { index: number; value: number; tone: string }

/** Bars from the zero line (or `base`) to the value; a bar is at least one unit tall so a tiny value stays visible. */
function Bars({ plot, bars, base = 0 }: { plot: Plot; bars: readonly Bar[]; base?: number }) {
  const width = plot.step * 0.64
  const y0 = plot.yAt(base)
  return (
    <>
      {bars.map((bar) => {
        const y1 = plot.yAt(bar.value)
        return (
          <rect
            key={bar.index}
            className="k-deriv-bar"
            data-slot="derivatives-bar"
            data-tone={bar.tone}
            x={plot.xAt(bar.index) - width / 2}
            y={Math.min(y0, y1)}
            width={width}
            height={Math.max(1, Math.abs(y1 - y0))}
          />
        )
      })}
    </>
  )
}

const ZeroLine = ({ plot }: { plot: Plot }) => (
  <line className="k-deriv-zero" x1={0} x2={PLOT_W} y1={plot.yAt(0)} y2={plot.yAt(0)} />
)

const Line = ({ plot, values, series }: { plot: Plot; values: readonly (number | null)[]; series: 1 | 2 }) => (
  <path
    className="k-deriv-line"
    data-slot="derivatives-line"
    data-series={series}
    d={linePath(values as readonly number[], plot)}
  />
)

const text = (value: number | null, write: (value: number) => string, none: string) =>
  value === null ? none : write(value)

type Input = { [K in DerivativesKind]: { kind: K; data: DerivativesData[K] } }[DerivativesKind]

/** The spec of one card. `height` is the total plot height in px. */
export function buildSpec(
  input: Input,
  labels: DerivativesLabels,
  formats: DerivativesFormats,
  height: number,
): PlotSpec {
  const { formatAmount, formatPrice } = formats
  const s = labels.series
  const sep = labels.separator
  const dash = '—'
  const times = input.data.map((point) => point.time)
  const count = input.data.length
  const row = (key: string, label: string, value: string, swatch?: string): TipRow => ({
    key,
    label,
    value,
    swatch,
  })

  switch (input.kind) {
    case 'openInterestVolume': {
      const oi = input.data.map((point) => orNull(point.openInterest))
      const volume = input.data.map((point) => orNull(point.volume))
      const [left, right] = alignedAxes(
        extentOf(
          volume.filter((v) => v !== null),
          true,
        ),
        dataExtent(oi),
        4,
      )
      return {
        count,
        times,
        panels: [
          {
            key: 'main',
            height,
            left,
            leftFormat: formatAmount,
            right,
            rightFormat: formatAmount,
            draw: (l, r) => (
              <>
                <Bars
                  plot={l}
                  bars={volume.flatMap((v, index) => (v === null ? [] : [{ index, value: v, tone: 'volume' }]))}
                />
                {r && <Line plot={r} values={oi} series={1} />}
              </>
            ),
          },
        ],
        legend: [
          { key: 'oi', label: s.openInterest, color: 'var(--series-1)', shape: 'line' },
          { key: 'vol', label: s.volume, color: 'var(--k-heat-3)', shape: 'bar' },
        ],
        rows: (i) => [
          row('oi', s.openInterest, text(oi[i] ?? null, formatAmount, dash), 'var(--series-1)'),
          row('vol', s.volume, text(volume[i] ?? null, formatAmount, dash), 'var(--k-heat-3)'),
        ],
        latest: `${s.openInterest} ${text(lastFinite(oi), formatAmount, dash)}${sep}${s.volume} ${text(lastFinite(volume), formatAmount, dash)}`,
      }
    }
    case 'fundingRate': {
      const rates = input.data.map((point) => orNull(point.rate))
      const axis = symmetricAxis(rates, 5)
      return {
        count,
        times,
        panels: [
          {
            key: 'main',
            height,
            left: axis,
            leftFormat: formatPercentTick,
            draw: (l) => (
              <>
                <ZeroLine plot={l} />
                <Bars plot={l} bars={signedBars(rates)} />
              </>
            ),
          },
        ],
        legend: [],
        rows: (i) => [row('rate', s.rate, text(rates[i] ?? null, formatRate, dash))],
        latest: text(lastFinite(rates), formatRate, labels.noLatest),
      }
    }
    case 'takerVolume': {
      const buy = input.data.map((point) => orNull(point.buy))
      const sell = input.data.map((point) => orNull(point.sell))
      const axis = symmetricAxis([...buy, ...sell], 5)
      const abs = (value: number) => formatAmount(Math.abs(value))
      return {
        count,
        times,
        panels: [
          {
            key: 'main',
            height,
            left: axis,
            leftFormat: abs,
            draw: (l) => (
              <>
                <ZeroLine plot={l} />
                <Bars
                  plot={l}
                  bars={buy.flatMap((v, index) => (v === null ? [] : [{ index, value: v, tone: 'up' }]))}
                />
                <Bars
                  plot={l}
                  bars={sell.flatMap((v, index) => (v === null ? [] : [{ index, value: -v, tone: 'down' }]))}
                />
              </>
            ),
          },
        ],
        legend: [
          { key: 'buy', label: s.buy, color: 'var(--pnl-up)', shape: 'bar' },
          { key: 'sell', label: s.sell, color: 'var(--pnl-down)', shape: 'bar' },
        ],
        rows: (i) => [
          row('buy', s.buy, text(buy[i] ?? null, formatAmount, dash), 'var(--pnl-up)'),
          row('sell', s.sell, text(sell[i] ?? null, formatAmount, dash), 'var(--pnl-down)'),
        ],
        latest: `${s.buy} ${text(lastFinite(buy), formatAmount, dash)}${sep}${s.sell} ${text(lastFinite(sell), formatAmount, dash)}`,
      }
    }
    case 'longShortRatio':
    case 'topTraderRatio': {
      const shares = input.data.map((point) => longShare(point))
      const ratios = input.data.map((point) => longShortRatioOf(point))
      const [left, right] = alignedAxes([0, 100], dataExtent(ratios), 5, true)
      const percent = (value: number) => `${(value * 100).toFixed(2)}%`
      const ratioText = (value: number | null) => text(value, (v) => v.toFixed(2), dash)
      return {
        count,
        times,
        panels: [
          {
            key: 'main',
            height,
            left,
            leftFormat: (value) => `${value}%`,
            right,
            rightFormat: (value) => String(Number(value.toFixed(2))),
            draw: (l, r) => (
              <>
                {shares.map((share, index) =>
                  share === null ? null : (
                    <g key={index}>
                      <Bars plot={l} bars={[{ index, value: share * 100, tone: 'up' }]} />
                      <Bars plot={l} bars={[{ index, value: 100, tone: 'down' }]} base={share * 100} />
                    </g>
                  ),
                )}
                {r && <Line plot={r} values={ratios} series={1} />}
              </>
            ),
          },
        ],
        legend: [
          { key: 'long', label: s.long, color: 'var(--pnl-up)', shape: 'bar' },
          { key: 'short', label: s.short, color: 'var(--pnl-down)', shape: 'bar' },
          { key: 'ratio', label: s.ratio, color: 'var(--series-1)', shape: 'line' },
        ],
        rows: (i) => {
          const share = shares[i] ?? null
          return [
            row('long', s.long, share === null ? dash : percent(share), 'var(--pnl-up)'),
            row('short', s.short, share === null ? dash : percent(1 - share), 'var(--pnl-down)'),
            row('ratio', s.ratio, ratioText(ratios[i] ?? null), 'var(--series-1)'),
          ]
        },
        latest: `${s.ratio} ${ratioText(lastFinite(ratios))}`,
      }
    }
    case 'basis': {
      const contract = input.data.map((point) => orNull(point.contract))
      const index = input.data.map((point) => orNull(point.index))
      const basis = input.data.map((point) => basisOf(point))
      const priceAxis = dataAxis([...contract, ...index], 4)
      const basisAxis = symmetricAxis(basis, 2)
      const gap = 10
      const lower = Math.round((height - gap) / 3)
      return {
        count,
        times,
        panels: [
          {
            key: 'price',
            height: height - gap - lower,
            left: priceAxis,
            leftFormat: formatPrice,
            draw: (l) => (
              <>
                <Line plot={l} values={contract} series={1} />
                <Line plot={l} values={index} series={2} />
              </>
            ),
          },
          {
            key: 'basis',
            height: lower,
            left: basisAxis,
            leftFormat: formatPrice,
            draw: (l) => (
              <>
                <ZeroLine plot={l} />
                <Bars plot={l} bars={signedBars(basis)} />
              </>
            ),
          },
        ],
        legend: [
          { key: 'contract', label: s.contract, color: 'var(--series-1)', shape: 'line' },
          { key: 'index', label: s.index, color: 'var(--series-2)', shape: 'line' },
          {
            key: 'basis',
            label: s.basis,
            color: 'linear-gradient(to bottom, var(--pnl-up) 50%, var(--pnl-down) 50%)',
            shape: 'bar',
          },
        ],
        rows: (i) => [
          row('contract', s.contract, text(contract[i] ?? null, formatPrice, dash), 'var(--series-1)'),
          row('index', s.index, text(index[i] ?? null, formatPrice, dash), 'var(--series-2)'),
          row('basis', s.basis, text(basis[i] ?? null, formatPrice, dash)),
        ],
        latest: `${s.basis} ${text(lastFinite(basis), formatPrice, labels.noLatest)}`,
      }
    }
  }
}

/** Lowest and highest finite value of a series, for an axis that hugs the data. */
function dataExtent(values: readonly (number | null)[]): [number, number] {
  return extentOf(values.filter((value): value is number => value !== null))
}

/** The legend: a short line or bar chip with its name, so a series is never told by color alone. */
export function PlotLegend({ legend }: { legend: PlotSpec['legend'] }) {
  if (legend.length === 0) return null
  return (
    <ul className="k-deriv-legend" data-slot="derivatives-legend">
      {legend.map((item) => (
        <li key={item.key} className="k-deriv-legend-item">
          <i className="k-deriv-key" data-shape={item.shape} style={{ '--k-deriv-key': item.color } as CSSProperties} />
          {item.label}
        </li>
      ))}
    </ul>
  )
}

/** The plot area of one card: panels stacked on one shared horizontal axis, one scrubber, one crosshair, one tooltip. */
export function PlotArea({
  spec,
  title,
  labels,
  formatTime,
}: {
  spec: PlotSpec
  title: string
  labels: DerivativesLabels
  formatTime: (time: number) => string
}) {
  const scrub = useScrubber({ count: spec.count, mode: 'band' })
  const plots = spec.panels.map((panel) => ({
    panel,
    left: plotOf(spec.count, panel.left, panel.height),
    right: panel.right ? plotOf(spec.count, panel.right, panel.height) : undefined,
  }))
  const active = scrub.index
  const first = plots[0]!.left
  const hasRight = spec.panels.some((panel) => panel.right)
  const stamp = active === null ? null : formatTime(spec.times[active]!)
  return (
    <div className="k-deriv-chart" data-slot="derivatives-chart">
      <div
        className="k-deriv-plot"
        role="group"
        aria-label={labels.plotAria(title, spec.latest)}
        data-right={hasRight || undefined}
        {...scrub.props}
      >
        {plots.map(({ panel, left, right }) => (
          <div key={panel.key} className="k-deriv-panel" data-slot="derivatives-panel" style={{ height: panel.height }}>
            <svg viewBox={`0 0 ${PLOT_W} ${panel.height}`} preserveAspectRatio="none" aria-hidden="true">
              <PlotGrid plot={left} />
              {panel.draw(left, right)}
            </svg>
            <PlotYAxis plot={left} format={panel.leftFormat} />
            {right && panel.rightFormat && (
              <>
                {right.ticks.map((tick) => (
                  <span
                    key={tick.value}
                    className="k-deriv-rtick"
                    data-slot="derivatives-rtick"
                    style={{ top: Math.round(tick.y) }}
                  >
                    {panel.rightFormat!(tick.value)}
                  </span>
                ))}
              </>
            )}
          </div>
        ))}
        {active !== null && (
          <>
            <span className="k-plot-cross" data-slot="derivatives-cross" style={{ left: pct(first.xAt(active)) }} />
            <LcdTooltip
              style={{ left: pct(first.xAt(active)), top: 0 }}
              side={active > (spec.count - 1) / 2 ? 'left' : 'right'}
              title={stamp}
              rows={spec.rows(active)}
            />
          </>
        )}
      </div>
      <div className="k-deriv-xaxis" data-slot="derivatives-xaxis" aria-hidden="true">
        {timeLabelIndexes(spec.count).map((index) => (
          <span key={index}>{formatTime(spec.times[index]!)}</span>
        ))}
      </div>
      <span className="sr-only" aria-live="polite">
        {active === null
          ? ''
          : `${stamp}${labels.separator}${spec
              .rows(active)
              .map((r) => `${r.label} ${r.value}`)
              .join(labels.separator)}`}
      </span>
    </div>
  )
}
