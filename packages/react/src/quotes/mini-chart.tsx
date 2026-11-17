// SPDX-License-Identifier: MIT
// 迷你行情卡（MiniChart）：对应 TradingView 的 Mini Chart 小组件（tradingview.com/widget-docs/widgets/charts/mini-chart，2026-11-18 在浏览器里看的）。
// 看到的做法（只取做法，不抄代码与样式值）：卡片上一行「品种图标 + 代码 + 周期角标」，一行「价格 单位 + 涨跌幅（跌红）」，下面是走势：
// 线 1.5 到 2px 圆角连接，线下是很淡的同色渐变，末端一个实心点；没有基准线、没有坐标轴，默认也没有悬停十字线。
// 走势就是 Sparkline（area、末端点），给了时间戳与 domain 时线只画到现在、右边留空；价格实时变时用 RollingText 滚、涨跌幅闪色。
// 文字（读屏名、角标、单位）全由调用方传；颜色与字体走 token。
import type { MouseEvent } from 'react'
import { cn } from '../lib/cn.ts'
import { ChangeText } from './change-text.tsx'
import { quoteTone } from './quote-tone.ts'
import { RollingText } from '../katana/rolling-text.tsx'
import { Sparkline, type SparklineProps } from './sparkline.tsx'
import { SymbolMark } from './symbol-mark.tsx'

export type MiniChartProps = {
  /** Symbol code, shown beside the icon (and the letters of the icon when it has no image). */
  symbol: string
  /**
   * Name of the symbol; the icon's accessible name, and its letters when the code has none (600519).
   * 品种名称：图标的读屏名；代码里没有字母（600519）时图标取它的首字。
   */
  name?: string
  /**
   * Image address of the icon; letters are drawn when omitted or when it fails to load.
   * 图标的图片地址；不给或加载失败就画字母。
   */
  logoSrc?: string
  /**
   * Small tag after the code, such as the period (D); written by the caller.
   * 代码后面的小角标（如周期 D），由调用方写。
   */
  badge?: string
  /** The latest price. */
  price: number
  /**
   * Unit after the price (USD, CNY), written by the caller.
   * 价格后面的单位（USD、CNY），由调用方写。
   */
  unit?: string
  /**
   * Number of decimal places of the price when formatPrice is not given.
   * 价格的小数位数（没给 formatPrice 时用），默认 2。
   */
  digits?: number
  /**
   * Turns the price into text (thousands separators, locale); defaults to a plain fixed-point number.
   * 把价格写成文字（千分位、区域格式）；默认是定点小数。
   */
  formatPrice?: (price: number) => string
  /**
   * Change in percent (1.5 means +1.5%); decides the up, down or flat color of the card.
   * 涨跌幅，百分数（1.5 就是 +1.5%）；卡片的涨跌色按它走。
   */
  change: number
  /**
   * Price values for the chart from oldest to newest.
   * 走势的价格，从旧到新。
   */
  values: readonly (number | null | undefined)[]
  /** Millisecond timestamp of each value; with domain the line stops at the last point. */
  times?: SparklineProps['times']
  /** The whole time span of the chart in milliseconds. */
  domain?: SparklineProps['domain']
  /** Trading sessions in milliseconds; the gaps between them are squeezed out. */
  sessions?: SparklineProps['sessions']
  /** Turns a timestamp into the date and time lines of the hover readout. */
  formatTime?: SparklineProps['formatTime']
  /**
   * Reference value such as the previous close; draws a dashed line (off by default, as in TradingView).
   * 基准（如昨收）：给了才画虚线，默认没有（TradingView 的 Mini Chart 也没有）。
   */
  baseline?: number
  /** Hover readout and keyboard walking on the chart (off by default). */
  interactive?: boolean
  /**
   * Look of the chart, passed to Sparkline: default (unchanged), instrument or ascii.
   * 走势的画风，原样交给 Sparkline：default（不变）、instrument、ascii。
   */
  look?: SparklineProps['look']
  /** Height of the chart in pixels; 80 and above draws the line at 2px. Default 80. */
  chartHeight?: number
  /**
   * Live data: the price rolls when it changes and the change flashes the up or down color.
   * 实时数据：价格变了用滚轮滚动，涨跌幅闪涨跌色。
   */
  live?: boolean
  /**
   * When given the whole card is a button; keep interactive off then.
   * 给了整张卡是一个按钮（这时不要开 interactive）。
   */
  onSelect?: (event: MouseEvent<HTMLButtonElement>) => void
  /**
   * Texts for screen readers, written by the caller in the UI language (required).
   * 读屏用的文字，由调用方按界面语言写（必填）：card 是整张卡的名字，chart 是走势的名字（整句，含没有数据怎么说）。
   */
  labels: { card: string; chart: string }
  /** Extra class name on the root. */
  className?: string
}

export function MiniChart({
  symbol,
  name,
  logoSrc,
  badge,
  price,
  unit,
  digits = 2,
  formatPrice,
  change,
  values,
  times,
  domain,
  sessions,
  formatTime,
  baseline,
  interactive = false,
  look,
  chartHeight = 80,
  live = false,
  onSelect,
  labels,
  className,
}: MiniChartProps) {
  const tone = quoteTone(change)
  const priceText = formatPrice ? formatPrice(price) : price.toFixed(digits)
  const body = (
    <>
      <span className="k-mini-head">
        <SymbolMark code={symbol} name={name} src={logoSrc} size={20} />
        <span className="k-mini-symbol">{symbol}</span>
        {badge && <span className="k-mini-badge">{badge}</span>}
      </span>
      <span className="k-mini-quote">
        <span className="k-mini-price">
          {live ? <RollingText text={priceText} value={price} animate /> : priceText}
        </span>
        {unit && <span className="k-mini-unit">{unit}</span>}
        <ChangeText value={change} flash={live} arrow className="k-mini-change" />
      </span>
      <span className="k-mini-chart-body" style={{ height: chartHeight }}>
        <Sparkline
          values={values}
          label={labels.chart}
          tone={tone}
          baseline={baseline}
          times={times}
          domain={domain}
          sessions={sessions}
          formatTime={formatTime}
          interactive={interactive}
          look={look}
          format={(value) => (formatPrice ? formatPrice(value) : value.toFixed(digits))}
          height={chartHeight}
          className="k-mini-spark"
        />
      </span>
    </>
  )
  const classes = cn('k-mini-chart', `is-${tone}`, onSelect && 'is-link', className)
  return onSelect ? (
    <button type="button" className={classes} data-slot="mini-chart" aria-label={labels.card} onClick={onSelect}>
      {body}
    </button>
  ) : (
    <div className={classes} data-slot="mini-chart" role="group" aria-label={labels.card}>
      {body}
    </div>
  )
}
