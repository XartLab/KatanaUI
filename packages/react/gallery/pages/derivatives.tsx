// SPDX-License-Identifier: MIT
// 交易数据看板（#245 模块 1）的文档站预览。数据是编出来的演示数据（闭式公式），不是行情；件不取数，切周期只发回调，
// 这里的回调把「哪张卡切到了哪个周期」写在旁边一行字里（e2e 读它），数据并不跟着周期变。
import { useState } from 'react'
import { DerivativesBoard, DerivativesCard, derivativesLabelsZh, type DerivativesKind } from '../../src/blocks/index.ts'
import { DERIVATIVES_DEMO } from '../usage/DerivativesBoardUsage.tsx'

const NOTE = '演示数据：编出来的，不是行情；件不取数，切周期只发回调，数据由调用方按周期换。'

export function DerivativesBoardDemo() {
  const [last, setLast] = useState('还没切过')
  const [period, setPeriod] = useState<Partial<Record<DerivativesKind, string>>>({ fundingRate: '14d' })
  return (
    <div className="gal-stack" style={{ width: '100%', maxWidth: 1180 }}>
      <p className="gal-note">
        {NOTE} 六张卡各有自己的周期按钮；资金费率是近 7 / 14 天（下面这块把它受控在 14 天）。悬停或用 ← →
        扫读，出悬停窗。
      </p>
      <p data-testid="derivatives-last">周期回调：{last}</p>
      <div data-testid="derivatives-board">
        <DerivativesBoard
          data={DERIVATIVES_DEMO}
          period={period}
          onPeriodChange={(kind, next) => {
            setPeriod((current) => ({ ...current, [kind]: next }))
            setLast(`${derivativesLabelsZh.cards[kind].title} → ${derivativesLabelsZh.periods[next] ?? next}`)
          }}
        />
      </div>
      <p className="gal-note">缺数据：没给的卡、给了空序列的卡、序列里全是缺失值的卡，各显示自己的空态，不画假数。</p>
      <div data-testid="derivatives-sparse">
        <DerivativesBoard
          kinds={['openInterestVolume', 'fundingRate', 'basis']}
          minCardWidth={300}
          data={{
            fundingRate: DERIVATIVES_DEMO.fundingRate,
            openInterestVolume: [],
            basis: DERIVATIVES_DEMO.basis.map((point) => ({ time: point.time, contract: null, index: null })),
          }}
        />
      </div>
      <p className="gal-note">单卡：任何一张都能单独放进自己的面板，kind 决定画法。</p>
      <div data-testid="derivatives-single" style={{ maxWidth: 420 }}>
        <DerivativesCard
          kind="longShortRatio"
          data={DERIVATIVES_DEMO.longShortRatio}
          defaultPeriod="1h"
          chartHeight={140}
        />
      </div>
    </div>
  )
}
