// SPDX-License-Identifier: MIT
import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '../lib/cn.ts'
import { Popover, PopoverContent, PopoverTrigger } from '../primitives/popover.tsx'
import { DistributionBars, type DistributionBarsProps } from '../quant/distribution-bars.tsx'
import { formatCnAmount } from './format.ts'
import { cnLabelsZh, type PulseLabels } from './labels.ts'
import { DASH, readCnValue, type CnValue } from './value.ts'

// 市场全景条（#110，信息结构取自复盘吧看盘工作台的首屏，样子是 Graphite 的）：一行横条，从左到右是上涨占比半圆表盘、五个大数（上涨 / 下跌 / 涨停 / 跌停 / 平盘）、
// 大数下面两行小字读数（涨停池、昨日口径、成交额与资金），最右嵌一块涨跌分布柱（DistributionBars）。高度不超过 3 行读数：小字读数最多两行，放不下的收进行尾「+n」（点开浮层看全部）；容器窄于 900px 时分布柱移到第二行最右，窄于 520px 时表盘收起。
// 涨红跌绿沿用 data-updown，件里不写死颜色。取不到的数写「—」，原因放悬停，不写 0。文字走 labels（默认简体中文），不带数据源。

export type MarketPulseCounts = {
  /** Number of rising stocks. */
  rising: CnValue
  /** Number of falling stocks. */
  falling: CnValue
  /** Number of limit-up stocks. */
  limitUp: CnValue
  /** Number of limit-down stocks. */
  limitDown: CnValue
  /** Number of flat stocks. */
  flat: CnValue
}

/** 小字读数：涨停数、金额（元）、板数都是数；取不到写 undefined、null 或带原因的对象。 */
export type MarketPulseReadings = {
  /** Limit-up stocks excluding ST, in the pool. */
  nonStLimitUp?: CnValue
  /** Stocks that touched the limit and opened. */
  broken?: CnValue
  /** The highest board count. */
  highestBoard?: CnValue
  /** Turnover of the limit-up stocks, in yuan. */
  limitUpAmount?: CnValue
  /** Estimated seal amount of the limit-up stocks, in yuan. */
  sealEstimate?: CnValue
  /** Yesterday's limit-up count. */
  yesterdayLimitUp?: CnValue
  /** Yesterday's limit-down count. */
  yesterdayLimitDown?: CnValue
  /** Yesterday's broken-limit count. */
  yesterdayBroken?: CnValue
  /** Turnover of both markets, in yuan. */
  turnover?: CnValue
  /** Forecast turnover of both markets, in yuan. */
  turnoverForecast?: CnValue
  /** Main-force net inflow, in yuan (signed). */
  mainNetInflow?: CnValue
}

export type MarketPulseProps = {
  /**
   * The five big counts: rising, falling, limit-up, limit-down and flat.
   * 五个大数：上涨、下跌、涨停、跌停、平盘家数。
   */
  counts: MarketPulseCounts
  /**
   * The small readings under the counts; a missing one is written as a dash with its reason on hover.
   * 大数下面的小字读数；缺的写「—」，原因放悬停。
   */
  readings?: MarketPulseReadings
  /**
   * Share of rising stocks (0 to 1) for the half-dial; worked out from the counts when omitted, null writes a dash.
   * 上涨占比（0 到 1），半圆表盘用；不给就由三个家数算，null 写「—」。
   */
  share?: number | null
  /**
   * A caller-written note after the yesterday readings (the basis date, for example).
   * 昨日读数后面的一句说明（例如基准日），由调用方写。
   */
  basis?: ReactNode
  /**
   * The change distribution on the right; leave it out to draw none.
   * 最右的涨跌分布柱；不给就不画。
   */
  distribution?: Pick<DistributionBarsProps, 'bins' | 'totals' | 'formatCount' | 'empty'>
  /**
   * Text pack; the Simplified Chinese default is used when omitted.
   * 文案；不传用简体中文默认。
   */
  labels?: PulseLabels
  /** Extra class names. */
  className?: string
}

const countText = (value: number | null) => (value === null ? DASH : value.toLocaleString('en-US'))

/** 上涨占比：上涨 /（上涨 + 下跌 + 平盘）；任何一个取不到、总数不是正数就是 null。纯函数。 */
export function pulseShare(counts: MarketPulseCounts): number | null {
  const rising = readCnValue(counts.rising).value
  const falling = readCnValue(counts.falling).value
  const flat = readCnValue(counts.flat).value
  if (rising === null || falling === null || flat === null) return null
  const total = rising + falling + flat
  return total > 0 ? rising / total : null
}

const R = 40
const CX = 50
const CY = 50
/** 半圆表盘的弧：从左端到占比对应的点，占比 0 到 1。纯函数。 */
export function dialArc(share: number): string {
  const s = Math.min(1, Math.max(0, share))
  const x = CX - R * Math.cos(Math.PI * s)
  const y = CY - R * Math.sin(Math.PI * s)
  return `M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)}`
}

type BigKey = keyof MarketPulseCounts
const BIG: readonly { key: BigKey; tone: 'up' | 'down' | 'muted' }[] = [
  { key: 'rising', tone: 'up' },
  { key: 'falling', tone: 'down' },
  { key: 'limitUp', tone: 'up' },
  { key: 'limitDown', tone: 'down' },
  { key: 'flat', tone: 'muted' },
]

export function MarketPulse({
  counts,
  readings = {},
  share,
  basis,
  distribution,
  labels = cnLabelsZh.pulse,
  className,
}: MarketPulseProps) {
  const ratio = share === undefined ? pulseShare(counts) : share
  const percent = ratio === null ? DASH : `${(ratio * 100).toFixed(1)}%`
  const box = useRef<HTMLDivElement>(null)
  const [hidden, setHidden] = useState<readonly string[]>([])

  type Item = {
    key: string
    tone?: 'up' | 'down'
    unavailable: boolean
    title?: string
    name: string
    value: ReactNode
  }
  const count = (value: number) => `${value.toLocaleString('en-US')}${labels.suffix.count}`
  const amount = (value: number) => formatCnAmount(value)
  const sign = (value: number): 'up' | 'down' | undefined => (value > 0 ? 'up' : value < 0 ? 'down' : undefined)
  const one = (
    key: Exclude<keyof PulseLabels['readings'], 'yesterday'>,
    format: (value: number) => string,
    tone?: (value: number) => 'up' | 'down' | undefined,
  ): Item => {
    const { value, reason } = readCnValue(readings[key])
    return {
      key,
      unavailable: value === null,
      tone: value === null ? undefined : tone?.(value),
      title: value === null ? (reason ?? labels.unavailable) : undefined,
      name: labels.readings[key],
      value: value === null ? DASH : format(value),
    }
  }
  const yesterday = (['yesterdayLimitUp', 'yesterdayLimitDown', 'yesterdayBroken'] as const).map((key) =>
    readCnValue(readings[key]),
  )
  const items: Item[] = [
    one('nonStLimitUp', count),
    one('broken', count),
    one('highestBoard', (value) => `${value}${labels.suffix.boards}`),
    one('limitUpAmount', amount),
    one('sealEstimate', amount),
    {
      key: 'yesterday',
      unavailable: false,
      name: labels.readings.yesterday,
      value: (
        <>
          {yesterday.map((item, position) => (
            <span
              key={position}
              data-unavailable={item.value === null ? 'true' : undefined}
              title={item.value === null ? (item.reason ?? labels.unavailable) : undefined}
            >
              {position > 0 && ' / '}
              {countText(item.value)}
            </span>
          ))}
          {basis !== undefined && <small className="k-pulse-basis">{basis}</small>}
        </>
      ),
    },
    one('turnover', amount),
    one('turnoverForecast', amount),
    one('mainNetInflow', (value) => formatCnAmount(value, { signed: true }), sign),
  ]
  const render = (item: Item, inPopover = false) => (
    <span
      key={item.key}
      className="k-pulse-read"
      data-slot={inPopover ? 'pulse-reading-more' : 'pulse-reading'}
      data-key={item.key}
      data-unavailable={item.unavailable ? 'true' : undefined}
      data-tone={item.tone}
      title={item.title}
      hidden={!inPopover && hidden.includes(item.key)}
    >
      <span className="k-pulse-read-name">{item.name}</span>
      <b>{item.value}</b>
    </span>
  )

  // 小字读数最多两行：测出第三行起的读数收进「+n」（给「+n」让出一项的位置）。服务端渲染时全部可见。
  const itemKeys = items.map((item) => item.key).join('|')
  useLayoutEffect(() => {
    const el = box.current
    if (!el) return
    const measure = () => {
      const nodes = Array.from(el.querySelectorAll<HTMLElement>('[data-slot="pulse-reading"]'))
      for (const node of nodes) node.hidden = false
      const limit = 2 * 18
      let first = nodes.findIndex((node) => node.offsetTop >= limit)
      if (first >= 0) first = Math.max(0, first - 1)
      const keys = first < 0 ? [] : nodes.slice(first).map((node) => node.dataset.key!)
      nodes.forEach((node, index) => {
        node.hidden = first >= 0 && index >= first
      })
      setHidden((prev) => (prev.join('|') === keys.join('|') ? prev : keys))
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [itemKeys, labels, basis])
  const rest = items.filter((item) => hidden.includes(item.key))

  return (
    <div className={cn('k-pulse', className)} data-slot="market-pulse" role="group" aria-label={labels.region}>
      <div className="k-pulse-dial" data-slot="pulse-dial" data-unavailable={ratio === null ? 'true' : undefined}>
        <svg viewBox="0 0 100 54" role="img" aria-label={labels.shareAria(percent)}>
          <path className="k-pulse-dial-track" d={`M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`} />
          {ratio !== null && ratio > 0 && <path className="k-pulse-dial-fill" d={dialArc(ratio)} />}
        </svg>
        <b className="k-pulse-share" title={ratio === null ? labels.unavailable : undefined}>
          {percent}
        </b>
        <span className="k-pulse-dial-caption">{labels.shareCaption}</span>
      </div>
      <div className="k-pulse-main">
        <dl className="k-pulse-counts">
          {BIG.map(({ key, tone }) => {
            const { value, reason } = readCnValue(counts[key])
            return (
              <div
                key={key}
                className="k-pulse-count"
                data-slot="pulse-count"
                data-key={key}
                data-tone={value === null ? undefined : tone}
                title={value === null ? (reason ?? labels.unavailable) : undefined}
              >
                <dt>{labels.counts[key]}</dt>
                <dd>
                  {countText(value)}
                  {value !== null && <small>{labels.unit}</small>}
                </dd>
              </div>
            )
          })}
        </dl>
        <div className="k-pulse-readings" data-slot="pulse-readings" ref={box}>
          {items.map((item) => render(item))}
          {rest.length > 0 && (
            <Popover>
              <PopoverTrigger asChild>
                <button type="button" className="k-pulse-more" data-slot="pulse-more">
                  +{rest.length}
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="k-pulse-more-list">
                {rest.map((item) => render(item, true))}
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>
      {distribution && (
        <div className="k-pulse-dist" data-slot="pulse-distribution">
          <p className="k-pulse-dist-title">{labels.distribution}</p>
          <DistributionBars {...distribution} label={labels.distribution} height={52} />
        </div>
      )}
    </div>
  )
}
