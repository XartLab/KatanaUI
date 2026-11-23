// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { MetricCard } from '../../src/quotes'

const asset = [18, 16, 17, 12, 13, 9, 10, 6, 4]

const drawdown = [4, 8, 6, 12, 10, 16, 12, 18, 14]

const stable = [10, 12, 9, 14, 11, 13, 10, 12, 11]

const exposure = [16, 14, 15, 10, 11, 8, 9, 5, 4]

export function SparkTileUsage() {
  const [clicks, setClicks] = useState(0)
  return (
    <>
      <div className="gal-grid-5" data-testid="spark-row">
        <MetricCard
          variant="tile"
          label="NET ASSET"
          value="2.42M"
          series={asset.map((v) => 20 - v)}
          labels={{ spark: '近 9 期净值走势' }}
          changePct={1.31}
          note="今日"
        />
        <MetricCard
          variant="tile"
          label="DRAWDOWN"
          value="-3.1%"
          series={drawdown}
          labels={{ spark: '近 9 期回撤走势' }}
          trendTone="neutral"
          note="峰值 -6.8% · 02-14"
        />
        <MetricCard
          variant="tile"
          label="TURNOVER"
          value="0.62"
          unit="/月"
          series={stable}
          labels={{ spark: '近 9 期换手' }}
          note="稳定"
        />
        <MetricCard
          variant="tile"
          label="EXPOSURE"
          value="131"
          unit="/ 150%"
          series={exposure.map((v) => 20 - v)}
          labels={{ spark: '近 9 期敞口，虚线是上限' }}
          threshold={19}
          status="near"
          note="接近上限"
        />
        <MetricCard
          variant="tile"
          label="SHARPE 60D"
          value={null}
          series={[]}
          labels={{ spark: '夏普：没有数据' }}
          note="等待数据"
        />
      </div>

      <div className="gal-grid-5">
        <MetricCard
          variant="tile"
          label="FILLS"
          value={String(clicks)}
          series={stable}
          labels={{ spark: '近 9 期成交' }}
          changePct={-0.8}
          note="点我 +1"
          onSelect={() => setClicks((n) => n + 1)}
        />
      </div>
    </>
  )
}
