// SPDX-License-Identifier: MIT
// 账户四件（#104）：每件一张截图，取自文档站 usage 里的演示数据。测试名即文件名。
import { describe, test, expect } from 'vite-plus/test'
import { page } from 'vite-plus/test/browser'
import { AccountEquityUsage } from '../gallery/usage/AccountEquityUsage.tsx'
import { FUNDING_HISTORY, FUNDING_LABELS } from '../gallery/usage/FundingRateUsage.tsx'
import { FundingRate } from '../src/blocks'
import { OptionsChainUsage } from '../gallery/usage/OptionsChainUsage.tsx'
import { OrdersTableUsage } from '../gallery/usage/OrdersTableUsage.tsx'
import { PositionsTableUsage } from '../gallery/usage/PositionsTableUsage.tsx'
import { mount } from './render.tsx'
import { settled } from './settle.ts'

// 资金费率截图钉住的「现在」；倒计时终点 = 它 + 2:13:07，与演示一致。
const FIXED_NOW = Date.UTC(2026, 10, 24, 5, 46, 53)

const items: Record<string, React.ReactNode> = {
  'positions-table': <PositionsTableUsage />,
  'orders-table': <OrdersTableUsage />,
  'account-equity': <AccountEquityUsage />,
  // 演示用真时钟，截图慢过一秒倒计时就跳（#190 CI 上 07→06）：截图里钉住 now。
  'funding-rate': (
    <div style={{ width: '100%', maxWidth: 560 }}>
      <FundingRate
        rate={0.01}
        predictedRate={0.0082}
        nextSettlement={FIXED_NOW + (2 * 3600 + 13 * 60 + 7) * 1000}
        now={FIXED_NOW}
        history={FUNDING_HISTORY}
        labels={FUNDING_LABELS}
      />
    </div>
  ),
  'options-chain': <OptionsChainUsage />,
}

for (const theme of ['graphite', 'console'] as const) {
  describe(theme, () => {
    for (const [name, node] of Object.entries(items)) {
      test(name, async () => {
        await page.viewport(1200, 1000)
        await mount(<div style={{ width: 1100 }}>{node}</div>, theme)
        await new Promise((r) => setTimeout(r, 250)) // 等测量与过渡走完
        await settled()
        await expect(page.getByTestId('frame')).toMatchScreenshot(`${theme}-account-${name}`)
      })
    }
  })
}
