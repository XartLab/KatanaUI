// SPDX-License-Identifier: MIT
import { useState } from 'react'
import {
  CompanyProfile,
  CrossRates,
  SymbolInfo,
  SymbolOverview,
  type SymbolOverviewItem,
} from '../../src/quotes/index.ts'
import { SeasonalChart, seasonalSeries } from '../../src/quant/index.ts'
import { makeRng, randomWalk } from '../live-sim'
import { Row } from './parts'

// KatanaUI #147（KATANAview #1884）：对照 TradingView 小组件补的第二批件的演示。品种、公司、汇率与走势全是固定种子生成的虚构演示数据，不是行情。

const SAMPLE = '演示数据，不是行情'
const DAY = 86_400_000
const START = Date.UTC(2026, 0, 2)

/** 固定种子的随机游走：count 个点，从 start 价起，每天一个。 */
function walk(seed: number, start: number, count: number, step = 0.012): { values: number[]; times: number[] } {
  const rng = makeRng(seed)
  const values: number[] = []
  let price = start
  for (let index = 0; index < count; index++) {
    price = randomWalk(price, rng, step)
    values.push(+price.toFixed(2))
  }
  return { values, times: values.map((_, index) => START + index * DAY) }
}

const overviewItem = (id: string, name: string, seed: number, start: number): SymbolOverviewItem => {
  const { values, times } = walk(seed, start, 120)
  const last = values.at(-1)!
  return { id, symbol: id, name, last, changePct: ((last - values[0]!) / values[0]!) * 100, values, times }
}

const OVERVIEW = [
  overviewItem('IDXA', 'Alpha 500 Index', 11, 5200),
  overviewItem('IDXB', 'Bravo Tech 100', 23, 18400),
  overviewItem('IDXC', 'Charlie Industrial 30', 37, 39100),
]

const RANGES = [
  { id: '1d', label: '1D' },
  { id: '1m', label: '1M' },
  { id: '3m', label: '3M' },
  { id: '12m', label: '1Y' },
  { id: '60m', label: '5Y' },
  { id: 'all', label: 'All' },
]

const formatDate = (time: number) => new Date(time).toISOString().slice(5, 10)
const groupPrice = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export function SymbolOverviewDemo() {
  const [range, setRange] = useState('3m')
  return (
    <>
      <Row name="price：只画选中的那只">
        <div className="gal-wide" style={{ maxWidth: 640 }}>
          <SymbolOverview
            items={OVERVIEW}
            ranges={RANGES}
            range={range}
            onRangeChange={setRange}
            formatPrice={groupPrice.format}
            formatTime={formatDate}
            labels={{ tabs: 'Symbols', ranges: 'Date range', chart: 'Price chart', empty: 'No data' }}
          />
        </div>
      </Row>
      <Row name="percent：几只叠在一起比涨跌">
        <div className="gal-wide" style={{ maxWidth: 640 }}>
          <SymbolOverview
            items={OVERVIEW}
            scale="percent"
            chartType="line"
            ranges={RANGES}
            defaultRange="3m"
            formatPrice={groupPrice.format}
            formatTime={formatDate}
            labels={{ tabs: 'Symbols', ranges: 'Date range', chart: 'Comparison chart', empty: 'No data' }}
          />
        </div>
      </Row>
      <p className="gal-note">
        {SAMPLE}。区间按钮只回调（这里不换数据）；悬停或聚焦图后按方向键出读数。percent 口径每条线相对自己的起点。
      </p>
    </>
  )
}

export function SymbolInfoDemo() {
  return (
    <>
      <Row name="报价头">
        <div className="gal-wide" style={{ maxWidth: 480 }}>
          <SymbolInfo
            symbol="AAA"
            name="Alpha Devices Incorporated"
            exchange="NASDAQ"
            last={212.4}
            change={-1.62}
            changePct={-0.76}
            unit="USD"
            status={{ tone: 'ok', label: 'Market open' }}
            ranges={[
              { id: 'day', title: "Day's range", low: 209.8, high: 215.35 },
              { id: '52w', title: '52 week range', low: 151.2, high: 238.9 },
            ]}
            footer="Delayed 15 min"
            label="Alpha Devices quote"
          />
        </div>
      </Row>
      <Row name="休市、没有区间">
        <div className="gal-wide" style={{ maxWidth: 480 }}>
          <SymbolInfo
            symbol="BRV"
            name="Bravo Semiconductor"
            exchange="NYSE"
            last={1044.1}
            change={12.4}
            changePct={1.2}
            unit="USD"
            formatPrice={groupPrice.format}
            status={{ tone: 'off', label: 'Market closed' }}
            label="Bravo Semiconductor quote"
          />
        </div>
      </Row>
      <p className="gal-note">{SAMPLE}。徽标是字母圆，不放真实公司标志。</p>
    </>
  )
}

const CURRENCIES = ['USD', 'EUR', 'JPY', 'GBP', 'CHF', 'AUD'] as const
// 演示用的「每种货币值多少美元」与当日涨跌（百分数），交叉汇率与涨跌由它们推出来，不是行情。
const USD_VALUE: Record<string, number> = { USD: 1, EUR: 1.083, JPY: 0.00644, GBP: 1.271, CHF: 1.118, AUD: 0.662 }
const DAY_CHANGE: Record<string, number> = { USD: 0, EUR: 0.18, JPY: -0.42, GBP: 0.31, CHF: -0.09, AUD: 0.66 }
const CROSS = CURRENCIES.flatMap((base) =>
  CURRENCIES.filter((quote) => quote !== base).map((quote) => ({
    base,
    quote,
    rate: USD_VALUE[base]! / USD_VALUE[quote]!,
    changePct: ((1 + DAY_CHANGE[base]! / 100) / (1 + DAY_CHANGE[quote]! / 100) - 1) * 100,
  })),
)
const NAMES: Record<string, string> = {
  USD: 'US dollar',
  EUR: 'Euro',
  JPY: 'Japanese yen',
  GBP: 'British pound',
  CHF: 'Swiss franc',
  AUD: 'Australian dollar',
}

export function CrossRatesDemo() {
  const [picked, setPicked] = useState('—')
  return (
    <>
      <Row name="rates">
        <div className="gal-wide" style={{ maxWidth: 680 }}>
          <CrossRates
            currencies={CURRENCIES}
            quotes={CROSS}
            names={NAMES}
            onSelect={(quote) => setPicked(`${quote.base}/${quote.quote}`)}
            labels={{ table: 'Cross rates', empty: 'Not connected' }}
          />
          <output data-gallery-picked>点的是：{picked}</output>
        </div>
      </Row>
      <Row name="heatmap">
        <div className="gal-wide" style={{ maxWidth: 680 }}>
          <CrossRates
            currencies={CURRENCIES}
            quotes={CROSS}
            mode="heatmap"
            names={NAMES}
            labels={{ table: 'Currency heatmap', empty: 'Not connected' }}
          />
        </div>
      </Row>
      <Row name="未连接">
        <CrossRates currencies={[]} quotes={[]} labels={{ table: 'Cross rates', empty: 'Not connected' }} />
      </Row>
      <p className="gal-note">
        {SAMPLE}。行是基准、列是计价；悬停或聚焦一格，行头列头加亮，方向键在格子间走，Enter 回调。
      </p>
    </>
  )
}

const PROFILE_TEXT =
  'Alpha Devices Incorporated designs and sells consumer electronics, computing hardware and related software and services. The company operates through segments by region and sells through its own retail and online stores as well as third-party resellers. It was founded as a garage workshop and later grew into a global supplier of components for other device makers. Research and development centers are spread across several countries, and manufacturing is mostly done by contract partners.'

export function CompanyProfileDemo() {
  return (
    <>
      <Row name="有数据">
        <div className="gal-wide" style={{ maxWidth: 480 }}>
          <CompanyProfile
            name="Alpha Devices Incorporated"
            facts={[
              { id: 'sector', label: 'Sector', value: 'Electronic technology' },
              { id: 'industry', label: 'Industry', value: 'Telecommunications equipment' },
              { id: 'employees', label: 'Employees (FY)', value: '161K' },
              { id: 'hq', label: 'Headquarters', value: 'Springfield' },
            ]}
            description={PROFILE_TEXT}
            collapsedLines={3}
            source="Profile as of 2026-09-30"
            labels={{ more: 'Show more', less: 'Show less', empty: 'Not connected' }}
          />
        </div>
      </Row>
      <Row name="未连接">
        <div className="gal-wide" style={{ maxWidth: 480 }}>
          <CompanyProfile
            name="Bravo Semiconductor"
            labels={{ more: 'Show more', less: 'Show less', empty: 'Not connected' }}
          />
        </div>
      </Row>
      <p className="gal-note">{SAMPLE}。公司与简介是虚构的。</p>
    </>
  )
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function seasonalDemoYears() {
  const points: { time: number; value: number }[] = []
  for (const [index, year] of [2022, 2023, 2024, 2025, 2026].entries()) {
    const rng = makeRng(101 + index)
    let price = 100
    // 今年只走到 11 月 20 日（演示「今年还没走完」）。
    const end = year === 2026 ? Date.UTC(2026, 10, 20) : Date.UTC(year, 11, 31)
    for (let time = Date.UTC(year, 0, 2); time <= end; time += DAY) {
      const weekday = new Date(time).getUTCDay()
      if (weekday === 0 || weekday === 6) continue
      price = randomWalk(price, rng, 0.01)
      points.push({ time, value: price })
    }
  }
  return seasonalSeries(points)
}

const SEASONAL = seasonalDemoYears()

export function SeasonalChartDemo() {
  return (
    <>
      <Row name="五年叠画">
        <div className="gal-wide" style={{ maxWidth: 720 }}>
          <SeasonalChart
            years={SEASONAL}
            defaultHidden={[2022]}
            labels={{ chart: 'Seasonals', legend: 'Years', months: MONTHS, empty: 'No data' }}
            source="Change from each year's first close"
          />
        </div>
      </Row>
      <Row name="没有数据">
        <div className="gal-wide" style={{ maxWidth: 720 }}>
          <SeasonalChart
            years={[]}
            height={120}
            labels={{ chart: 'Seasonals', legend: 'Years', months: MONTHS, empty: 'Not connected' }}
          />
        </div>
      </Row>
      <p className="gal-note">{SAMPLE}。点年份开关隐去 / 显出一年；悬停或聚焦图后按方向键出读数。</p>
    </>
  )
}
