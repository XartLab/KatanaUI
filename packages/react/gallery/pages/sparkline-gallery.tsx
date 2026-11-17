// SPDX-License-Identifier: MIT
// 迷你图画廊：五种画法、基准线、最高最低、悬停读数、成交量、断点、曲线、实时、表格行里的紧凑用法。数据都是演示用的（带种子的随机游走），不是行情。
import { useState } from 'react'
import { Button, MiniChart, Sparkline, type SparklineVariant } from '../../src/index'
import { LiveToggle } from '../LiveToggle'
import { makeRng, randomWalk, useLiveTicker } from '../live-sim'
import { Row } from './parts'

/** 带种子的随机游走：同一个种子永远同一串，截图与断言才稳。 */
function walk(seed: number, count: number, start = 100, pct = 0.006): number[] {
  const rng = makeRng(seed)
  const out = [start]
  for (let i = 1; i < count; i += 1) out.push(randomWalk(out[i - 1]!, rng, pct))
  return out
}

const DAY = walk(7, 48)
const DAY_DOWN = walk(11, 48, 100, 0.005).map((v, i) => v - i * 0.12)
const PREV_CLOSE = DAY[0]! - 0.6
/** 午休：11:30 到 13:00 没有成交，线在这里断开。 */
const WITH_LUNCH = DAY.map((v, i) => (i >= 20 && i < 26 ? null : v))
const HALTED = DAY.map((v, i) => (i >= 30 ? null : v))
const VOLUMES = walk(3, 48, 500, 0.4).map((v) => Math.abs(v))
const RETURNS = Array.from({ length: 24 }, (_, i) =>
  i % 7 === 3 ? 0 : Math.round((makeRng(40 + i)() - 0.45) * 100) / 100,
)
const TIMES = DAY.map(
  (_, i) => `${String(9 + Math.floor((i * 5) / 60)).padStart(2, '0')}:${String((i * 5) % 60).padStart(2, '0')}`,
)
const VARIANTS: readonly SparklineVariant[] = ['area', 'line', 'baseline', 'bars', 'winloss']
const VARIANT_NAME: Record<SparklineVariant, string> = {
  area: 'area 面积',
  line: 'line 线',
  baseline: 'baseline 基准分色',
  bars: 'bars 细柱',
  winloss: 'winloss 胜负格',
}
const money = (value: number) => value.toFixed(2)

const box = (width: number) => ({ width }) as const

function Case({
  id,
  width = 200,
  tall = false,
  caption,
  children,
}: {
  id: string
  width?: number
  tall?: boolean
  caption: string
  children: React.ReactNode
}) {
  return (
    <div className={`gal-spark-case${tall ? ' gal-spark-tall' : ''}`} style={box(width)} data-gallery-spark={id}>
      {children}
      <small className="gal-note">{caption}</small>
    </div>
  )
}

// —— TradingView 式：整个交易时段做横轴、线只画到现在 ——
// 演示的「沪深300」是一天 5 分钟线：上午 9:30 到 11:30、下午 13:00 到 15:00（UTC+8，时间戳用 UTC 毫秒写，不随机器时区变）。
const HOUR = 3_600_000
const MIN = 60_000
const DAY_OPEN = Date.UTC(2026, 10, 17, 1, 30)
const MORNING: readonly [number, number] = [DAY_OPEN, DAY_OPEN + 2 * HOUR]
const AFTERNOON: readonly [number, number] = [DAY_OPEN + 3.5 * HOUR, DAY_OPEN + 5.5 * HOUR]
const SESSIONS: readonly (readonly [number, number])[] = [MORNING, AFTERNOON]
const DOMAIN: readonly [number, number] = [MORNING[0], AFTERNOON[1]]
const PREV_INDEX = 4651.2
/** 第 n 根 5 分钟线的时间：上午 25 根（含 11:30），之后跳到 13:00 起算。 */
const barTime = (n: number) => (n <= 24 ? MORNING[0] + n * 5 * MIN : AFTERNOON[0] + (n - 25) * 5 * MIN)
/** 一天 50 个点：上午 25 个（9:30 到 11:30），下午 25 个（13:00 到 15:00）。 */
const BAR_COUNT = 50
const pad2 = (n: number) => String(n).padStart(2, '0')
/** 时间戳写成 UTC+8 的日期与时间（手写，不依赖机器时区与区域设置）。 */
const formatTime = (t: number) => {
  const d = new Date(t + 8 * HOUR)
  return {
    date: `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`,
    time: `${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())} UTC+8`,
  }
}
const formatTick = (t: number) => formatTime(t).time.slice(0, 5)
const money2 = (value: number) => value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

type Intraday = { values: readonly number[]; times: readonly number[] }
/** 开盘到 13:55（第 36 根）的演示数据；之后每走一步长一根，直到 15:00 收盘。 */
function intradayStart(): Intraday {
  const rng = makeRng(23)
  const values = [PREV_INDEX + 3.1]
  for (let n = 1; n <= 36; n += 1) values.push(randomWalk(values[n - 1]!, rng, 0.0011))
  return { values, times: values.map((_, n) => barTime(n)) }
}

export function TvStyleSection() {
  const { state, advance } = useLiveTicker<Intraday>(intradayStart, (day, rng) => {
    if (day.values.length >= BAR_COUNT) return day
    const n = day.values.length
    return {
      values: [...day.values, randomWalk(day.values[n - 1]!, rng, 0.0011)],
      times: [...day.times, barTime(n)],
    }
  })
  const last = state.values[state.values.length - 1]!
  const change = ((last - PREV_INDEX) / PREV_INDEX) * 100
  return (
    <Row name="TradingView 式（横轴是整个交易时段，线只画到现在）">
      <div className="gal-spark-tv-live" data-gallery-live="spark-tv">
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <LiveToggle labels={{ group: '数据刷新', live: '实时', paused: '暂停' }} />
          <Button size="sm" onClick={advance}>
            走一步
          </Button>
          <span className="gal-note">实时刷新（模拟数据，每步长一根 5 分钟线）</span>
        </div>
        <div className="gal-spark-tv" data-gallery-spark="tv-mini">
          <MiniChart
            symbol="000300"
            name="沪深300"
            badge="D"
            price={last}
            unit="CNY"
            formatPrice={money2}
            change={change}
            values={state.values}
            times={state.times}
            domain={DOMAIN}
            sessions={SESSIONS}
            formatTime={formatTime}
            live
            interactive
            labels={{ card: '沪深300 今日走势', chart: '沪深300 日内走势' }}
          />
        </div>
        <div className="gal-spark-tv gal-spark-intraday" data-gallery-spark="tv-intraday">
          <Sparkline
            values={state.values}
            label="沪深300 日内走势（示例数据）"
            tone={last >= PREV_INDEX ? 'up' : 'down'}
            times={state.times}
            domain={DOMAIN}
            sessions={SESSIONS}
            formatTime={formatTime}
            format={(value) => money2(value)}
            axis={{ price: 4, time: true, formatPrice: money2, formatTick }}
            lastTag
            interactive
          />
        </div>
        <small className="gal-note">
          示例数据，不是行情。横轴 9:30 到 15:00，午休（11:30 到
          13:00）压缩成一道细缝、线在那里断开；线只画到现在，右边留空，实时每走一步被填一格。
        </small>
      </div>
    </Row>
  )
}

export function SparklineGallery() {
  const [hovered, setHovered] = useState<number | null>(null)
  return (
    <>
      <p className="gal-note">迷你图画廊：{'示例数据，不是行情'}。</p>
      <TvStyleSection />
      <Row name="五种画法">
        {VARIANTS.map((variant) => (
          <Case key={variant} id={`variant-${variant}`} caption={VARIANT_NAME[variant]}>
            <Sparkline
              values={variant === 'winloss' ? RETURNS : DAY}
              label={`示例走势：${VARIANT_NAME[variant]}`}
              variant={variant}
              baseline={variant === 'baseline' || variant === 'bars' ? PREV_CLOSE : undefined}
            />
          </Case>
        ))}
      </Row>
      <Row name="昨收基准线（涨跌色按最后值对昨收）">
        <Case id="base-up" caption="高于昨收：涨色">
          <Sparkline values={DAY} baseline={DAY[DAY.length - 1]! - 1} label="示例走势：高于昨收" />
        </Case>
        <Case id="base-down" caption="低于昨收：跌色">
          <Sparkline values={DAY_DOWN} baseline={DAY_DOWN[DAY_DOWN.length - 1]! + 1} label="示例走势：低于昨收" />
        </Case>
      </Row>
      <Row name="最高最低带标签、右端最新值">
        <Case id="extremes" width={280} tall caption="showExtremes + extremeLabels + lastLabel">
          <Sparkline
            values={DAY}
            label="示例走势：带最高最低与最新值"
            showExtremes
            extremeLabels={[money(Math.max(...DAY)), money(Math.min(...DAY))]}
            lastLabel={money(DAY[DAY.length - 1]!)}
          />
        </Case>
      </Row>
      <Row name="悬停读数（interactive）">
        <Case
          id="hover"
          width={280}
          tall
          caption={hovered === null ? '移入图上，或 Tab 聚焦后按左右键' : `选中第 ${hovered + 1} 个点`}
        >
          <Sparkline
            values={DAY}
            label="示例走势：可悬停读数"
            interactive
            times={TIMES}
            format={(value) => money(value)}
            onHover={setHovered}
          />
        </Case>
      </Row>
      <Row name="成交量">
        <Case id="volume" width={280} tall caption="volumes（中性）">
          <Sparkline values={DAY} volumes={VOLUMES} label="示例走势：带成交量" />
        </Case>
        <Case id="volume-updown" width={280} tall caption="volumeTone=updown">
          <Sparkline values={DAY} volumes={VOLUMES} volumeTone="updown" label="示例走势：成交量按涨跌着色" />
        </Case>
      </Row>
      <Row name="断点">
        <Case id="gap-lunch" width={240} caption="午休：线与面积断开">
          <Sparkline values={WITH_LUNCH} baseline={PREV_CLOSE} label="示例走势：午休断开" />
        </Case>
        <Case id="gap-halt" width={240} caption="停牌：末端点取最后一个有效值">
          <Sparkline values={HALTED} baseline={PREV_CLOSE} label="示例走势：停牌" />
        </Case>
      </Row>
      <Row name="曲线">
        <Case id="curve-linear" caption="linear（默认）">
          <Sparkline values={DAY.slice(0, 16)} label="示例走势：折线" />
        </Case>
        <Case id="curve-monotone" caption="monotone：单调，不过冲">
          <Sparkline values={DAY.slice(0, 16)} curve="monotone" label="示例走势：单调曲线" />
        </Case>
      </Row>
      <Row name="表格行里（96 × 22，不开悬停）">
        <table className="gal-spark-table" data-gallery-spark="table">
          <tbody>
            {[
              ['示例甲', DAY],
              ['示例乙', DAY_DOWN],
              ['示例丙', WITH_LUNCH],
            ].map(([name, values]) => (
              <tr key={name as string}>
                <th scope="row">{name as string}</th>
                <td className="gal-spark-cell">
                  <Sparkline
                    values={values as number[]}
                    variant="line"
                    label={`${name as string}走势`}
                    showLast={false}
                  />
                </td>
                <td className="gal-spark-cell">
                  <Sparkline
                    values={values as number[]}
                    baseline={PREV_CLOSE}
                    label={`${name as string}走势（面积）`}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Row>
    </>
  )
}
