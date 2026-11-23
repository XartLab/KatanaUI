// SPDX-License-Identifier: MIT
// 账户四件（#104）：每件一张截图，取自文档站 usage 里的演示数据。测试名即文件名。
import { describe, test, expect } from 'vite-plus/test'
import { page } from 'vite-plus/test/browser'
import { AccountEquityUsage } from '../gallery/usage/AccountEquityUsage.tsx'
import { FundingRateUsage } from '../gallery/usage/FundingRateUsage.tsx'
import { OptionsChainUsage } from '../gallery/usage/OptionsChainUsage.tsx'
import { OrdersTableUsage } from '../gallery/usage/OrdersTableUsage.tsx'
import { PositionsTableUsage } from '../gallery/usage/PositionsTableUsage.tsx'
import { mount } from './render.tsx'

const items: Record<string, React.ReactNode> = {
  'positions-table': <PositionsTableUsage />,
  'orders-table': <OrdersTableUsage />,
  'account-equity': <AccountEquityUsage />,
  'funding-rate': <FundingRateUsage />,
  'options-chain': <OptionsChainUsage />,
}

for (const theme of ['graphite', 'console'] as const) {
  describe(theme, () => {
    for (const [name, node] of Object.entries(items)) {
      test(name, async () => {
        await page.viewport(1200, 1000)
        await mount(<div style={{ width: 1100 }}>{node}</div>, theme)
        await new Promise((r) => setTimeout(r, 250)) // 等测量与过渡走完
        await expect(page.getByTestId('frame')).toMatchScreenshot(`${theme}-account-${name}`)
      })
    }
  })
}
