// SPDX-License-Identifier: MIT
// 迷你图画廊：五种画法、基准线、最高最低、悬停读数、成交量、断点、曲线、实时、表格行里的紧凑用法。数据都是演示用的（带种子的随机游走），不是行情。
import { useState } from 'react'
import { Sparkline, type SparklineVariant } from '../../src/index'
import { makeRng, randomWalk } from '../live-sim'
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

export function SparklineGallery() {
  const [hovered, setHovered] = useState<number | null>(null)
  return (
    <>
      <p className="gal-note">迷你图画廊：{'示例数据，不是行情'}。</p>
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
