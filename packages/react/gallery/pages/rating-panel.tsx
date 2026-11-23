// SPDX-License-Identifier: MIT
// #150：技术评级三联 RatingPanel 的演示。下面的个数与分数都是演示数据（按周期在本页里编的，不是行情），页上也写明了。
import { useState } from 'react'
import { RatingPanel, type RatingPanelGauge, type RatingPanelLabels } from '../../src/quotes'
import { Row } from './parts'

const SAMPLE = '示例数据，不是行情'

export const RATING_PANEL_LABELS: RatingPanelLabels = {
  zones: ['强烈卖出', '卖出', '中性', '买入', '强烈买入'],
  verdict: { sell: '卖出', neutral: '中性', buy: '买入' },
  panel: '技术评级',
  timeframe: '周期',
}

export const RATING_PANEL_TIMEFRAMES = ['1m', '5m', '15m', '1h', '4h', '1D', '1W', '1M'].map((value) => ({
  value,
  label: value,
}))

// 每个周期一组演示个数：摆动指标 11 项、均线 15 项，汇总是两组相加；分数 = (买 − 卖) / 总数，跟常见的评级算法同一个意思，只为演示。
const OSC = { buy: [1, 2, 3, 5, 4, 6, 7, 3], sell: [6, 5, 3, 2, 3, 1, 1, 4] }
const MA = { buy: [2, 4, 7, 10, 12, 13, 14, 6], sell: [12, 9, 6, 4, 2, 1, 0, 8] }

const counts = (src: typeof OSC, total: number, i: number) => ({
  sell: src.sell[i]!,
  neutral: total - src.sell[i]! - src.buy[i]!,
  buy: src.buy[i]!,
})
const score = (c: { sell: number; neutral: number; buy: number }) => (c.buy - c.sell) / (c.sell + c.neutral + c.buy)

/** 第 i 个周期的三个仪表（摆动指标、汇总、均线）。 */
export function demoRatingGauges(i: number): RatingPanelGauge[] {
  const osc = counts(OSC, 11, i)
  const ma = counts(MA, 15, i)
  const sum = { sell: osc.sell + ma.sell, neutral: osc.neutral + ma.neutral, buy: osc.buy + ma.buy }
  return [
    { key: 'oscillators', label: '摆动指标', score: score(osc), counts: osc },
    { key: 'summary', label: '汇总', score: score(sum), counts: sum },
    { key: 'ma', label: '均线', score: score(ma), counts: ma },
  ]
}

export function RatingPanelDemo() {
  const [frame, setFrame] = useState('1D')
  const gauges = demoRatingGauges(RATING_PANEL_TIMEFRAMES.findIndex((tf) => tf.value === frame))
  return (
    <>
      <Row name="三联">
        <div data-gallery-rating-panel style={{ width: '100%', maxWidth: 560 }}>
          <RatingPanel
            gauges={gauges}
            labels={RATING_PANEL_LABELS}
            timeframes={RATING_PANEL_TIMEFRAMES}
            value={frame}
            onValueChange={setFrame}
            footer="评级只汇总指标读数，不是交易建议。"
          />
        </div>
      </Row>
      <Row name="窄栏 280px">
        <div data-gallery-rating-panel-narrow style={{ width: 280 }}>
          <RatingPanel gauges={gauges} labels={RATING_PANEL_LABELS} />
        </div>
      </Row>
      <p className="gal-note">
        {SAMPLE}。当前周期 <span data-testid="rating-panel-frame">{frame}</span>
        ；悬停或 Tab 到一个仪表，名字那一行换成分数与档位。
      </p>
    </>
  )
}
