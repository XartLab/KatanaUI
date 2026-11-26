// SPDX-License-Identifier: MIT
// 交易数据看板（#245 模块 1）：整块六张卡、有空态的一块、加密的异动流，各一张截图。测试名即文件名（derivatives-board.tsx → 'derivatives-board'）。
import { describe, test, expect } from 'vite-plus/test'
import { page } from 'vite-plus/test/browser'
import { DerivativesBoard } from '../src/blocks'
import { MoveFeed, cnLabelsZh, type MoveItem } from '../src/cn'
import { DERIVATIVES_DEMO } from '../gallery/usage/DerivativesBoardUsage.tsx'
import { mount } from './render.tsx'
import { settled } from './settle.ts'

const COINS: MoveItem[] = [
  { id: 'k1', time: '10:00:05', name: 'BTC-USDT', symbol: 'BTC-USDT-SWAP', type: 'rise5m', value: 1.24 },
  { id: 'k2', time: '10:01:12', name: 'ETH-USDT', symbol: 'ETH-USDT-SWAP', type: 'fall5m', value: -2.38 },
  { id: 'k3', time: '10:04:21', name: 'BTC-USDT', symbol: 'BTC-USDT-SWAP', type: 'fall5m', value: -1.06 },
  { id: 'k4', time: '10:06:03', name: 'DOGE-USDT', symbol: 'DOGE-USDT-SWAP', type: 'rise5m', value: 4.7 },
]

const items: Record<string, React.ReactNode> = {
  'derivatives-board': <DerivativesBoard data={DERIVATIVES_DEMO} minCardWidth={420} />,
  'derivatives-board-empty': (
    <DerivativesBoard
      kinds={['fundingRate', 'takerVolume', 'basis']}
      minCardWidth={320}
      data={{ fundingRate: DERIVATIVES_DEMO.fundingRate, takerVolume: [] }}
    />
  ),
  'move-feed-crypto': (
    <div style={{ width: 460 }}>
      <MoveFeed
        items={COINS}
        currentSymbol="BTC-USDT-SWAP"
        defaultOnlyCurrent
        labels={{ ...cnLabelsZh.moveFeed, onlyCurrent: '当前币对' }}
      />
    </div>
  ),
}

for (const theme of ['graphite', 'console'] as const) {
  describe(theme, () => {
    for (const [name, node] of Object.entries(items)) {
      test(name, async () => {
        await page.viewport(1300, 1000)
        await mount(<div style={{ width: 1240 }}>{node}</div>, theme)
        await new Promise((r) => setTimeout(r, 250)) // 等测量与过渡走完
        await settled()
        await expect(page.getByTestId('frame')).toMatchScreenshot(`${theme}-derivatives-${name}`)
      })
    }
  })
}
