// SPDX-License-Identifier: MIT
// 盘口三件（订单簿、深度图、成交明细，#104）的文档站预览：数据全是编出来的演示数据（gallery/book-sim.ts 的模拟器，固定种子），不是行情，不连任何交易所。
// 实时刷新可以用页上的「实时 / 暂停」开关停掉；自动化浏览器里默认暂停，用 window.__liveStep(n) 手动步进。
import { useState } from 'react'
import {
  DepthChart,
  OrderBook,
  PanelFrame,
  PanelFrameBody,
  PanelFrameHeader,
  TradeTape,
  type BookSide,
  type DepthChartLabels,
  type OrderBookLabels,
  type TradeTapeLabels,
} from '../../src/blocks/index.ts'
import { ToggleGroup, ToggleGroupItem } from '../../src/index.ts'
import { bookLevels, initialBook, stepBook } from '../book-sim'
import { LiveToggle } from '../LiveToggle'
import { useLiveTicker } from '../live-sim'

const NOTE = '演示数据：编出来的，不是行情；点「暂停」可以停住数据细看。'
const LIVE = { group: '数据刷新', live: '实时', paused: '暂停' }

function Frame({ heading, height, children }: { heading: string; height?: number; children: React.ReactNode }) {
  return (
    <div style={{ width: '100%', maxWidth: 420, height }}>
      <PanelFrame focused aria-label={heading}>
        <PanelFrameHeader heading={heading} object="演示数据" />
        <PanelFrameBody>{children}</PanelFrameBody>
      </PanelFrame>
    </div>
  )
}

const BOOK_LABELS: OrderBookLabels = {
  list: '订单簿（演示）',
  modes: { group: '显示模式', both: '买卖', bids: '只看买', asks: '只看卖' },
  tick: '合并档位',
  columns: { price: '价格', size: '数量', total: '累计' },
  bid: '买',
  ask: '卖',
  spread: '价差',
  share: (bid, ask) => `买盘占 ${bid}，卖盘占 ${ask}`,
  empty: '没有档位',
}

export function OrderBookDemo() {
  const { state } = useLiveTicker(initialBook, stepBook, { intervalMs: 1200 })
  const [picked, setPicked] = useState<{ price: number; side: BookSide } | null>(null)
  const { bids, asks } = bookLevels(state)
  return (
    <div className="gal-stack" style={{ width: '100%', maxWidth: 420 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <LiveToggle labels={LIVE} />
        <span className="gal-note">{NOTE}</span>
      </div>
      <Frame heading="订单簿 BTC-演示">
        <OrderBook
          bids={bids}
          asks={asks}
          priceDecimals={2}
          sizeDecimals={3}
          tickOptions={[0.01, 0.05, 0.1, 0.5, 1]}
          depth={8}
          last={state.last / 100}
          lastTone={state.tone}
          labels={BOOK_LABELS}
          onPriceSelect={(price, side) => setPicked({ price, side })}
        />
      </Frame>
      <p className="gal-note" data-gallery-picked>
        {picked
          ? `点价：${picked.price.toFixed(2)} · ${picked.side === 'bid' ? '买盘' : '卖盘'}（回填下单面板的价格由你的代码接）`
          : '点一行看回调收到什么'}
      </p>
    </div>
  )
}

const DEPTH_LABELS: DepthChartLabels = {
  chart: '深度图（演示）',
  bid: '买盘',
  ask: '卖盘',
  mid: '中间价',
  total: '累计量',
  offset: '距中间价',
  empty: '没有档位',
}

const RANGES = [
  { value: '0.3', label: '±0.3%' },
  { value: '0.8', label: '±0.8%' },
  { value: 'all', label: '全部' },
]

export function DepthChartDemo() {
  const { state } = useLiveTicker(initialBook, stepBook, { intervalMs: 1200 })
  const [range, setRange] = useState('0.8')
  const { bids, asks } = bookLevels(state)
  return (
    <div className="gal-stack" style={{ width: '100%', maxWidth: 560 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <LiveToggle labels={LIVE} />
        <ToggleGroup size="sm" aria-label="横轴范围" value={range} onValueChange={setRange}>
          {RANGES.map((item) => (
            <ToggleGroupItem key={item.value} value={item.value}>
              {item.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <span className="gal-note">{NOTE} 鼠标放上去读价格；也可以聚焦后按左右方向键。</span>
      </div>
      <div style={{ width: '100%' }}>
        <PanelFrame focused aria-label="深度图">
          <PanelFrameHeader heading="深度图 BTC-演示" object="演示数据" />
          <PanelFrameBody>
            <DepthChart
              bids={bids}
              asks={asks}
              priceDecimals={2}
              sizeDecimals={3}
              rangePct={range === 'all' ? null : Number(range)}
              height={240}
              labels={DEPTH_LABELS}
            />
          </PanelFrameBody>
        </PanelFrame>
      </div>
    </div>
  )
}

const TAPE_LABELS: TradeTapeLabels = {
  list: '成交明细（演示）',
  columns: { time: '时间', price: '价格', size: '数量' },
  sides: { buy: '主动买', sell: '主动卖' },
  count: (n) => `×${n}`,
  large: '大单',
  empty: '还没有成交',
}

export function TradeTapeDemo() {
  const { state } = useLiveTicker(initialBook, stepBook, { intervalMs: 1200 })
  const [aggregate, setAggregate] = useState('off')
  const [large, setLarge] = useState('1')
  return (
    <div className="gal-stack" style={{ width: '100%', maxWidth: 420 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <LiveToggle labels={LIVE} />
        <ToggleGroup size="sm" aria-label="聚合" value={aggregate} onValueChange={setAggregate}>
          <ToggleGroupItem value="off">逐笔</ToggleGroupItem>
          <ToggleGroupItem value="on">聚合</ToggleGroupItem>
        </ToggleGroup>
        <ToggleGroup size="sm" aria-label="大单阈值" value={large} onValueChange={setLarge}>
          <ToggleGroupItem value="1">≥ 1</ToggleGroupItem>
          <ToggleGroupItem value="5">≥ 5</ToggleGroupItem>
          <ToggleGroupItem value="none">无</ToggleGroupItem>
        </ToggleGroup>
        <span className="gal-note">{NOTE}</span>
      </div>
      <Frame heading="成交明细 BTC-演示" height={460}>
        <TradeTape
          trades={state.trades}
          priceDecimals={2}
          sizeDecimals={3}
          labels={TAPE_LABELS}
          aggregate={aggregate === 'on'}
          largeSize={large === 'none' ? undefined : Number(large)}
          maxRows={18}
        />
      </Frame>
    </div>
  )
}
